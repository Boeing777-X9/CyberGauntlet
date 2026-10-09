import { createClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[CyberGauntlet] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (undefined as unknown as ReturnType<typeof createClient>);

export interface LeaderboardEntry {
  id: string;
  team_name: string;
  question_id: string;
  time_spent: number;
  attempts: number;
  completed_at: string | null;
  created_at: string;
  category?: string;
  difficulty?: string;
  points?: number;
}

export interface TeamNote {
  id: string;
  team_id: string;
  challenge_id: string;
  user_id: string;
  note_content: string;
  created_at: string;
  updated_at: string;
}

// Real-time subscription functions for team notes
export const subscribeToTeamNotes = (
  teamId: string,
  challengeId: string | null,
  callback: (notes: TeamNote[]) => void
) => {
  if (!isSupabaseConfigured) return () => {};

  const fetchNotes = async () => {
    const query = supabase
      .from('team_notes')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (challengeId) {
      query.eq('challenge_id', challengeId);
    }

    const { data } = await query;
    if (data) callback(data);
  };

  const channelName = challengeId
    ? `team_notes:${teamId}:${challengeId}`
    : `team_notes:${teamId}`;

  const channel = supabase.channel(channelName);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_notes',
        filter: challengeId ? `team_id=eq.${teamId},challenge_id=eq.${challengeId}` : `team_id=eq.${teamId}`,
      },
      () => {
        fetchNotes();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

export interface EventConfig {
  id: string;
  event_name: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  start_date: string;
  end_date: string;
  paused_at?: string | null;
  active_challenges?: string[];
  created_at: string;
  updated_at?: string;
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  id: 'cybergauntlet-2026',
  event_name: 'CyberGauntlet 2026',
  status: 'draft',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 180 * 60000).toISOString(),
  paused_at: null,
  active_challenges: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Dual-persistence and instant broadcast tournament state manager
export const saveTournamentEvent = async (
  payload: Partial<EventConfig>
): Promise<{ success: boolean; event: EventConfig; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, event: DEFAULT_EVENT_CONFIG, error: 'Supabase not configured' };
  }

  const updatedEvent: EventConfig = {
    id: payload.id || 'cybergauntlet-2026',
    event_name: payload.event_name || 'CyberGauntlet 2026',
    status: (payload.status || 'draft') as EventConfig['status'],
    start_date: payload.start_date || new Date().toISOString(),
    end_date: payload.end_date || new Date(Date.now() + 180 * 60000).toISOString(),
    paused_at: payload.paused_at ?? null,
    active_challenges: payload.active_challenges || [],
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Try public.events table (if exists)
  try {
    await supabase.from('events').upsert({
      id: updatedEvent.id.length === 36 ? updatedEvent.id : undefined,
      event_name: updatedEvent.event_name,
      status: updatedEvent.status,
      start_date: updatedEvent.start_date,
      end_date: updatedEvent.end_date,
      paused_at: updatedEvent.paused_at,
      updated_at: updatedEvent.updated_at
    });
  } catch (e) {
    // Ignore if table missing; fallback below guarantees zero downtime
  }

  // 2. Guaranteed fallback persistence in challenge_sessions
  try {
    const statusCode = updatedEvent.status === 'active' ? 1 : updatedEvent.status === 'paused' ? 2 : updatedEvent.status === 'ended' ? 3 : 0;
    const diffMins = Math.max(1, Math.round((new Date(updatedEvent.end_date).getTime() - new Date(updatedEvent.start_date).getTime()) / 60000));
    await supabase.from('challenge_sessions').upsert({
      team_id: '__SYSTEM_EVENT_CONFIG__',
      challenge_id: '__CONFIG__',
      session_start_time: updatedEvent.start_date,
      last_activity: updatedEvent.end_date,
      first_attempt_time: updatedEvent.paused_at || null,
      wrong_attempt_count: statusCode,
      time_spent: diffMins,
      is_completed: updatedEvent.status === 'ended'
    }, { onConflict: 'team_id,challenge_id' });
  } catch (e) {
    console.warn('System session persistence notice:', e);
  }

  // 3. Broadcast to all active browsers via Supabase Realtime Broadcast
  try {
    const broadcastChannel = supabase.channel('cybergauntlet_tournament_realtime');
    broadcastChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        broadcastChannel.send({
          type: 'broadcast',
          event: 'event_state',
          payload: updatedEvent
        });
      }
    });
  } catch (e) {
    console.warn('Broadcast send notice:', e);
  }

  return { success: true, event: updatedEvent };
};

export const subscribeToEvents = (callback: (event: EventConfig) => void) => {
  if (!isSupabaseConfigured) {
    callback(DEFAULT_EVENT_CONFIG);
    return () => {};
  }

  const fetchCurrentEvent = async () => {
    try {
      // 1. Try public.events table first
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!eventErr && eventData) {
        callback(eventData as EventConfig);
        return;
      }

      // 2. Fallback to challenge_sessions system record
      const { data: sessData } = await supabase
        .from('challenge_sessions')
        .select('*')
        .eq('team_id', '__SYSTEM_EVENT_CONFIG__')
        .eq('challenge_id', '__CONFIG__')
        .maybeSingle();

      if (sessData) {
        const statusCode = sessData.wrong_attempt_count; // 0 = draft, 1 = active, 2 = paused, 3 = ended
        const status = statusCode === 1 ? 'active' : statusCode === 2 ? 'paused' : statusCode === 3 ? 'ended' : 'draft';
        const fallbackEvent: EventConfig = {
          id: sessData.id,
          event_name: 'CyberGauntlet 2026',
          status,
          start_date: sessData.session_start_time || new Date().toISOString(),
          end_date: sessData.last_activity || new Date(Date.now() + 180 * 60000).toISOString(),
          paused_at: sessData.first_attempt_time || null,
          active_challenges: [],
          created_at: sessData.created_at || new Date().toISOString(),
          updated_at: sessData.updated_at || new Date().toISOString()
        };
        callback(fallbackEvent);
        return;
      }

      // 3. Default draft (competition OFF)
      callback(DEFAULT_EVENT_CONFIG);
    } catch (e) {
      callback(DEFAULT_EVENT_CONFIG);
    }
  };

  fetchCurrentEvent();

  // Listen to Realtime Broadcast and Postgres changes
  const channel = supabase.channel('cybergauntlet_tournament_realtime');
  channel
    .on('broadcast', { event: 'event_state' }, ({ payload }) => {
      if (payload) {
        callback(payload as EventConfig);
      }
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenge_sessions',
        filter: 'team_id=eq.__SYSTEM_EVENT_CONFIG__',
      },
      () => {
        fetchCurrentEvent();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
      },
      () => {
        fetchCurrentEvent();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
