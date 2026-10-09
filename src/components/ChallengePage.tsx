import React, { useState, useEffect } from 'react';
import { Download, Terminal, CheckCircle, XCircle, Clock, Trophy, LogOut, ChevronDown, ChevronUp, Users, MessageSquare, Plus, Edit, Trash2, Radio, ExternalLink, FileText, Archive, Music, Image as ImageIcon, Lock, Unlock, Pause } from 'lucide-react';
import { GlitchText } from './GlitchText';
import { TerminalBox } from './TerminalBox';
import { Leaderboard } from './Leaderboard';
import { supabase, isSupabaseConfigured, TeamNote, subscribeToTeamNotes, EventConfig, subscribeToEvents } from '../lib/supabase';

interface ChallengePageProps {
  teamId: string;
  teamName: string;
  leaderName: string;
  onLogout: () => void;
}

interface LocalChallenge {
  questionId: string;
  startedAt: number;
  attempts: number;
  completed: boolean;
  completedTime?: number;
  hintsUsed?: number;
}

type Event = EventConfig;

export interface AttachmentItem {
  name: string;
  url: string;
  type: 'file' | 'link' | 'audio' | 'image' | 'archive';
  description?: string;
}

export const getChallengeAttachments = (q?: Question | null): AttachmentItem[] => {
  if (!q) return [];

  if (q.id === 'q5-invisible-ink') {
    return [
      { name: 'research_report.txt', url: '/challenges/media/research_report.txt', type: 'file', description: 'Recovered Project LUMEN-4 research report' },
      { name: 'L4_recovery.zip', url: '/challenges/media/L4_recovery.zip', type: 'archive', description: 'Password-protected recovery archive' },
      { name: 'lumen4_files.zip', url: '/challenges/media/lumen4_files.zip', type: 'archive', description: 'Complete LUMEN-4 artifact package' },
    ];
  }

  if (q.id === 'q6-ghost-host') {
    return [
      { name: 'internal_it_memo.docx', url: '/challenges/media/internal_it_memo.docx', type: 'file', description: 'Internal IT security memo document' },
    ];
  }

  if (q.id === 'q4-snackbot-3000') {
    return [
      { name: 'snackbot3000.zip', url: '/challenges/media/snackbot3000.zip', type: 'archive', description: 'Complete SnackBot 3000 bundle' },
      { name: 'vending', url: '/challenges/media/q4_snackbot/vending', type: 'file', description: 'Vending machine program binary' },
      { name: 'maintenance_log.txt', url: '/challenges/media/q4_snackbot/maintenance_log.txt', type: 'file', description: 'Vending maintenance log' },
      { name: 'run.sh', url: '/challenges/media/q4_snackbot/run.sh', type: 'file', description: 'Execution runner script' },
    ];
  }

  if (q.id === 'q3-broken-broadcast') {
    return [
      { name: 'radio_pieces.zip', url: '/challenges/media/radio_pieces.zip', type: 'archive', description: 'All 4 broadcast fragments bundle' },
      { name: 'piece_1.wav', url: '/challenges/media/radio_pieces/piece_1.wav', type: 'audio', description: 'Broadcast receiver fragment 1' },
      { name: 'piece_2.wav', url: '/challenges/media/radio_pieces/piece_2.wav', type: 'audio', description: 'Broadcast receiver fragment 2' },
      { name: 'piece_3.wav', url: '/challenges/media/radio_pieces/piece_3.wav', type: 'audio', description: 'Broadcast receiver fragment 3' },
      { name: 'piece_4.wav', url: '/challenges/media/radio_pieces/piece_4.wav', type: 'audio', description: 'Broadcast receiver fragment 4' },
    ];
  }

  if (q.id === 'q1-photograph-remembers') {
    return [
      { name: 'photo.jpg', url: '/challenges/media/photo.jpg', type: 'image', description: 'Recovered old photograph' },
    ];
  }

  if (q.id === 'q2-quiet-pixels') {
    return [
      { name: 'quiet.png', url: '/challenges/media/quiet.png', type: 'image', description: 'Seized dusk landmark photograph' },
    ];
  }

  if (q.id === 'c1-domes-mirage' || q.id === 'c1-dome-mirage') {
    return [
      { name: 'stego_1 (1).png', url: '/challenges/media/stego_1 (1).png', type: 'image', description: 'Mirage surveillance image' },
    ];
  }

  if (q.id === 'c2-ghs-frequency') {
    return [
      { name: 'stego_challenge (1).jpeg', url: '/challenges/media/stego_challenge (1).jpeg', type: 'image', description: 'GHS frequency image artifact' },
    ];
  }

  if (q.id === 'c3-structural-trace') {
    return [
      { name: 'stego_challenge4.mp4', url: '/challenges/media/stego_challenge4.mp4', type: 'file', description: 'Suspicious admin terminal video recording' },
    ];
  }

  if (q.id === 'c4-crests-secret') {
    return [
      { name: 'stego_challenge3.jpeg', url: '/challenges/media/stego_challenge3.jpeg', type: 'image', description: 'Official club crest image' },
    ];
  }

  if (q.id === 'c5-corrupted-drive') {
    return [
      { name: 'corrupted_patient_records.dat', url: '/challenges/media/corrupted_patient_records.dat', type: 'file', description: 'Recovered raw patient clinic data file' },
    ];
  }

  if (q.id === 'c6-pre-production-panic') {
    return [
      { name: 'Savings Agency Staging Portal', url: 'https://savingsbank-neon.vercel.app/', type: 'link', description: 'Live CSA staging environment' },
    ];
  }

  if (q.id === 'q10-instagram-x-mystery') {
    return [
      { name: 'Target Instagram Profile', url: 'https://www.instagram.com/anushka1262005?stkn=amZ3ZGdpODlpaDRp', type: 'link', description: 'Primary OSINT investigation starting point' },
    ];
  }

  if (q.file_path && q.file_path.trim() !== '') {
    const isLnk = q.file_path.startsWith('http');
    return [
      {
        name: q.file_name || 'Challenge File',
        url: q.file_path,
        type: isLnk ? 'link' : 'file',
        description: 'Challenge investigation resource'
      }
    ];
  }

  return [];
};

export const renderDescriptionWithLinks = (text?: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className="leading-relaxed whitespace-pre-line text-green-300/90 text-sm sm:text-base">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 break-all transition-colors duration-150 py-0.5 px-2 bg-cyan-950/40 rounded border border-cyan-500/30 hover:border-cyan-400"
            >
              <span>{part}</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export class ChallengeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Challenge component error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-950/40 border border-red-500 rounded-lg text-red-300 font-mono my-4">
          <h3 className="text-red-400 font-bold mb-2">⚠ CHALLENGE RECOVERY INTERFACE</h3>
          <p className="text-sm mb-3">A minor rendering issue occurred in this panel ({this.state.error?.message || 'Recoverable error'}).</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-black font-bold rounded text-xs transition-all cursor-pointer"
          >
            RELOAD CHALLENGE PANEL
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Question {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  hints: string[];
  category: string;
  difficulty: string;
  points?: number;
  media_type?: 'image' | 'video' | 'audio' | 'file' | 'link';
  media_url?: string;
  audio_files?: { name: string; url: string }[];
}

const SAMPLE_QUESTIONS: Question[] = [];

export function ChallengePage({ teamId, teamName, leaderName, onLogout }: ChallengePageProps) {
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [challenge, setChallenge] = useState<LocalChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [points, setPoints] = useState(100);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [availableChallenges, setAvailableChallenges] = useState<Question[]>(SAMPLE_QUESTIONS); // Initialize with hardcoded, then fetch from DB

  // Real-time synchronization with tournament event state
  useEffect(() => {
    const unsub = subscribeToEvents((evt) => {
      setCurrentEvent(evt);
    });
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const getEventLockState = () => {
    if (!currentEvent || currentEvent.status === 'draft') {
      return {
        locked: true,
        reason: 'Competition has not started yet. Waiting for organizers to launch.',
        status: 'draft',
        timeLeft: null
      };
    }

    if (currentEvent.status === 'paused') {
      return {
        locked: true,
        reason: 'Competition is currently PAUSED by Admin. Flag submissions are temporarily frozen.',
        status: 'paused',
        timeLeft: null
      };
    }

    const endMs = new Date(currentEvent.end_date).getTime();
    const diffMs = endMs - nowTick;

    if (currentEvent.status === 'ended' || diffMs <= 0) {
      return {
        locked: true,
        reason: 'Competition has CONCLUDED. All submissions are locked and your responses are safely saved.',
        status: 'ended',
        timeLeft: 0
      };
    }

    return {
      locked: false,
      reason: '',
      status: 'active',
      timeLeft: Math.max(0, Math.floor(diffMs / 1000))
    };
  };

  const lockState = getEventLockState();
  const isEventLocked = lockState.locked;

  // Team notes state
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Challenge browser filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Canonical 5 Categories: Steganography, OSINT, Cryptography, Forensics, Miscellaneous
  const normalizeCategory = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('stego') || lower.includes('video') || lower.includes('audio')) return 'Steganography';
    if (lower.includes('osint')) return 'OSINT';
    if (lower.includes('crypto')) return 'Cryptography';
    if (lower.includes('forensic')) return 'Forensics';
    return 'Miscellaneous';
  };

  // Fetch challenges from database or JSON file
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // First, try to load from public/challenges.json
        const response = await fetch('/challenges.json');
        if (response.ok) {
          const data = await response.json();
          // Strip correct_flag before storing — flag validation is server-side only
          // No hints in Easy and Medium questions, only in Hard questions.
          const sanitized: Question[] = (data.challenges as any[]).map(
            ({ correct_flag: _omit, ...rest }) => {
              const isHard = (rest.difficulty || '').toLowerCase() === 'hard';
              return {
                ...rest,
                category: normalizeCategory(rest.category || ''),
                hints: isHard ? (rest.hints || []) : []
              } as Question;
            }
          );
          setAvailableChallenges(sanitized);

          // If a challenge is currently active, sync its media/audio properties
          if (sanitized.length > 0) {
            setQuestion(prev => {
              if (!prev) return sanitized[0];
              const match = sanitized.find(q => q.id === prev.id);
              return match || prev;
            });
          }
          return;
        }
      } catch (err) {
        console.error('Error loading challenges from JSON:', err);
      }

      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured and challenges.json not found');
        return;
      }

      try {
        const { data: challenges, error } = await supabase
          .from('challenges')
          // Explicitly omit correct_flag — never select sensitive columns on the client
          .select('id, title, description, file_name, file_path, hints, category, difficulty')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching challenges:', error);
          return;
        }

        if (challenges && challenges.length > 0) {
          const transformedChallenges: Question[] = challenges.map((c: any) => {
            const filePath = c.file_path || '';
            const isImg = filePath.match(/\.(png|jpe?g|webp|gif)$/i);
            const isVid = filePath.match(/\.(mp4|webm|mov)$/i);
            const isAudio = filePath.match(/\.(wav|mp3|ogg)$/i) || c.id.includes('broken-broadcast');
            const isLnk = filePath.startsWith('http');
            const isHard = (c.difficulty || '').toLowerCase() === 'hard';
            return {
              id: c.id,
              title: c.title,
              description: c.description,
              file_name: c.file_name || '',
              file_path: filePath,
              hints: isHard ? (c.hints || []) : [],
              category: normalizeCategory(c.category || ''),
              difficulty: c.difficulty,
              media_type: c.media_type || (isImg ? 'image' : isVid ? 'video' : isAudio ? 'audio' : isLnk ? 'link' : 'file'),
              media_url: c.media_url || filePath,
              audio_files: c.id.includes('broken-broadcast') ? [
                { name: 'Receiver Channel 1 (piece_1.wav)', url: '/challenges/media/radio_pieces/piece_1.wav' },
                { name: 'Receiver Channel 2 (piece_2.wav)', url: '/challenges/media/radio_pieces/piece_2.wav' },
                { name: 'Receiver Channel 3 (piece_3.wav)', url: '/challenges/media/radio_pieces/piece_3.wav' },
                { name: 'Receiver Channel 4 (piece_4.wav)', url: '/challenges/media/radio_pieces/piece_4.wav' }
              ] : undefined
            };
          });
          setAvailableChallenges(transformedChallenges);
        }
      } catch (err) {
        console.error('Error loading challenges:', err);
      }
    };

    fetchChallenges();
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [teamId]);

  useEffect(() => {
    if (!question?.id || !teamId) return;

    // Load initial notes for current challenge
    loadTeamNotes();

    // Subscribe to real-time updates for this challenge
    const unsubscribe = subscribeToTeamNotes(teamId, question.id, (updatedNotes) => {
      setTeamNotes(updatedNotes);
    });

    return unsubscribe;
  }, [question?.id, teamId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && challenge && !challenge.completed) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          localStorage.setItem(`cybergauntlet_progress_${teamId}`, JSON.stringify({
            ...challenge,
            elapsedTime: newTime
          }));
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, challenge, teamId]);

  const loadChallenge = async () => {
    try {
      const saved = localStorage.getItem(`cybergauntlet_progress_${teamId}`);
      const completed = localStorage.getItem(`cybergauntlet_completed_${teamId}`);
      setCompletedQuestions(completed ? JSON.parse(completed) : []);


      // Fetch team points
      if (isSupabaseConfigured) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('team_name', teamName)
          .single();
        if (profile) {
          setPoints(profile.points);
        }
      }

      let localChallenge: LocalChallenge;

      if (saved) {
        const parsed = JSON.parse(saved);
        localChallenge = {
          questionId: parsed.questionId,
          startedAt: parsed.startedAt,
          attempts: parsed.attempts,
          completed: parsed.completed,
          completedTime: parsed.completedTime,
          hintsUsed: parsed.hintsUsed || 0
        };
        setElapsedTime(parsed.elapsedTime || 0);
        setRevealedHints(parsed.revealedHints || []);
      } else {
        let availableQuestions = availableChallenges.filter(q => !(completed ? JSON.parse(completed) : []).includes(q.id));

        // Filter by active event if one exists
        if (currentEvent) {
          availableQuestions = availableQuestions.filter(q => currentEvent.active_challenges.includes(q.id));
        }

        if (availableQuestions.length === 0) {
          setChallenge({ questionId: '', startedAt: 0, attempts: 0, completed: true });
          setLoading(false);
          return;
        }

        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        localChallenge = {
          questionId: randomQuestion.id,
          startedAt: Date.now(),
          attempts: 0,
          completed: false,
          hintsUsed: 0
        };
        localStorage.setItem(`cybergauntlet_progress_${teamId}`, JSON.stringify({
          ...localChallenge,
          elapsedTime: 0,
          revealedHints: []
        }));

        // ============ RECORD CHALLENGE SESSION START (ANTI-CHEAT) ============
        // Register this challenge session in the database for server-side validation
        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('challenge_sessions')
              .upsert({
                team_id: teamName,
                challenge_id: randomQuestion.id,
                session_start_time: new Date(localChallenge.startedAt).toISOString(),
                hint_reveal_count: 0,
                wrong_attempt_count: 0
              }, {
                onConflict: 'team_id,challenge_id'
              });
          } catch (err) {
            console.error('Error recording challenge session:', err);
            // Non-blocking - don't interrupt challenge load
          }
        }
      }

      setChallenge(localChallenge);

      const q = availableChallenges.find(q => q.id === localChallenge.questionId);
      if (q) {
        setQuestion(q);
      }

      if (!localChallenge.completed) {
        setIsRunning(true);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading challenge:', err);
      setLoading(false);
    }
  };

  const selectChallenge = (selectedQ: Question) => {
    setQuestion(selectedQ);
    setFlag('');
    setResult(null);

    const isDone = completedQuestions.includes(selectedQ.id);
    const newLocal: LocalChallenge = {
      questionId: selectedQ.id,
      startedAt: Date.now(),
      attempts: 0,
      completed: isDone,
      hintsUsed: 0
    };
    setChallenge(newLocal);
    setRevealedHints([]);
    setIsRunning(!isDone);

    // Record active session for Admin Live Monitor
    if (isSupabaseConfigured) {
      supabase.from('challenge_sessions').upsert({
        team_id: teamName,
        challenge_id: selectedQ.id,
        session_start_time: new Date().toISOString(),
        time_spent: 0,
        is_completed: isDone,
        last_activity: new Date().toISOString()
      }, { onConflict: 'team_id,challenge_id' }).then();
    }

    // Scroll smoothly to active challenge workspace
    const el = document.getElementById('challenge-workspace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !challenge) return;

    if (isEventLocked) {
      alert(lockState.reason || 'Submissions are currently locked.');
      return;
    }

    // Normalize flag prefix (e.g. QUEST{...} -> quest{...}, FLAG{...} -> flag{...})
    // Prefix is case-insensitive, while inner answer is strictly case-sensitive
    let submittedFlag = flag.trim();
    const prefixMatch = submittedFlag.match(/^([a-zA-Z0-9_-]+)\{(.*)\}$/);
    if (prefixMatch) {
      submittedFlag = `${prefixMatch[1].toLowerCase()}{${prefixMatch[2]}}`;
    }

    const newAttempts = challenge.attempts + 1;

    try {
      const submissionStorageKey = `cybergauntlet_submission_${teamId}_${question.id}`;
      let submissionId = localStorage.getItem(submissionStorageKey);

      if (!submissionId) {
        submissionId = crypto.randomUUID();
        localStorage.setItem(submissionStorageKey, submissionId);
      }

      const idempotencyKey = submissionId;

      let isCorrect = false;

      // 1. First attempt: call direct PostgreSQL RPC function (zero deploy dependency)
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_flag', {
        p_challenge_id: question.id,
        p_submitted_flag: submittedFlag,
        p_team_name: teamName,
        p_time_spent: elapsedTime,
        p_attempts: newAttempts,
        p_hints_used: 0, // No mark deduction for hints
        p_idempotency_key: idempotencyKey
      });

      if (!rpcError && rpcData) {
        if (rpcData.error) {
          alert(rpcData.error);
          return;
        }
        isCorrect = rpcData.is_correct === true;
      } else {
        // 2. Fallback: call edge function if configured
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('validate-flag', {
          body: {
            challenge_id: question.id,
            submitted_flag: submittedFlag,
            team_name: teamName,
            time_spent: elapsedTime,
            attempts: newAttempts,
            hints_used: 0, // No mark deduction for hints
            start_time: new Date(challenge.startedAt).toISOString(),
            category: question.category,
            difficulty: question.difficulty,
            event_id: currentEvent?.id || null,
            idempotency_key: idempotencyKey
          }
        });

        if (edgeError && rpcError) {
          console.error('Flag validation error:', edgeError || rpcError);
          setResult('incorrect');
          setTimeout(() => setResult(null), 3000);
          return;
        }

        isCorrect = edgeData?.is_correct === true;
      }

      if (!isCorrect) {
        // Incorrect — increment attempt count and persist; do NOT mark completed
        setResult('incorrect');
        const updatedChallenge = { ...challenge, attempts: newAttempts };
        setChallenge(updatedChallenge);
        localStorage.setItem(`cybergauntlet_progress_${teamId}`, JSON.stringify({
          ...updatedChallenge,
          elapsedTime
        }));
        setTimeout(() => setResult(null), 3000);
        return;
      }

      // Server confirmed correct flag
      setResult('correct');
      setIsRunning(false);

      const completedTime = elapsedTime;
      const updatedChallenge = {
        ...challenge,
        completed: true,
        completedTime,
        attempts: newAttempts
      };

      localStorage.setItem(`cybergauntlet_progress_${teamId}`, JSON.stringify({
        ...updatedChallenge,
        elapsedTime: completedTime
      }));

      const newCompleted = [...completedQuestions, question.id];
      localStorage.setItem(`cybergauntlet_completed_${teamId}`, JSON.stringify(newCompleted));
      localStorage.removeItem(`cybergauntlet_submission_${teamId}_${question.id}`);

      setChallenge(updatedChallenge);
      setCompletedQuestions(newCompleted);
      setFlag('');

      setTimeout(() => {
        if (newCompleted.length < availableChallenges.length) {
          localStorage.removeItem(`cybergauntlet_progress_${teamId}`);
          loadChallenge();
          setResult(null);
        }
      }, 3000);
    } catch (err) {
      console.error('Error submitting flag:', err);
      setResult('incorrect');
      setTimeout(() => setResult(null), 3000);
    }
  };

  const handleDownload = () => {
    if (!question) return;
    const element = document.createElement('a');
    element.href = question.file_path;
    element.download = question.file_name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const revealNextHint = async () => {
    if (!question || !challenge) return;

    const nextHintIndex = revealedHints.length;
    if (nextHintIndex >= question.hints.length) return;

    try {
      // Hints are free — no mark/point deductions
      const newRevealedHints = [...revealedHints, nextHintIndex];
      const newHintsUsed = (challenge.hintsUsed || 0) + 1;

      // Update server-side hint count for tracking without deducting points
      if (isSupabaseConfigured && question) {
        try {
          await supabase.rpc('record_hint_reveal', {
            p_team_id: teamName,
            p_challenge_id: question.id
          });
        } catch (err) {
          console.debug('Hint reveal recorded:', err);
        }
      }

      setRevealedHints(newRevealedHints);

      const updatedChallenge = {
        ...challenge,
        hintsUsed: newHintsUsed
      };
      setChallenge(updatedChallenge);

      localStorage.setItem(`cybergauntlet_progress_${teamId}`, JSON.stringify({
        ...updatedChallenge,
        elapsedTime,
        revealedHints: newRevealedHints
      }));
    } catch (err) {
      console.error('Error revealing hint:', err);
      alert('Failed to reveal hint. Please try again.');
    }
  };

  const loadTeamNotes = async () => {
    if (!question?.id || !teamId) return;

    try {
      const { data, error } = await supabase
        .from('team_notes')
        .select('*')
        .eq('team_id', teamId)
        .eq('challenge_id', question.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamNotes(data || []);
    } catch (err) {
      console.error('Error loading team notes:', err);
    }
  };

  const addTeamNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question?.id || !teamId || !newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('team_notes')
        .insert({
          team_id: teamId,
          challenge_id: question.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          note_content: newNote.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setTeamNotes([data, ...teamNotes]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding team note:', err);
      alert('Failed to add note. Please try again.');
    }
  };

  const updateTeamNote = async (noteId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('team_notes')
        .update({ note_content: content.trim() })
        .eq('id', noteId);

      if (error) throw error;

      setTeamNotes(teamNotes.map(note =>
        note.id === noteId ? { ...note, note_content: content.trim() } : note
      ));
      setEditingNote(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating team note:', err);
      alert('Failed to update note. Please try again.');
    }
  };

  const deleteTeamNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('team_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setTeamNotes(teamNotes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Error deleting team note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  // const loadLeaderboard = async () => {
  //   try {
  //     const { data } = await supabase
  //       .from('leaderboard')
  //       .select('*')
  //       .order('time_spent', { ascending: true })
  //       .order('attempts', { ascending: true });
  //     setLeaderboardData(data || []);
  //   } catch (err) {
  //     console.error('Error loading leaderboard:', err);
  //   }
  // };

  const allQuestionsCompleted = completedQuestions.length === availableChallenges.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Terminal className="w-12 h-12 text-green-500" />
          </div>
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (allQuestionsCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400 font-mono flex items-center justify-center p-4">
        <div className="scanlines"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-4 text-green-500">ALL CHALLENGES COMPLETED</h1>
            <p className="text-green-300/80 mb-6">
              Congratulations! You've successfully completed all security challenges.
            </p>
            <p className="text-green-300/60 text-sm mb-6">
              Check the leaderboard to see your final standings.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-8 rounded-lg transition-all"
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  const getTimeUntilEvent = (event: Event) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (now >= start && now <= end) {
      return { type: 'active', timeLeft: end.getTime() - now.getTime() };
    } else if (now < start) {
      return { type: 'upcoming', timeLeft: start.getTime() - now.getTime() };
    } else {
      return { type: 'ended', timeLeft: 0 };
    }
  };

  const formatCountdown = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400 font-mono">
      <div className="scanlines"></div>
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* Real-time Event Notification & Status Banner */}
        {currentEvent && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border transition-all ${
              lockState.status === 'active'
                ? 'bg-zinc-950/80 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] text-green-300'
                : lockState.status === 'paused'
                ? 'bg-yellow-950/40 border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.2)] text-yellow-300'
                : lockState.status === 'ended'
                ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)] text-red-300'
                : 'bg-blue-950/40 border-blue-500/50 text-blue-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                    lockState.status === 'active' ? 'bg-green-400 animate-ping' :
                    lockState.status === 'paused' ? 'bg-yellow-400 animate-pulse' :
                    lockState.status === 'ended' ? 'bg-red-500' : 'bg-blue-400'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{currentEvent.event_name}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        lockState.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                        lockState.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                        lockState.status === 'ended' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {lockState.status === 'active' ? 'LIVE NOW' :
                         lockState.status === 'paused' ? 'PAUSED' :
                         lockState.status === 'ended' ? 'LOCKED / CONCLUDED' : 'SCHEDULED'}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5">
                      {lockState.status === 'active' && 'Submissions active. Timer counts down to auto-lock.'}
                      {lockState.status === 'paused' && 'Organizers have temporarily paused the event. Submissions are frozen.'}
                      {lockState.status === 'ended' && 'Event has concluded. All submissions locked; all points & solves are recorded.'}
                      {lockState.status === 'draft' && 'Waiting for organizers to start competition.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto bg-black/60 px-4 py-2 rounded border border-white/10 font-mono">
                  <Clock className={`w-4 h-4 ${
                    lockState.status === 'active' ? 'text-green-400' :
                    lockState.status === 'paused' ? 'text-yellow-400' :
                    lockState.status === 'ended' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                  <div>
                    <div className="text-[10px] uppercase opacity-70 font-sans font-bold">
                      {lockState.status === 'active' ? 'TIME REMAINING' :
                       lockState.status === 'paused' ? 'PAUSED' :
                       lockState.status === 'ended' ? 'FINAL STATUS' : 'STARTS IN'}
                    </div>
                    <div className="text-xl font-bold tracking-wider">
                      {lockState.status === 'active' && lockState.timeLeft !== null ? formatCountdown(lockState.timeLeft * 1000) :
                       lockState.status === 'paused' ? 'FROZEN' :
                       lockState.status === 'ended' ? '00:00:00' : 'SOON'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <GlitchText text="CYBER" className="text-green-500" />
              <span className="text-green-400">GAUNTLET</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 px-4 py-3 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-300/80 text-sm">
                  <span className="text-green-300/60">Team:</span>{" "}
                  <span className="font-semibold">{teamName}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-green-300/80 text-sm">
                  <span className="text-green-300/60">Leader:</span>{" "}
                  <span className="font-semibold">{leaderName}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400/50 rounded-full"></div>
                <p className="text-green-300/80 text-sm">
                  <span className="text-green-300/60">Progress:</span>{" "}
                  <span className="font-semibold">{completedQuestions.length}</span>
                  <span className="text-green-300/60">/{availableChallenges.length} completed</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        {/* Progress Bar and Details */}
        <div className="mb-6">
          <TerminalBox title="progress.sh">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-green-400 font-bold">
                  Challenge Progress: {completedQuestions.length}/{availableChallenges.length}
                </div>
                <div className="text-green-300/60 text-sm">
                  {Math.round((completedQuestions.length / availableChallenges.length) * 100)}% Complete
                </div>
              </div>
              <div className="w-full bg-black/50 rounded-full h-4 border border-green-500/30">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(completedQuestions.length / availableChallenges.length) * 100}%` }}
                ></div>
              </div>
              <button
                onClick={() => setShowProgressDetails(!showProgressDetails)}
                className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm"
              >
                {showProgressDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showProgressDetails ? 'Hide' : 'Show'} Challenge Details
              </button>
              {showProgressDetails && (
                <div className="space-y-2 mt-4 border-t border-green-500/20 pt-4">
                  {availableChallenges.map((q) => {
                    const isCompleted = completedQuestions.includes(q.id);
                    return (
                      <div key={q.id} className="flex items-center gap-3 p-2 rounded bg-black/20">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-red-400'}`}>
                            {q.title}
                          </p>
                          <p className="text-xs text-green-300/60">
                            {q.category} • {q.difficulty?.toLowerCase() === 'hard' ? 'Hard (300 pts)' : q.difficulty?.toLowerCase() === 'medium' ? 'Medium (200 pts)' : 'Easy (100 pts)'} • {isCompleted ? 'Completed' : 'Not Completed'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TerminalBox>
        </div>

        {/* Challenge Browser */}
        <div className="mb-6">
          <TerminalBox title="challenge_browser.sh">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-green-400 font-bold">Challenge Browser</h3>
                <button
                  onClick={() => {
                    setCategoryFilter('All');
                    setDifficultyFilter('All');
                  }}
                  className="text-green-400 hover:text-green-300 transition-colors text-sm underline"
                >
                  Reset Filters
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-green-400 text-sm">Category:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-black/50 border border-green-500/30 rounded px-3 py-1 text-green-400 text-sm focus:border-green-500 focus:outline-none"
                  >
                    <option value="All">All</option>
                    {[...new Set(availableChallenges.map(q => q.category))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-green-400 text-sm">Difficulty:</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-black/50 border border-green-500/30 rounded px-3 py-1 text-green-400 text-sm focus:border-green-500 focus:outline-none"
                  >
                    <option value="All">All</option>
                    {[...new Set(availableChallenges.map(q => q.difficulty))].map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(
                  availableChallenges
                    .filter(q => (categoryFilter === 'All' || q.category === categoryFilter) &&
                                 (difficultyFilter === 'All' || q.difficulty === difficultyFilter))
                    .reduce((acc, q) => {
                      if (!acc[q.category]) acc[q.category] = [];
                      acc[q.category].push(q);
                      return acc;
                    }, {} as Record<string, Question[]>)
                ).map(([category, questions]) => (
                  <div key={category} className="border border-green-500/20 rounded p-4 bg-black/30">
                    <div className="flex items-center justify-between mb-3 border-b border-green-500/10 pb-2">
                      <h4 className="text-green-400 font-bold uppercase tracking-wider">{category}</h4>
                      <span className="text-xs text-green-300/50">{questions.length} Challenges</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {questions.map(q => {
                        const isCompleted = completedQuestions.includes(q.id);
                        const isCurrent = question?.id === q.id;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => selectChallenge(q)}
                            className={`flex flex-col text-left p-4 rounded border transition-all duration-200 cursor-pointer ${
                              isCurrent
                                ? 'bg-green-500/20 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] ring-1 ring-green-400'
                                : isCompleted
                                ? 'bg-green-950/20 border-green-500/30 opacity-75 hover:opacity-100 hover:border-green-400/60'
                                : 'bg-black/60 border-green-500/20 hover:border-green-400/80 hover:bg-green-900/10 hover:shadow-[0_0_10px_rgba(34,197,94,0.15)]'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              {q.difficulty?.toLowerCase() === 'hard' || q.difficulty?.toLowerCase() === 'advanced' ? (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                                  HARD • 300 PTS
                                </span>
                              ) : q.difficulty?.toLowerCase() === 'medium' || q.difficulty?.toLowerCase() === 'intermediate' ? (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-orange-500/20 text-orange-400 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.35)]">
                                  MEDIUM • 200 PTS
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-yellow-500/20 text-yellow-300 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.35)]">
                                  EASY • 100 PTS
                                </span>
                              )}
                              {isCompleted ? (
                                <span className="flex items-center gap-1 text-[11px] text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-400" /> SOLVED
                                </span>
                              ) : (
                                <span className="text-[11px] text-green-300/40 font-mono">
                                  UNSOLVED
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-white mb-1 line-clamp-1">
                              {q.title}
                            </p>
                            <p className="text-xs text-green-300/60 line-clamp-2">
                              {q.description}
                            </p>
                            <div className="mt-3 pt-2 border-t border-green-500/10 flex items-center justify-between text-[11px]">
                              <span className="text-green-500 font-mono font-bold">
                                {isCurrent ? '▶ ACTIVE' : 'OPEN CHALLENGE →'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TerminalBox>
        </div>


        {/* <button
              onClick={() => {
                setShowLeaderboard(!showLeaderboard);
                if (!showLeaderboard) loadLeaderboard();
              }}
              className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded transition-all text-sm"
            >
              <Trophy className="w-4 h-4" />
              LEADERBOARD
            </button> */}
        {/* <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT
            </button> */}
        {/* {showLeaderboard && (
          <div className="mb-6">
            <TerminalBox title="leaderboard.sh">
              {leaderboardData.length === 0 ? (
                <div className="text-center text-green-300/60">No scores yet</div>
              ) : (
                <div className="space-y-2">
                  {leaderboardData.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded text-sm ${
                        entry.team_name === teamName
                          ? 'bg-green-500/20 border border-green-500'
                          : 'bg-black/30 border border-green-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-500 text-black' :
                          idx === 1 ? 'bg-gray-400 text-black' :
                          idx === 2 ? 'bg-orange-600 text-black' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-green-400 font-bold">{entry.team_name}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-green-400 font-mono">{formatTime(entry.time_spent)}</p>
                        <p className="text-green-300/60">{entry.attempts} attempts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TerminalBox>
          </div>
        )} */}

        <div id="challenge-workspace" className="space-y-6 scroll-mt-6">
          <ChallengeErrorBoundary>
            <TerminalBox title={`challenge_${question?.id || 'active'}.sh`}>
              <div className="space-y-4 text-green-300">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2.5 py-1 bg-black/60 border border-green-500/40 text-green-400 font-bold rounded">
                      {question?.category}
                    </span>
                    {question?.difficulty?.toLowerCase() === 'hard' || question?.difficulty?.toLowerCase() === 'advanced' ? (
                      <span className="text-xs px-2.5 py-1 font-bold rounded border bg-red-500/20 text-red-400 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]">
                        HARD • 300 PTS
                      </span>
                    ) : question?.difficulty?.toLowerCase() === 'medium' || question?.difficulty?.toLowerCase() === 'intermediate' ? (
                      <span className="text-xs px-2.5 py-1 font-bold rounded border bg-orange-500/20 text-orange-400 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]">
                        MEDIUM • 200 PTS
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 font-bold rounded border bg-yellow-500/20 text-yellow-300 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.35)]">
                        EASY • 100 PTS
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl text-green-400 mb-3">{question?.title}</h2>
                  
                  {/* Formatted description with auto-hyperlinking */}
                  <div className="leading-relaxed whitespace-pre-line text-green-300/80 mb-4">
                    {renderDescriptionWithLinks(question?.description)}
                  </div>

                  {/* Dedicated Attached Artifacts & Evidence Downloads */}
                  {(() => {
                    const attachments = getChallengeAttachments(question);
                    if (!attachments || attachments.length === 0) return null;
                    return (
                      <div className="mt-5 p-4 bg-black/80 border border-green-500/35 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.12)] space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-green-500/20">
                          <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                            <Download className="w-4 h-4 text-green-400" />
                            <span>ATTACHED INVESTIGATION ARTIFACTS ({attachments.length})</span>
                          </div>
                          <span className="text-[10px] text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30 font-mono">
                            Direct Download
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {attachments.map((item, idx) => (
                            <div key={idx} className="flex flex-col justify-between p-3 bg-zinc-950/90 border border-green-500/25 rounded-md hover:border-green-400/60 transition-colors">
                              <div className="mb-2">
                                <div className="flex items-center gap-2 text-green-300 font-mono text-sm font-bold truncate">
                                  {item.type === 'archive' && <Archive className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                                  {item.type === 'file' && <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                                  {item.type === 'audio' && <Music className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                                  {item.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                                  {item.type === 'link' && <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                                  <span className="truncate" title={item.name}>{item.name}</span>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-green-300/60 mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                              </div>
                              <div className="mt-1">
                                {item.type === 'link' || item.url.startsWith('http') ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 hover:border-blue-400 text-blue-300 text-xs font-bold rounded transition-all cursor-pointer shadow-sm hover:shadow-blue-500/20"
                                  >
                                    <span>OPEN TARGET LINK ↗</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <a
                                    href={item.url}
                                    download={item.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 hover:border-green-400 text-green-300 hover:text-green-200 text-xs font-bold rounded transition-all cursor-pointer shadow-sm hover:shadow-green-500/20"
                                  >
                                    <Download className="w-3.5 h-3.5 text-green-400" />
                                    <span>DOWNLOAD {item.name}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Broadcast Receiver Audio Channels (for Q3 Broken Broadcast) */}
                  {(question?.media_type === 'audio' || (question?.audio_files && question.audio_files.length > 0) || question?.id?.includes('broken-broadcast') || question?.id === 'q3-broken-broadcast') && (
                    <div className="mt-5 p-4 bg-black/85 border border-green-500/40 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.15)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                          <span>BROADCAST RECEIVER CHANNELS (LISTEN & ANALYZE)</span>
                        </div>
                        <span className="text-[10px] text-yellow-400/90 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30 font-mono">
                          4 Radio Pieces
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(question?.audio_files && question.audio_files.length > 0
                          ? question.audio_files
                          : [
                              { name: 'Receiver Channel 1 (piece_1.wav)', url: '/challenges/media/radio_pieces/piece_1.wav' },
                              { name: 'Receiver Channel 2 (piece_2.wav)', url: '/challenges/media/radio_pieces/piece_2.wav' },
                              { name: 'Receiver Channel 3 (piece_3.wav)', url: '/challenges/media/radio_pieces/piece_3.wav' },
                              { name: 'Receiver Channel 4 (piece_4.wav)', url: '/challenges/media/radio_pieces/piece_4.wav' }
                            ]
                        ).map((audio, i) => (
                          <div key={i} className="p-3 bg-zinc-950/90 border border-green-500/30 rounded-md hover:border-green-400/80 transition-colors">
                            <p className="text-xs font-mono text-green-300 font-bold mb-2 flex items-center justify-between">
                              <span>📡 {audio?.name || `Channel ${i + 1}`}</span>
                            </p>
                            <audio controls preload="metadata" className="w-full h-8 accent-green-500">
                              <source src={audio?.url || ''} type="audio/wav" />
                              Your browser does not support HTML5 audio.
                            </audio>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Only show HINTS section for Hard challenges - no hints in Easy and Medium */}
                {question?.difficulty?.toLowerCase() === 'hard' && question?.hints && question.hints.length > 0 && (
                  <div className="border-t border-green-500/20 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-green-400 font-semibold">HINTS ({revealedHints.length}/{question.hints.length}):</h3>
                    </div>
                    {revealedHints.length === 0 ? (
                      <p className="text-green-300/50 text-xs italic">No hints unlocked yet. Click below to reveal a hint.</p>
                    ) : (
                      <ul className="space-y-2 text-green-300/80 text-sm">
                        {revealedHints.map((hintIndex) => (
                          <li key={hintIndex} className="bg-black/40 border border-green-500/20 p-2.5 rounded text-green-300">
                            💡 <span className="text-yellow-300/90 font-medium">Hint {hintIndex + 1}:</span> {question.hints[hintIndex]}
                          </li>
                        ))}
                      </ul>
                    )}
                    {revealedHints.length < question.hints.length && (
                      <button
                        onClick={revealNextHint}
                        className="mt-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-2 rounded transition-all text-sm font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <span>🔓 UNLOCK NEXT HINT</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </TerminalBox>

            {/* Visual Media Presentation (Images & Videos) */}
            {question && (question.media_type === 'image' || question.media_type === 'video') && question.media_url && (
              <TerminalBox title="media_viewer.sh">
                <div className="space-y-4">
                  {/* Image Media Preview */}
                  {question.media_type === 'image' && (
                    <div className="flex justify-center p-2 bg-black/50 border border-green-500/20 rounded">
                      <img
                        src={question.media_url}
                        alt={question.title}
                        className="max-h-96 w-auto object-contain rounded border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                      />
                    </div>
                  )}

                  {/* Video Media Preview */}
                  {question.media_type === 'video' && (
                    <div className="flex justify-center p-2 bg-black/50 border border-green-500/20 rounded">
                      <video
                        controls
                        className="max-h-96 w-full max-w-xl rounded border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                      >
                        <source src={question.media_url} type="video/mp4" />
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  )}
                </div>
              </TerminalBox>
            )}
          </ChallengeErrorBoundary>

          <TerminalBox title="flag_submission.sh">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(elapsedTime)}</span>
                </div>
                <div className="text-green-300/60">
                  Attempts: <span className="text-green-400 font-bold">{challenge?.attempts || 0}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-green-400 text-sm">ENTER FLAG:</label>
                  {question?.id === 'c2-ghs-frequency' && (
                    <span className="text-xs text-yellow-400/90 font-mono bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                      Flag format : flag&#123;&#125;
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder={
                    lockState.status === 'paused' ? 'Competition paused by admin (submissions frozen)...' :
                    lockState.status === 'ended' ? 'Competition concluded - submissions locked' :
                    lockState.status === 'draft' ? 'Competition starting soon...' :
                    (question?.id === 'c2-ghs-frequency' ? 'flag{...}' : 'Enter flag here...')
                  }
                  disabled={challenge?.completed || isEventLocked}
                  className="w-full bg-black/50 border border-green-500/30 rounded px-4 py-3 text-green-400 placeholder-green-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={challenge?.completed ? false : isEventLocked}
                className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEventLocked ? (
                  lockState.status === 'paused' ? (
                    <>
                      <Pause className="w-5 h-5 text-yellow-300" />
                      <span className="text-yellow-300 font-bold">COMPETITION PAUSED — SUBMISSIONS FROZEN</span>
                    </>
                  ) : lockState.status === 'draft' ? (
                    <>
                      <Clock className="w-5 h-5 text-blue-300" />
                      <span className="text-blue-300 font-bold">COMPETITION NOT STARTED YET</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-red-300" />
                      <span className="text-red-300 font-bold">TIME EXPIRED — SUBMISSIONS LOCKED</span>
                    </>
                  )
                ) : (
                  <>
                    <Terminal className="w-5 h-5" />
                    {challenge?.completed ? 'NEXT CHALLENGE →' : 'VERIFY FLAG'}
                  </>
                )}
              </button>
            </form>

            {result && (
              <div className={`mt-4 p-4 rounded-lg border-2 flex items-center gap-3 animate-fade-in ${result === 'correct'
                  ? 'bg-green-500/10 border-green-500 text-green-400'
                  : 'bg-red-500/10 border-red-500 text-red-400'
                }`}>
                {result === 'correct' ? (
                  <>
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="font-bold">ACCESS GRANTED!</p>
                      <p className="text-sm opacity-80">
                        Flag verified. Loading next challenge...
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="font-bold">ACCESS DENIED</p>
                      <p className="text-sm opacity-80">Incorrect flag. Keep analyzing...</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </TerminalBox>

          {/* Team Notes Section */}
          <TerminalBox title="team_notes.sh">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold text-emerald-400">Team Notes</h3>
              </div>

              {/* Add New Note */}
              <form onSubmit={addTeamNote} className="space-y-3">
                <div>
                  <label className="block text-emerald-400 mb-2 text-sm">ADD NOTE:</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Share your progress, ideas, or findings with your team..."
                    className="w-full bg-black/50 border border-emerald-500/30 rounded px-4 py-3 text-emerald-400 placeholder-emerald-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    rows={3}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  ADD NOTE
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teamNotes.length === 0 ? (
                  <p className="text-emerald-400/60 text-center py-8">No team notes yet. Be the first to share!</p>
                ) : (
                  teamNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-black/30 border border-emerald-500/20 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-emerald-400 font-semibold text-sm">
                          {new Date(note.created_at).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingNote(note.id);
                              setEditContent(note.note_content);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTeamNote(note.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-black/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-400 focus:border-emerald-500 focus:outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateTeamNote(note.id, editContent)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-3 py-1 rounded text-sm transition-all"
                            >
                              SAVE
                            </button>
                            <button
                              onClick={() => {
                                setEditingNote(null);
                                setEditContent('');
                              }}
                              className="bg-gray-600 hover:bg-gray-500 text-black font-semibold px-3 py-1 rounded text-sm transition-all"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-emerald-300 text-sm leading-relaxed">
                          {note.note_content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TerminalBox>
        </div>
      </div>
    </div>
  );
}
