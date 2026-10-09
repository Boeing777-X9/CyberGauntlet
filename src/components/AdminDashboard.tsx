import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle, RefreshCw, Shield, BookOpen, ClipboardList, BarChart3, ChevronDown, ChevronUp, Eye, EyeOff, KeyRound, Users, Trophy, Activity, Radio, Clock, Play, Pause, Square, FastForward, AlertTriangle, Lock, Unlock, RotateCcw, Timer } from 'lucide-react';
import { supabase, isSupabaseConfigured, LeaderboardEntry, EventConfig, subscribeToEvents } from '../lib/supabase';
import { GlitchText } from './GlitchText';
import { TerminalBox } from './TerminalBox';

interface AdminDashboardProps { onLogout: () => void; }
type Tab = 'overview' | 'event_control' | 'challenges' | 'add' | 'submissions' | 'reset_requests' | 'participants' | 'live_monitor' | 'leaderboard';

interface LiveSession {
  id: string;
  team_id: string;
  challenge_id: string;
  wrong_attempt_count: number;
  hint_reveal_count: number;
  time_spent: number;
  is_completed: boolean;
  last_activity: string;
}

interface ResetRequest {
  id: string;
  email: string;
  team_name?: string;
  status: 'pending' | 'resolved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

interface Participant {
  id: string;
  team_id: string;
  team_name: string;
  leader_name: string;
  email: string;
  phone?: string;
  college?: string;
  round_1_score: number;
  round_1_level: number;
  status: string;
}

interface Challenge {
  id: string; title: string; description: string; category: string;
  difficulty: string; hints: string[]; file_name: string;
  file_path: string; is_active: boolean; created_at: string;
}
interface Submission {
  id: string; title: string; description: string; category: string;
  difficulty: string; status: 'pending'|'approved'|'rejected';
  created_at: string; hints: string[];
}
interface Stats {
  totalChallenges: number; activeChallenges: number;
  pendingSubmissions: number; totalLeaderboard: number;
}

const EMPTY_FORM = {
  id: '', title: '', description: '', category: 'Steganography',
  difficulty: 'Beginner', correct_flag: '', file_name: '', file_path: '',
  hints: ['', '', ''],
};
const CATEGORIES = ['Steganography', 'OSINT', 'Cryptography', 'Forensics', 'Miscellaneous'];
const DIFFICULTIES = ['Beginner','Intermediate','Advanced'];

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalChallenges:0, activeChallenges:0, pendingSubmissions:0, totalLeaderboard:0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{text:string;ok:boolean}|null>(null);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showFlag, setShowFlag] = useState(false);
  const [processing, setProcessing] = useState<string|null>(null);

  // Tournament Event Management State
  const [currentEvent, setCurrentEvent] = useState<EventConfig | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [eventDurationMinutes, setEventDurationMinutes] = useState<number>(180);
  const [customExtendMins, setCustomExtendMins] = useState<number>(15);
  const [eventUpdating, setEventUpdating] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToEvents((evt) => {
      setCurrentEvent(evt);
    });
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const eventStatus = currentEvent?.status || 'draft';
  const isEventActive = eventStatus === 'active' && currentEvent ? (new Date(currentEvent.end_date).getTime() > nowTick) : false;
  const isEventPaused = eventStatus === 'paused';
  const isEventEnded = eventStatus === 'ended' || (eventStatus === 'active' && currentEvent && new Date(currentEvent.end_date).getTime() <= nowTick);
  const isEventDraft = eventStatus === 'draft';

  let eventSecondsRemaining = 0;
  if (currentEvent) {
    if (isEventPaused && currentEvent.paused_at) {
      const endMs = new Date(currentEvent.end_date).getTime();
      const pausedMs = new Date(currentEvent.paused_at).getTime();
      eventSecondsRemaining = Math.max(0, Math.floor((endMs - pausedMs) / 1000));
    } else if (currentEvent.status === 'active') {
      const endMs = new Date(currentEvent.end_date).getTime();
      eventSecondsRemaining = Math.max(0, Math.floor((endMs - nowTick) / 1000));
    }
  }

  const formatCountdownClock = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartEvent = async (durationMins: number = eventDurationMinutes) => {
    setEventUpdating(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + durationMins * 60000);
      const payload = {
        event_name: currentEvent?.event_name || 'CyberGauntlet 2026',
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        paused_at: null,
        updated_at: now.toISOString()
      };

      if (currentEvent?.id) {
        const { error } = await supabase.from('events').update(payload).eq('id', currentEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert([payload]);
        if (error) throw error;
      }
      flash(`Competition started! Timer set to ${durationMins} minutes.`);
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to start competition. Run events migration in Supabase SQL Editor if table is missing.', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const handlePauseEvent = async () => {
    if (!currentEvent?.id) return;
    setEventUpdating(true);
    try {
      const now = new Date();
      const { error } = await supabase.from('events').update({
        status: 'paused',
        paused_at: now.toISOString(),
        updated_at: now.toISOString()
      }).eq('id', currentEvent.id);
      if (error) throw error;
      flash('Competition PAUSED! Flag submissions are locked for all participants.');
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to pause competition', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const handleResumeEvent = async () => {
    if (!currentEvent?.id) return;
    setEventUpdating(true);
    try {
      const now = new Date();
      const pauseDuration = currentEvent.paused_at
        ? Math.max(0, now.getTime() - new Date(currentEvent.paused_at).getTime())
        : 0;
      const currentEnd = new Date(currentEvent.end_date).getTime();
      const newEndDate = new Date(currentEnd + pauseDuration).toISOString();

      const { error } = await supabase.from('events').update({
        status: 'active',
        end_date: newEndDate,
        paused_at: null,
        updated_at: now.toISOString()
      }).eq('id', currentEvent.id);
      if (error) throw error;
      flash('Competition RESUMED! Timer extended by pause duration.');
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to resume competition', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const handleExtendTime = async (minutesToAdd: number) => {
    if (!currentEvent?.id) {
      flash('No active event found. Start an event first.', false);
      return;
    }
    setEventUpdating(true);
    try {
      const currentEnd = new Date(currentEvent.end_date).getTime();
      const baseTime = Math.max(Date.now(), currentEnd);
      const newEndDate = new Date(baseTime + minutesToAdd * 60000).toISOString();

      const { error } = await supabase.from('events').update({
        end_date: newEndDate,
        status: currentEvent.status === 'ended' ? 'active' : currentEvent.status,
        updated_at: new Date().toISOString()
      }).eq('id', currentEvent.id);
      if (error) throw error;
      flash(`Competition extended by +${minutesToAdd} minutes!`);
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to extend time', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const handleStopEvent = async () => {
    if (!currentEvent?.id) return;
    if (!confirm('Are you sure you want to STOP and conclude the competition now? Submissions will be locked immediately for all participants.')) return;
    setEventUpdating(true);
    try {
      const now = new Date();
      const { error } = await supabase.from('events').update({
        status: 'ended',
        end_date: now.toISOString(),
        updated_at: now.toISOString()
      }).eq('id', currentEvent.id);
      if (error) throw error;
      flash('Competition STOPPED! All submissions locked, final scores preserved.');
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to stop competition', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const handleResetEvent = async () => {
    if (!currentEvent?.id) return;
    if (!confirm('Reset competition status back to DRAFT?')) return;
    setEventUpdating(true);
    try {
      const { error } = await supabase.from('events').update({
        status: 'draft',
        paused_at: null,
        updated_at: new Date().toISOString()
      }).eq('id', currentEvent.id);
      if (error) throw error;
      flash('Event reset to DRAFT mode.');
    } catch (err: any) {
      console.error(err);
      flash(err.message || 'Failed to reset event', false);
    } finally {
      setEventUpdating(false);
    }
  };

  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const groupedTeamActivity = useMemo(() => {
    const map = new Map<string, LiveSession[]>();
    liveSessions.forEach(sess => {
      if (!map.has(sess.team_id)) {
        map.set(sess.team_id, []);
      }
      map.get(sess.team_id)!.push(sess);
    });

    return Array.from(map.entries()).map(([team_id, sessions]) => {
      sessions.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
      const latest = sessions[0];
      const totalWrong = sessions.reduce((acc, s) => acc + (s.wrong_attempt_count || 0), 0);
      const totalHints = sessions.reduce((acc, s) => acc + (s.hint_reveal_count || 0), 0);
      const completedCount = sessions.filter(s => s.is_completed).length;

      return {
        team_id,
        latest_challenge_id: latest.challenge_id,
        latest_status: latest.is_completed,
        latest_time_spent: latest.time_spent || 0,
        latest_ping: latest.last_activity,
        total_wrong_attempts: totalWrong,
        total_hints_used: totalHints,
        total_challenges_visited: sessions.length,
        total_challenges_completed: completedCount,
        sessions
      };
    }).sort((a, b) => new Date(b.latest_ping).getTime() - new Date(a.latest_ping).getTime());
  }, [liveSessions]);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [cRes, sRes, lRes, rRes, pRes, sessRes, lbFullRes] = await Promise.all([
        supabase.from('challenges').select('id,title,description,category,difficulty,hints,file_name,file_path,is_active,created_at').order('created_at', { ascending: false }),
        supabase.from('challenge_submissions').select('id,title,description,category,difficulty,status,created_at,hints').order('created_at', { ascending: false }),
        supabase.from('leaderboard').select('id', { count: 'exact', head: true }).not('completed_at','is',null),
        supabase.from('password_reset_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('participants').select('*').order('team_name', { ascending: true }),
        supabase.from('challenge_sessions').select('*').order('last_activity', { ascending: false }),
        supabase.from('leaderboard').select('*').order('completed_at', { ascending: false }),
      ]);
      const cData = cRes.data || [];
      const sData = sRes.data || [];
      setChallenges(cData);
      setSubmissions(sData);
      setResetRequests(rRes.data || []);
      setParticipants(pRes.data || []);
      setLiveSessions(sessRes.data || []);
      setLeaderboardEntries(lbFullRes.data || []);
      setStats({
        totalChallenges: cData.length,
        activeChallenges: cData.filter((c: Challenge) => c.is_active).length,
        pendingSubmissions: sData.filter((s: Submission) => s.status === 'pending').length,
        totalLeaderboard: lRes.count || 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const invoke = async (action: string, body: object) => {
    const { data, error } = await supabase.functions.invoke('admin-challenge', { body: { action, ...body } });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Operation failed');
    return data;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const hints = form.hints.filter(h => h.trim());
      await invoke('create', { ...form, hints });
      flash(`Challenge "${form.title}" created!`);
      setForm({ ...EMPTY_FORM });
      fetchAll();
      setTab('challenges');
    } catch (e: any) { flash(e.message, false); }
    finally { setSaving(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      const hints = form.hints.filter(h => h.trim());
      const payload: any = { id: editId, title: form.title, description: form.description, category: form.category, difficulty: form.difficulty, hints, file_name: form.file_name, file_path: form.file_path };
      if (form.correct_flag.trim()) payload.new_flag = form.correct_flag.trim();
      await invoke('update', payload);
      flash('Challenge updated!');
      setEditId(null);
      setForm({ ...EMPTY_FORM });
      fetchAll();
    } catch (e: any) { flash(e.message, false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete challenge "${title}"? This cannot be undone.`)) return;
    setProcessing(id);
    try {
      await invoke('delete', { id });
      flash(`"${title}" deleted.`);
      fetchAll();
    } catch (e: any) { flash(e.message, false); }
    finally { setProcessing(null); }
  };

  const handleToggle = async (c: Challenge) => {
    setProcessing(c.id);
    try {
      await invoke('toggle_active', { id: c.id, is_active: !c.is_active });
      flash(`"${c.title}" ${!c.is_active ? 'activated' : 'deactivated'}.`);
      fetchAll();
    } catch (e: any) { flash(e.message, false); }
    finally { setProcessing(null); }
  };

  const handleApprove = async (s: Submission) => {
    setProcessing(s.id);
    try {
      const { data, error } = await supabase.functions.invoke('approve-challenge', { body: { submission_id: s.id } });
      if (error || !data?.success) throw new Error(data?.error || error?.message);
      flash(data.message);
      fetchAll();
    } catch (e: any) { flash(e.message, false); }
    finally { setProcessing(null); }
  };

  const handleReject = async (s: Submission) => {
    setProcessing(s.id);
    try {
      const { error } = await supabase.from('challenge_submissions').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', s.id);
      if (error) throw error;
      flash('Submission rejected.');
      fetchAll();
    } catch (e: any) { flash(e.message, false); }
    finally { setProcessing(null); }
  };

  const startEdit = (c: Challenge) => {
    setForm({ id: c.id, title: c.title, description: c.description, category: c.category, difficulty: c.difficulty, correct_flag: '', file_name: c.file_name, file_path: c.file_path, hints: [...c.hints, '', ''].slice(0, 3) });
    setEditId(c.id);
    setTab('add');
  };

  const hintChange = (i: number, v: string) => setForm(f => { const h = [...f.hints]; h[i] = v; return { ...f, hints: h }; });

  const diffColor = (d: string) => d === 'Beginner' ? 'text-green-400 border-green-500' : d === 'Intermediate' ? 'text-yellow-400 border-yellow-500' : 'text-red-400 border-red-500';

  const renderEventControlPanel = (isOverview = false) => {
    return (
      <div className="border border-green-500/40 bg-zinc-950/85 rounded-lg p-5 shadow-[0_0_25px_rgba(34,197,94,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-green-500/20">
          <div>
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-green-400" />
              <h2 className="text-lg font-black tracking-wide text-white">
                {currentEvent?.event_name || 'CyberGauntlet 2026'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isEventActive ? 'bg-green-500/20 text-green-400 border-green-500/50 animate-pulse' :
                isEventPaused ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                isEventEnded ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                'bg-blue-500/20 text-blue-400 border-blue-500/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isEventActive ? 'bg-green-400 animate-ping' :
                  isEventPaused ? 'bg-yellow-400' :
                  isEventEnded ? 'bg-red-400' :
                  'bg-blue-400'
                }`} />
                {eventStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-green-300/60 text-xs mt-1">
              {isEventActive && `Active competition running · Submissions OPEN · Auto-locks when timer reaches 00:00:00`}
              {isEventPaused && `Competition PAUSED · All submissions are FROZEN across all devices`}
              {isEventEnded && `Competition CONCLUDED · Submissions LOCKED · All responses safely saved in DB`}
              {isEventDraft && `Draft mode · Configure duration and press START to open tournament`}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/60 border border-green-500/30 px-5 py-2.5 rounded-lg">
            <Clock className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                {isEventActive ? 'Time Remaining' : isEventPaused ? 'Paused At' : isEventEnded ? 'Event Ended' : 'Preset Duration'}
              </div>
              <div className="text-2xl font-black font-mono tracking-wider text-green-300">
                {isEventActive || isEventPaused ? formatCountdownClock(eventSecondsRemaining) :
                 isEventDraft ? `${Math.floor(eventDurationMinutes / 60)}h ${eventDurationMinutes % 60}m` : '00:00:00'}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(!isEventActive && !isEventPaused) ? (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-black/40 border border-green-500/30 rounded p-1">
                <span className="text-xs text-green-500 px-2 font-bold">Duration:</span>
                {[60, 120, 180, 240].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEventDurationMinutes(m)}
                    className={`px-2.5 py-1 text-xs rounded font-bold transition-all ${
                      eventDurationMinutes === m
                        ? 'bg-green-500 text-black shadow-sm'
                        : 'text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {m / 60}h
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={eventUpdating}
                onClick={() => handleStartEvent(eventDurationMinutes)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black px-5 py-2.5 rounded text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                START COMPETITION NOW
              </button>
            </div>
          ) : (
            <>
              {isEventActive && (
                <button
                  type="button"
                  disabled={eventUpdating}
                  onClick={handlePauseEvent}
                  className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500 text-yellow-300 font-bold px-4 py-2.5 rounded text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  PAUSE COMPETITION
                </button>
              )}
              {isEventPaused && (
                <button
                  type="button"
                  disabled={eventUpdating}
                  onClick={handleResumeEvent}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black px-4 py-2.5 rounded text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  RESUME COMPETITION
                </button>
              )}
              <button
                type="button"
                disabled={eventUpdating}
                onClick={handleStopEvent}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 font-bold px-4 py-2.5 rounded text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-red-400" />
                END COMPETITION NOW
              </button>
            </>
          )}

          {/* Quick Extenders */}
          {currentEvent && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="text-xs text-green-500/80 font-bold uppercase tracking-wider flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-green-400" />
                Extend:
              </span>
              {[5, 10, 15, 30, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  disabled={eventUpdating}
                  onClick={() => handleExtendTime(mins)}
                  className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/25 border border-green-500/40 text-green-300 hover:text-green-200 rounded text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  +{mins}m
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={customExtendMins}
                  onChange={(e) => setCustomExtendMins(parseInt(e.target.value) || 1)}
                  className="w-14 bg-black/60 border border-green-500/30 rounded px-2 py-1 text-xs text-green-300 font-mono text-center focus:border-green-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={eventUpdating}
                  onClick={() => handleExtendTime(customExtendMins)}
                  className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 text-blue-300 rounded text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  +Add
                </button>
              </div>
            </div>
          )}

          {isEventEnded && (
            <button
              type="button"
              disabled={eventUpdating}
              onClick={handleResetEvent}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-2 border border-gray-700 rounded transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Draft
            </button>
          )}
        </div>

        {/* Informational Lock Indicator */}
        <div className="mt-4 pt-3 border-t border-green-500/15 flex flex-wrap items-center justify-between text-xs text-green-300/70 gap-2">
          <div className="flex items-center gap-2">
            {isEventActive ? (
              <>
                <Unlock className="w-4 h-4 text-green-400" />
                <span>Live Submissions: <strong className="text-green-400">OPEN</strong> (Auto-lock will engage when timer reaches 00:00:00)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-red-400" />
                <span>Submissions: <strong className="text-red-400">LOCKED</strong> (Contestants cannot submit flags; all responses & scores safely stored)</span>
              </>
            )}
          </div>
          <div className="text-green-600 font-mono">
            {currentEvent?.end_date && `Scheduled End: ${new Date(currentEvent.end_date).toLocaleTimeString()}`}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center font-mono">
      <div className="text-green-400 text-center animate-pulse"><Shield className="w-12 h-12 mx-auto mb-3"/><p>Loading admin terminal...</p></div>
    </div>
  );

  const tabBtn = (t: Tab, label: string, Icon: any) => (
    <button onClick={() => { setTab(t); setEditId(null); setForm({ ...EMPTY_FORM }); }}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 ${tab === t ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-transparent text-green-600 hover:text-green-400 hover:bg-green-500/5'}`}>
      <Icon className="w-4 h-4"/>{label}
    </button>
  );

  const inputCls = "w-full bg-black/60 border border-green-500/30 rounded px-3 py-2 text-green-300 placeholder-green-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 text-sm";
  const labelCls = "block text-green-400 text-xs font-bold mb-1 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400 font-mono">
      <div className="scanlines"/>
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-green-500/30 bg-black/40 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black"><GlitchText text="ADMIN" className="text-green-500"/> <span className="text-green-400">TERMINAL</span></h1>
            <p className="text-green-600 text-xs mt-0.5">CyberGauntlet Control Panel</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded text-sm transition-all">
            <LogOut className="w-4 h-4"/>LOGOUT
          </button>
        </header>

        {/* Flash message */}
        {msg && (
          <div className={`mx-6 mt-4 p-3 rounded border flex items-center gap-2 text-sm ${msg.ok ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
            {msg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0"/> : <XCircle className="w-4 h-4 flex-shrink-0"/>}
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-green-500/20 bg-black/20 px-2 overflow-x-auto">
          {tabBtn('overview', 'Overview', BarChart3)}
          {tabBtn('event_control', 'Event Control & Timer', Clock)}
          {tabBtn('live_monitor', `Live Activity (${groupedTeamActivity.length} Teams)`, Radio)}
          {tabBtn('leaderboard', `Leaderboard (${leaderboardEntries.length})`, Trophy)}
          {tabBtn('challenges', 'Challenges', BookOpen)}
          {tabBtn('add', editId ? 'Edit Challenge' : 'Add Challenge', Plus)}
          {tabBtn('submissions', `Submissions${stats.pendingSubmissions > 0 ? ` (${stats.pendingSubmissions})` : ''}`, ClipboardList)}
          {tabBtn('reset_requests', `Reset Requests${resetRequests.filter(r => r.status === 'pending').length > 0 ? ` (${resetRequests.filter(r => r.status === 'pending').length})` : ''}`, KeyRound)}
          {tabBtn('participants', `Participants (${participants.length})`, Users)}
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {renderEventControlPanel(true)}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Challenges', value: stats.totalChallenges, color: 'green' },
                  { label: 'Active', value: stats.activeChallenges, color: 'blue' },
                  { label: 'Pending Review', value: stats.pendingSubmissions, color: 'yellow' },
                  { label: 'Completions', value: stats.totalLeaderboard, color: 'purple' },
                ].map(s => (
                  <div key={s.label} className={`border border-${s.color}-500/50 bg-${s.color}-500/5 p-5 rounded-lg`}>
                    <div className={`text-3xl font-black text-${s.color}-400`}>{s.value}</div>
                    <div className={`text-${s.color}-600 text-xs mt-1 uppercase tracking-wider`}>{s.label}</div>
                  </div>
                ))}
              </div>
              <TerminalBox title="quick_actions.sh">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setTab('event_control')} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded text-sm transition-all"><Clock className="w-4 h-4"/>Event & Timer Controls</button>
                  <button onClick={() => setTab('add')} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded text-sm transition-all"><Plus className="w-4 h-4"/>New Challenge</button>
                  <button onClick={() => setTab('submissions')} className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-2 rounded text-sm transition-all"><ClipboardList className="w-4 h-4"/>Review Submissions</button>
                  <button onClick={fetchAll} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-2 rounded text-sm transition-all"><RefreshCw className="w-4 h-4"/>Refresh Data</button>
                </div>
              </TerminalBox>
            </div>
          )}

          {/* EVENT CONTROL TAB */}
          {tab === 'event_control' && (
            <div className="space-y-6">
              <TerminalBox title="event_control_center.sh">
                <div className="space-y-6">
                  {renderEventControlPanel(false)}

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 space-y-2">
                      <h4 className="font-bold text-green-400 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-green-400" /> Auto-Lock & Anti-Tamper Security
                      </h4>
                      <p className="text-xs text-green-300/70 leading-relaxed">
                        When the timer reaches 00:00:00, or when you pause/stop the event, submission locks engage both in the contestant browser and in PostgreSQL server functions.
                        No one can submit late flags. Contestant scores and times are preserved exactly as they were.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 space-y-2">
                      <h4 className="font-bold text-yellow-400 flex items-center gap-2 text-sm">
                        <FastForward className="w-4 h-4 text-yellow-400" /> Real-Time Live Extensions
                      </h4>
                      <p className="text-xs text-green-300/70 leading-relaxed">
                        Need to give teams an extra 10 or 15 minutes? Click any quick extension button (+5m, +10m, +15m, +30m).
                        The extension is transmitted instantaneously to all contestant screens via Supabase real-time channels with zero page reload needed.
                      </p>
                    </div>
                  </div>
                </div>
              </TerminalBox>
            </div>
          )}

          {/* CHALLENGES TAB */}
          {tab === 'challenges' && (
            <TerminalBox title="challenges.sh">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green-400 font-bold">All Challenges ({challenges.length})</h2>
                <button onClick={() => setTab('add')} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500 text-green-400 px-3 py-1.5 rounded text-sm transition-all"><Plus className="w-3 h-3"/>Add New</button>
              </div>
              {challenges.length === 0 ? (
                <p className="text-green-600 text-center py-8">No challenges yet. Add one!</p>
              ) : (
                <div className="space-y-3">
                  {challenges.map(c => (
                    <div key={c.id} className={`border rounded-lg p-4 transition-all ${c.is_active ? 'border-green-500/30 bg-green-500/5' : 'border-gray-600/30 bg-gray-800/20 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{c.title}</span>
                            <span className="text-xs text-green-600 font-mono">#{c.id}</span>
                            <span className={`text-xs px-2 py-0.5 border rounded ${diffColor(c.difficulty)}`}>{c.difficulty}</span>
                            <span className="text-xs px-2 py-0.5 border border-blue-500/50 text-blue-400 rounded">{c.category}</span>
                            {!c.is_active && <span className="text-xs px-2 py-0.5 border border-gray-500 text-gray-500 rounded">INACTIVE</span>}
                          </div>
                          <p className="text-green-300/60 text-xs mt-1 truncate">{c.description.slice(0, 120)}…</p>
                          <p className="text-green-600/50 text-xs mt-1">{c.hints.length} hint(s) · {c.file_name || 'no file'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleToggle(c)} disabled={processing === c.id} title={c.is_active ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded hover:bg-white/5 transition-colors disabled:opacity-40">
                            {c.is_active ? <ToggleRight className="w-5 h-5 text-green-400"/> : <ToggleLeft className="w-5 h-5 text-gray-500"/>}
                          </button>
                          <button onClick={() => startEdit(c)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleDelete(c.id, c.title)} disabled={processing === c.id}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-40" title="Delete">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TerminalBox>
          )}

          {/* ADD / EDIT CHALLENGE TAB */}
          {tab === 'add' && (
            <TerminalBox title={editId ? `edit_challenge_${editId}.sh` : 'add_challenge.sh'}>
              <form onSubmit={editId ? handleEditSubmit : handleAddSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {!editId && (
                    <div>
                      <label className={labelCls}>Challenge ID *</label>
                      <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g,'-') }))}
                        placeholder="e.g. q6" className={inputCls} required pattern="[a-z0-9\-]+" title="Lowercase letters, numbers and hyphens only"/>
                      <p className="text-green-700 text-xs mt-1">Unique slug used as the primary key (e.g. q6)</p>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Challenge title" className={inputCls} required/>
                  </div>
                  <div>
                    <label className={labelCls}>Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Difficulty *</label>
                    <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className={inputCls}>
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>File Name</label>
                    <input value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} placeholder="e.g. challenge.txt" className={inputCls}/>
                  </div>
                  <div>
                    <label className={labelCls}>File Path</label>
                    <input value={form.file_path} onChange={e => setForm(f => ({ ...f, file_path: e.target.value }))} placeholder="e.g. /challenges/q6/challenge.txt" className={inputCls}/>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Full challenge description shown to players…" rows={4} className={inputCls} required/>
                </div>

                <div>
                  <label className={labelCls}>Hints (up to 3)</label>
                  <div className="space-y-2">
                    {form.hints.map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-green-600 text-xs w-6 flex-shrink-0">#{i+1}</span>
                        <input value={h} onChange={e => hintChange(i, e.target.value)} placeholder={`Hint ${i+1} (optional)`} className={inputCls}/>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>{editId ? 'New Correct Flag (leave blank to keep current)' : 'Correct Flag *'}</label>
                  <div className="relative">
                    <input type={showFlag ? 'text' : 'password'} value={form.correct_flag}
                      onChange={e => setForm(f => ({ ...f, correct_flag: e.target.value }))}
                      placeholder="CG{...}" className={`${inputCls} pr-10`} required={!editId}/>
                    <button type="button" onClick={() => setShowFlag(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-400">
                      {showFlag ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                  <p className="text-green-700 text-xs mt-1">Hashed server-side (SHA-256) — never stored as plaintext in the client</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-lg transition-all">
                    {saving ? <><RefreshCw className="w-4 h-4 animate-spin"/>Saving...</> : <><CheckCircle className="w-4 h-4"/>{editId ? 'Save Changes' : 'Create Challenge'}</>}
                  </button>
                  {editId && (
                    <button type="button" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setTab('challenges'); }}
                      className="flex items-center gap-2 bg-gray-600/20 hover:bg-gray-600/40 border border-gray-500 text-gray-400 px-6 py-2.5 rounded-lg transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </TerminalBox>
          )}

          {/* SUBMISSIONS TAB */}
          {tab === 'submissions' && (
            <TerminalBox title="submissions.sh">
              <h2 className="text-green-400 font-bold mb-4">Challenge Submissions ({submissions.length})</h2>
              {submissions.length === 0 ? (
                <p className="text-green-600 text-center py-8">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map(s => (
                    <div key={s.id} className={`border-l-4 rounded-r-lg p-4 ${s.status === 'pending' ? 'border-l-yellow-500 bg-yellow-500/5' : s.status === 'approved' ? 'border-l-blue-500 bg-blue-500/5' : 'border-l-red-500 bg-red-500/5'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-white">{s.title}</span>
                            <span className={`text-xs px-2 py-0.5 border rounded ${diffColor(s.difficulty)}`}>{s.difficulty}</span>
                            <span className="text-xs px-2 py-0.5 border border-green-500/50 text-green-400 rounded">{s.category}</span>
                            <span className={`text-xs px-2 py-0.5 border rounded font-bold ${s.status==='pending'?'border-yellow-500 text-yellow-400':s.status==='approved'?'border-blue-500 text-blue-400':'border-red-500 text-red-400'}`}>{s.status.toUpperCase()}</span>
                          </div>
                          <p className="text-green-300/70 text-sm line-clamp-2">{s.description}</p>
                          {s.hints?.length > 0 && <p className="text-green-600 text-xs mt-1">{s.hints.length} hint(s) included</p>}
                          <p className="text-green-700 text-xs mt-1">{new Date(s.created_at).toLocaleString()}</p>
                        </div>
                        {s.status === 'pending' && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button onClick={() => handleApprove(s)} disabled={processing === s.id}
                              className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500 text-blue-400 px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50">
                              <CheckCircle className="w-3 h-3"/>{processing === s.id ? '...' : 'Approve'}
                            </button>
                            <button onClick={() => handleReject(s)} disabled={processing === s.id}
                              className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-400 px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50">
                              <XCircle className="w-3 h-3"/>{processing === s.id ? '...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TerminalBox>
          )}

          {/* RESET REQUESTS TAB */}
          {tab === 'reset_requests' && (
            <TerminalBox title="password_resets.sh">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green-400 font-bold">Password Reset Requests ({resetRequests.length})</h2>
                <button onClick={fetchAll} className="flex items-center gap-1 text-xs border border-green-500/40 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/10">
                  <RefreshCw className="w-3 h-3"/>Refresh
                </button>
              </div>

              {resetRequests.length === 0 ? (
                <p className="text-green-600 text-center py-8">No password reset requests pending.</p>
              ) : (
                <div className="space-y-3">
                  {resetRequests.map(r => (
                    <div key={r.id} className="border border-green-500/20 rounded p-4 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{r.email}</span>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : r.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-green-400/70">
                          Requested: {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={async () => {
                                await supabase.from('password_reset_requests').update({ status: 'resolved' }).eq('id', r.id);
                                flash(`Request for ${r.email} marked as resolved!`);
                                fetchAll();
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-black text-xs font-bold rounded transition-all"
                            >
                              Mark Resolved
                            </button>
                            <button
                              onClick={async () => {
                                await supabase.from('password_reset_requests').update({ status: 'rejected' }).eq('id', r.id);
                                flash(`Request for ${r.email} dismissed.`);
                                fetchAll();
                              }}
                              className="px-3 py-1.5 border border-red-500/50 text-red-400 text-xs rounded hover:bg-red-950/40 transition-all"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TerminalBox>
          )}

          {/* PARTICIPANTS TAB */}
          {tab === 'participants' && (
            <TerminalBox title="qualified_participants.sh">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green-400 font-bold">Round 1 Qualified Operatives ({participants.length})</h2>
                <button onClick={fetchAll} className="flex items-center gap-1 text-xs border border-green-500/40 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/10">
                  <RefreshCw className="w-3 h-3"/>Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-green-300">
                  <thead>
                    <tr className="border-b border-green-500/30 text-green-400 font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">Team ID</th>
                      <th className="py-2 px-3">Team Name</th>
                      <th className="py-2 px-3">Leader</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">College</th>
                      <th className="py-2 px-3 text-center">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-500/10">
                    {participants.map(p => (
                      <tr key={p.id} className="hover:bg-green-500/5">
                        <td className="py-2.5 px-3 font-mono text-green-400">{p.team_id}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{p.team_name}</td>
                        <td className="py-2.5 px-3">{p.leader_name}</td>
                        <td className="py-2.5 px-3 font-mono text-green-300/80">{p.email}</td>
                        <td className="py-2.5 px-3 text-green-400/60 max-w-[200px] truncate" title={p.college}>{p.college}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            ELIGIBLE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TerminalBox>
          )}

          {/* LIVE MONITOR TAB */}
          {tab === 'live_monitor' && (
            <TerminalBox title="live_activity_stream.sh">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"/>
                  <h2 className="text-green-400 font-bold">Live Team Activity Monitor ({groupedTeamActivity.length} Teams Online)</h2>
                </div>
                <button onClick={fetchAll} className="flex items-center gap-1 text-xs border border-green-500/40 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/10">
                  <RefreshCw className="w-3 h-3"/>Refresh
                </button>
              </div>

              {groupedTeamActivity.length === 0 ? (
                <p className="text-green-600 text-center py-8">No team activity recorded yet. Teams will appear as they pick and solve challenges.</p>
              ) : (
                <div className="overflow-x-auto space-y-3">
                  <table className="w-full text-left text-xs text-green-300">
                    <thead>
                      <tr className="border-b border-green-500/30 text-green-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Team Name</th>
                        <th className="py-2.5 px-3">Latest / Active Challenge</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Time on Current</th>
                        <th className="py-2.5 px-3 text-center">Total Wrong</th>
                        <th className="py-2.5 px-3 text-center">Total Hints</th>
                        <th className="py-2.5 px-3 text-right">Last Ping</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-500/10">
                      {groupedTeamActivity.map(team => {
                        const isExpanded = !!expandedTeams[team.team_id];
                        return (
                          <React.Fragment key={team.team_id}>
                            <tr className={`hover:bg-green-500/5 transition-colors ${isExpanded ? 'bg-green-950/20' : ''}`}>
                              <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span>{team.team_id}</span>
                              </td>
                              <td className="py-3 px-3 font-mono text-green-400">
                                {team.latest_challenge_id}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${team.latest_status ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'}`}>
                                  {team.latest_status ? '✓ SOLVED' : '● IN PROGRESS'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-green-400">
                                {Math.floor(team.latest_time_spent / 60)}m {team.latest_time_spent % 60}s
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono text-xs ${team.total_wrong_attempts > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-green-500/60'}`}>
                                  {team.total_wrong_attempts}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono text-xs ${team.total_hints_used > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-green-500/60'}`}>
                                  {team.total_hints_used}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right text-green-400/70 font-mono">
                                {new Date(team.latest_ping).toLocaleTimeString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => toggleTeamExpanded(team.team_id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition-all cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                                  <span>{isExpanded ? 'Hide' : 'View'} ({team.sessions.length})</span>
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} className="p-0 border-b border-green-500/30">
                                  <div className="bg-black/80 p-4 border-l-2 border-green-500 m-2 rounded space-y-2">
                                    <div className="flex items-center justify-between pb-2 border-b border-green-500/20 text-xs">
                                      <span className="text-green-400 font-bold uppercase tracking-wider">
                                        Active & Visited Challenges History for {team.team_id}
                                      </span>
                                      <span className="text-green-300/60 font-mono">
                                        Solved: {team.total_challenges_completed} / {team.total_challenges_visited} Attempted
                                      </span>
                                    </div>
                                    <div className="grid gap-2">
                                      {team.sessions.map((s, idx) => (
                                        <div key={idx} className="flex flex-wrap items-center justify-between p-2.5 bg-zinc-950/90 rounded border border-green-500/20 text-xs font-mono">
                                          <div className="flex items-center gap-3">
                                            <span className="text-green-300 font-bold">{s.challenge_id}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'}`}>
                                              {s.is_completed ? 'SOLVED' : 'IN PROGRESS'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-4 text-green-400/80">
                                            <span>Time: <strong className="text-green-300">{Math.floor((s.time_spent || 0) / 60)}m {(s.time_spent || 0) % 60}s</strong></span>
                                            <span>Wrong Guesses: <strong className={s.wrong_attempt_count > 0 ? 'text-red-400' : 'text-green-300'}>{s.wrong_attempt_count}</strong></span>
                                            <span>Hints Used: <strong className={s.hint_reveal_count > 0 ? 'text-amber-400' : 'text-green-300'}>{s.hint_reveal_count}</strong></span>
                                            <span className="text-green-500/60 text-[11px]">{new Date(s.last_activity).toLocaleTimeString()}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TerminalBox>
          )}

          {/* LEADERBOARD TAB */}
          {tab === 'leaderboard' && (
            <TerminalBox title="admin_leaderboard.sh">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green-400 font-bold">Admin Real-Time Scoreboard ({leaderboardEntries.length} Solves)</h2>
                <button onClick={fetchAll} className="flex items-center gap-1 text-xs border border-green-500/40 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/10">
                  <RefreshCw className="w-3 h-3"/>Refresh
                </button>
              </div>

              {leaderboardEntries.length === 0 ? (
                <p className="text-green-600 text-center py-8">No solves recorded yet. Scores will appear as flags are captured.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-green-300">
                    <thead>
                      <tr className="border-b border-green-500/30 text-green-400 font-bold uppercase tracking-wider">
                        <th className="py-2 px-3">Rank</th>
                        <th className="py-2 px-3">Team Name</th>
                        <th className="py-2 px-3">Challenge</th>
                        <th className="py-2 px-3 text-right">Points</th>
                        <th className="py-2 px-3 text-right">Time Spent</th>
                        <th className="py-2 px-3 text-center">Attempts</th>
                        <th className="py-2 px-3 text-right">Solved At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-500/10">
                      {leaderboardEntries.map((entry, idx) => (
                        <tr key={entry.id || idx} className="hover:bg-green-500/5">
                          <td className="py-3 px-3 font-mono font-bold text-green-500">#{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-white">{entry.team_name}</td>
                          <td className="py-3 px-3 font-mono text-green-400">{entry.question_id}</td>
                          <td className="py-3 px-3 text-right font-bold text-green-400">+{entry.points || 100}</td>
                          <td className="py-3 px-3 text-right font-mono text-green-300">
                            {Math.floor(entry.time_spent / 60)}m {entry.time_spent % 60}s
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{entry.attempts}</td>
                          <td className="py-3 px-3 text-right text-green-500/60 font-mono">
                            {entry.completed_at ? new Date(entry.completed_at).toLocaleTimeString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TerminalBox>
          )}
        </div>
      </div>
    </div>
  );
}
