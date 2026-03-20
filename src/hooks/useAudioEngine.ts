import { useState, useEffect, useCallback, useRef } from 'react';
import { audioEngine, DeckState } from '@/lib/audioEngine';
import { aiCoach, Feedback, PerformanceData, TransitionSuggestion } from '@/lib/aiCoach';
import { midiController } from '@/lib/midiController';

const DEFAULT_STATE: DeckState = {
  loaded: false, playing: false, currentTime: 0, duration: 0,
  bpm: 0, key: '—', tempo: 0, cuePoint: 0, volume: 1,
  eq: { hi: 50, mid: 50, lo: 50, gain: 70 },
  filter: { type: 'off', frequency: 1000 },
  waveformPeaks: null, audioBuffer: null, fileName: '',
};

export function useAudioEngine(smartFader: boolean, mode: 'learning' | 'assist') {
  const [deckA, setDeckA] = useState<DeckState>(DEFAULT_STATE);
  const [deckB, setDeckB] = useState<DeckState>(DEFAULT_STATE);
  const [crossfader, setCrossfader] = useState(50);
  const [levels, setLevels] = useState({ levelA: 0, levelB: 0 });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [performance, setPerformance] = useState<PerformanceData>({ score: 50, trend: 'stable', history: [50], streak: 0, bestStreak: 0 });
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState('');
  const [loading, setLoading] = useState<'A' | 'B' | null>(null);
  const crossfaderRef = useRef(50);

  useEffect(() => {
    audioEngine.init();
    midiController.init().then(ok => {
      setMidiConnected(ok);
      if (ok) {
        setMidiDeviceName(midiController.deviceName);
        audioEngine.resume();
      }
    });

    // Resume AudioContext on first user interaction
    const resumeOnInteraction = () => {
      audioEngine.resume();
      window.removeEventListener('click', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
    };
    window.addEventListener('click', resumeOnInteraction);
    window.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('touchstart', resumeOnInteraction);

    // Connection state listener
    const connListener = (connected: boolean, name: string) => {
      setMidiConnected(connected);
      setMidiDeviceName(name);
      if (connected) audioEngine.resume();
    };
    midiController.onConnection(connListener);

    // Deck state listeners
    const deckListener = (id: 'A' | 'B', state: DeckState) => {
      if (id === 'A') setDeckA(s => ({ ...s, ...state }));
      else setDeckB(s => ({ ...s, ...state }));
    };
    const masterListener = (data: { levelA: number; levelB: number }) => {
      setLevels(data);
    };
    audioEngine.onDeckUpdate(deckListener);
    audioEngine.onMasterLevel(masterListener);

    // AI listeners
    const fbListener = (f: Feedback) => {
      setFeedbacks(prev => [f, ...prev].slice(0, 8));
    };
    const scoreListener = (p: PerformanceData) => setPerformance(p);
    aiCoach.onFeedback(fbListener);
    aiCoach.onScoreUpdate(scoreListener);

    // --- MIDI control handler ---
    const midiHandler = async (target: string, value: number) => {
      // Always resume audio on any MIDI input
      await audioEngine.resume();

      // === MIXER CONTROLS ===
      if (target === 'mixer.crossfader') {
        const v = Math.round(value * 100);
        audioEngine.setCrossfader(v);
        setCrossfader(v);
        crossfaderRef.current = v;
        return;
      }
      if (target === 'mixer.master_level') {
        // Could control master gain — for now just log
        return;
      }
      if (target === 'mixer.smart_fader') {
        // Smart fader toggle is handled via UI state, not here
        return;
      }

      // === DECK CONTROLS ===
      const deckId: 'A' | 'B' = target.startsWith('deckA') ? 'A' : 'B';
      const deck = audioEngine.getDeck(deckId);
      if (!deck) return;

      const control = target.split('.')[1];

      switch (control) {
        case 'play':
          // Note on = toggle play/pause
          if (value > 0.5) {
            if (deck.state.playing) deck.pause();
            else deck.play();
          }
          break;

        case 'cue':
          if (value > 0.5) deck.cue();
          break;

        case 'sync':
          if (value > 0.5) {
            // Sync BPM to the other deck
            const otherDeck = audioEngine.getDeck(deckId === 'A' ? 'B' : 'A');
            if (otherDeck && otherDeck.state.loaded && deck.state.loaded) {
              const targetBPM = otherDeck.state.bpm * (1 + otherDeck.state.tempo / 100);
              const baseBPM = deck.state.bpm;
              if (baseBPM > 0) {
                const tempoAdj = ((targetBPM / baseBPM) - 1) * 100;
                deck.setTempo(Math.max(-8, Math.min(8, tempoAdj)));
              }
            }
          }
          break;

        case 'tempo':
          // 0..1 mapped to -8..+8 percent
          // Fader is inverted on Pioneer: top = 0, bottom = 127
          const tempoVal = (1 - value) * 16 - 8;
          deck.setTempo(tempoVal);
          break;

        case 'volume':
          // Channel fader: 0..1
          deck.setVolume(value);
          deck.gainNode.gain.value = value;
          break;

        case 'eq_hi':
          deck.setEQ('hi', value * 100);
          break;

        case 'eq_mid':
          deck.setEQ('mid', value * 100);
          break;

        case 'eq_lo':
          deck.setEQ('lo', value * 100);
          break;

        case 'jog_touch':
          // Track whether the platter is being touched
          midiController.setJogTouching(deckId, value > 0.5);
          break;

        case 'jog_platter': {
          // Relative value: positive = clockwise, negative = counter-clockwise
          const delta = value as number; // Already decoded as relative in midiController
          if (midiController.isJogTouching(deckId) && !deck.state.playing) {
            // Scratch when touching + paused
            deck.scratch(delta * 0.01); // scale to seconds
          } else {
            // Nudge when playing
            if (deck.state.playing) {
              deck.nudge(delta > 0 ? 1 : -1);
            }
          }
          break;
        }

        case 'jog_ring': {
          // Outer ring — always nudge (pitch bend)
          const ringDelta = value as number;
          if (deck.state.playing) {
            deck.nudge(ringDelta > 0 ? 1 : -1);
          }
          break;
        }

        case 'shift':
          // Shift state tracked in midiController
          break;

        case 'headphone_cue':
          // Headphone routing — could implement later
          break;

        default:
          // Pad controls (pad1-pad8, pad1_shift-pad8_shift)
          if (control?.startsWith('pad') && value > 0.5) {
            // Performance pads — could trigger cue points, samples, etc.
            // For now, pads 1-4 could set cue points, 5-8 could trigger effects
            const padNum = parseInt(control.replace('pad', '').replace('_shift', ''));
            if (!isNaN(padNum) && padNum >= 1 && padNum <= 4 && !control.includes('shift')) {
              // Hot cue — set cue point at current position
              if (deck.state.playing) {
                deck.state.cuePoint = deck.getCurrentTime();
              } else {
                // Jump to cue point and play
                deck.cue();
                deck.play();
              }
            }
          }
          break;
      }
    };

    midiController.onControl(midiHandler);

    return () => {
      audioEngine.offDeckUpdate(deckListener);
      audioEngine.offMasterLevel(masterListener);
      aiCoach.offFeedback(fbListener);
      aiCoach.offScoreUpdate(scoreListener);
      midiController.offControl(midiHandler);
      midiController.offConnection(connListener);
      window.removeEventListener('click', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
    };
  }, []);

  // AI analysis loop
  useEffect(() => {
    if (!smartFader) return;
    const interval = setInterval(() => {
      const dA = audioEngine.getDeck('A');
      const dB = audioEngine.getDeck('B');
      if (!dA || !dB) return;
      const result = aiCoach.analyze(dA.state, dB.state, crossfaderRef.current, mode);
      result.actions.forEach(action => {
        const deck = audioEngine.getDeck(action.target === 'deckA' ? 'A' : 'B');
        if (!deck) return;
        if (action.type === 'tempo') deck.setTempo(action.value);
        else if (action.type === 'eq_lo') deck.setEQ('lo', action.value);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [smartFader, mode]);

  const loadFile = useCallback(async (deckId: 'A' | 'B', file: File) => {
    setLoading(deckId);
    try {
      await audioEngine.loadFile(deckId, file);
    } finally {
      setLoading(null);
    }
  }, []);

  const play = useCallback((id: 'A' | 'B') => audioEngine.getDeck(id)?.play(), []);
  const pause = useCallback((id: 'A' | 'B') => audioEngine.getDeck(id)?.pause(), []);
  const cue = useCallback((id: 'A' | 'B') => audioEngine.getDeck(id)?.cue(), []);
  const setTempo = useCallback((id: 'A' | 'B', val: number) => audioEngine.getDeck(id)?.setTempo(val), []);
  const setEQ = useCallback((id: 'A' | 'B', band: 'hi' | 'mid' | 'lo' | 'gain', val: number) => audioEngine.getDeck(id)?.setEQ(band, val), []);
  const setFilter = useCallback((id: 'A' | 'B', type: 'off' | 'hpf' | 'lpf', freq: number) => audioEngine.getDeck(id)?.setFilter(type, freq), []);
  const nudge = useCallback((id: 'A' | 'B', dir: number) => audioEngine.getDeck(id)?.nudge(dir), []);
  const scratch = useCallback((id: 'A' | 'B', delta: number) => audioEngine.getDeck(id)?.scratch(delta), []);

  const updateCrossfader = useCallback((val: number) => {
    setCrossfader(val);
    crossfaderRef.current = val;
    audioEngine.setCrossfader(val);
  }, []);

  const getTransitionSuggestion = useCallback((): TransitionSuggestion | null => {
    const dA = audioEngine.getDeck('A');
    const dB = audioEngine.getDeck('B');
    if (!dA || !dB) return null;
    return aiCoach.generateTransitionSuggestion(dA.state, dB.state);
  }, []);

  const getGhostData = useCallback(() => {
    const dA = audioEngine.getDeck('A');
    const dB = audioEngine.getDeck('B');
    if (!dA || !dB) return null;
    return aiCoach.getGhostMixData(dA.state, dB.state);
  }, []);

  return {
    deckA, deckB, crossfader, levels, feedbacks, performance, loading,
    midiConnected, midiDeviceName, loadFile, play, pause, cue, setTempo, setEQ, setFilter,
    nudge, scratch, updateCrossfader, getTransitionSuggestion, getGhostData,
    energy: aiCoach.getEnergy(),
    mistakes: aiCoach.getMistakes(),
    feedbackLog: aiCoach.getFeedbackLog(),
  };
}
