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
  const [loading, setLoading] = useState<'A' | 'B' | null>(null);
  const crossfaderRef = useRef(50);

  // Init engine
  useEffect(() => {
    audioEngine.init();
    midiController.init().then(ok => {
      setMidiConnected(ok);
      // Resume audio context once MIDI is connected
      if (ok) audioEngine.resume();
    });

    const deckListener = (id: 'A' | 'B', state: DeckState) => {
      if (id === 'A') setDeckA(s => ({ ...s, ...state }));
      else setDeckB(s => ({ ...s, ...state }));
    };
    const masterListener = (data: { levelA: number; levelB: number }) => {
      setLevels(data);
    };
    audioEngine.onDeckUpdate(deckListener);
    audioEngine.onMasterLevel(masterListener);

    const fbListener = (f: Feedback) => {
      setFeedbacks(prev => [f, ...prev].slice(0, 8));
    };
    const scoreListener = (p: PerformanceData) => setPerformance(p);
    aiCoach.onFeedback(fbListener);
    aiCoach.onScoreUpdate(scoreListener);

    // MIDI control handler
    const midiHandler = async (target: string, value: number) => {
      // Resume AudioContext on any MIDI input (MIDI events aren't user gestures)
      await audioEngine.resume();

      if (target === 'mixer.crossfader') {
        const v = Math.round(value * 100);
        audioEngine.setCrossfader(v);
        setCrossfader(v);
        crossfaderRef.current = v;
        return;
      }

      const deckId: 'A' | 'B' = target.startsWith('deckA') ? 'A' : 'B';
      const deck = audioEngine.getDeck(deckId);
      if (!deck) return;

      if (target.endsWith('.tempo')) {
        deck.setTempo(value * 16 - 8);
      } else if (target.endsWith('.play')) {
        if (value > 0.5) {
          if (deck.state.playing) deck.pause();
          else deck.play();
        }
      } else if (target.endsWith('.volume')) {
        deck.setVolume(value);
        deck.gainNode.gain.value = value;
      } else if (target.endsWith('.eq_hi')) {
        deck.setEQ('hi', value * 100);
      } else if (target.endsWith('.eq_mid')) {
        deck.setEQ('mid', value * 100);
      } else if (target.endsWith('.eq_lo')) {
        deck.setEQ('lo', value * 100);
      } else if (target.endsWith('.cue')) {
        if (value > 0.5) deck.cue();
      }
    };
    midiController.onControl(midiHandler);

    return () => {
      audioEngine.offDeckUpdate(deckListener);
      audioEngine.offMasterLevel(masterListener);
      aiCoach.offFeedback(fbListener);
      aiCoach.offScoreUpdate(scoreListener);
      midiController.offControl(midiHandler);
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
      // Apply actions in assist mode
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
    midiConnected, loadFile, play, pause, cue, setTempo, setEQ, setFilter,
    nudge, scratch, updateCrossfader, getTransitionSuggestion, getGhostData,
    energy: aiCoach.getEnergy(),
    mistakes: aiCoach.getMistakes(),
    feedbackLog: aiCoach.getFeedbackLog(),
  };
}
