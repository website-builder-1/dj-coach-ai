// AI Coaching Engine — mistake detection, feedback, performance scoring, mistake memory
import { DeckState } from './audioEngine';

export interface Feedback {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
  timestamp: number;
  category: string;
}

export interface PerformanceData {
  score: number;
  trend: 'improving' | 'dropping' | 'stable';
  history: number[];
  streak: number;
  bestStreak: number;
}

export interface MistakeRecord {
  type: string;
  count: number;
  lastOccurrence: number;
  description: string;
}

export interface TransitionSuggestion {
  id: string;
  description: string;
  steps: string[];
  confidence: number;
}

class AICoach {
  private feedbackLog: Feedback[] = [];
  private mistakes: Map<string, MistakeRecord> = new Map();
  private scoreHistory: number[] = [50];
  private currentScore = 50;
  private streak = 0;
  private bestStreak = 0;
  private lastCheck = 0;
  private feedbackListeners: ((f: Feedback) => void)[] = [];
  private scoreListeners: ((p: PerformanceData) => void)[] = [];
  private energyLevel = 50;

  onFeedback(fn: (f: Feedback) => void) { this.feedbackListeners.push(fn); }
  offFeedback(fn: (f: Feedback) => void) { this.feedbackListeners = this.feedbackListeners.filter(f2 => f2 !== fn); }
  onScoreUpdate(fn: (p: PerformanceData) => void) { this.scoreListeners.push(fn); }
  offScoreUpdate(fn: (p: PerformanceData) => void) { this.scoreListeners = this.scoreListeners.filter(f => f !== fn); }

  private emit(fb: Feedback) {
    this.feedbackLog.push(fb);
    this.feedbackListeners.forEach(fn => fn(fb));
  }

  private emitScore() {
    const trend = this.scoreHistory.length > 3
      ? (this.currentScore > this.scoreHistory[this.scoreHistory.length - 4] ? 'improving' : this.currentScore < this.scoreHistory[this.scoreHistory.length - 4] ? 'dropping' : 'stable')
      : 'stable';
    this.scoreListeners.forEach(fn => fn({
      score: this.currentScore,
      trend,
      history: [...this.scoreHistory],
      streak: this.streak,
      bestStreak: this.bestStreak,
    }));
  }

  private recordMistake(type: string, description: string) {
    const existing = this.mistakes.get(type);
    if (existing) {
      existing.count++;
      existing.lastOccurrence = Date.now();
    } else {
      this.mistakes.set(type, { type, count: 1, lastOccurrence: Date.now(), description });
    }
    this.streak = 0;
    this.adjustScore(-3);
  }

  private recordSuccess() {
    this.streak++;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    this.adjustScore(2);
  }

  private adjustScore(delta: number) {
    this.currentScore = Math.max(0, Math.min(100, this.currentScore + delta));
    this.scoreHistory.push(this.currentScore);
    if (this.scoreHistory.length > 100) this.scoreHistory.shift();
    this.emitScore();
  }

  // Analyze current state of both decks
  analyze(deckA: DeckState, deckB: DeckState, crossfader: number, mode: 'learning' | 'assist'): {
    actions: Array<{ type: string; target: string; value: number }>;
  } {
    const now = Date.now();
    if (now - this.lastCheck < 2000) return { actions: [] }; // throttle
    this.lastCheck = now;

    const actions: Array<{ type: string; target: string; value: number }> = [];
    const bothPlaying = deckA.playing && deckB.playing;

    if (!bothPlaying) {
      this.updateEnergy(deckA, deckB);
      return { actions };
    }

    // 1. BPM mismatch detection
    if (deckA.bpm > 0 && deckB.bpm > 0) {
      const effectiveBpmA = deckA.bpm * (1 + deckA.tempo / 100);
      const effectiveBpmB = deckB.bpm * (1 + deckB.tempo / 100);
      const bpmDiff = Math.abs(effectiveBpmA - effectiveBpmB);

      if (bpmDiff > 2) {
        this.recordMistake('bpm_drift', 'BPM drift between decks');
        const repeatedMsg = this.getRepeatedAdvice('bpm_drift');
        if (mode === 'learning') {
          this.emit({
            id: crypto.randomUUID(), type: 'warning',
            text: repeatedMsg || `BPM drift: ${bpmDiff.toFixed(1)} BPM apart. Adjust tempo on ${effectiveBpmA > effectiveBpmB ? 'Deck A' : 'Deck B'}`,
            timestamp: now, category: 'bpm',
          });
        } else {
          // Assist: auto-adjust tempo
          const target = effectiveBpmA > effectiveBpmB ? 'deckB' : 'deckA';
          const targetBpm = (effectiveBpmA + effectiveBpmB) / 2;
          const baseBpm = target === 'deckA' ? deckA.bpm : deckB.bpm;
          const newTempo = ((targetBpm / baseBpm) - 1) * 100;
          actions.push({ type: 'tempo', target, value: newTempo });
          this.emit({
            id: crypto.randomUUID(), type: 'info',
            text: `Auto-synced BPM — adjusted ${target === 'deckA' ? 'Deck A' : 'Deck B'} tempo`,
            timestamp: now, category: 'bpm',
          });
        }
      } else if (bpmDiff < 0.5) {
        this.recordSuccess();
        this.emit({
          id: crypto.randomUUID(), type: 'success',
          text: 'Beat alignment: locked',
          timestamp: now, category: 'bpm',
        });
      }
    }

    // 2. Bass clash detection (both have high low EQ while crossfader is centered)
    if (crossfader > 25 && crossfader < 75) {
      if (deckA.eq.lo > 60 && deckB.eq.lo > 60) {
        this.recordMistake('bass_clash', 'Both bass frequencies active during blend');
        if (mode === 'learning') {
          this.emit({
            id: crypto.randomUUID(), type: 'error',
            text: 'Bass clash! Cut bass on incoming track during transition',
            timestamp: now, category: 'eq',
          });
        } else {
          // Assist: reduce bass on deck B (incoming)
          actions.push({ type: 'eq_lo', target: 'deckB', value: 20 });
          this.emit({
            id: crypto.randomUUID(), type: 'info',
            text: 'Auto-reduced incoming bass to avoid clash',
            timestamp: now, category: 'eq',
          });
        }
      }
    }

    // 3. Crossfader transition quality
    if (crossfader > 10 && crossfader < 90) {
      this.emit({
        id: crypto.randomUUID(), type: 'info',
        text: `Blending — crossfader at ${crossfader}%`,
        timestamp: now, category: 'transition',
      });
    }

    // 4. Energy monitoring
    this.updateEnergy(deckA, deckB);

    return { actions };
  }

  private updateEnergy(deckA: DeckState, deckB: DeckState) {
    // Simplified energy based on playing state and score
    let energy = 30;
    if (deckA.playing) energy += 20;
    if (deckB.playing) energy += 20;
    energy += (this.currentScore - 50) * 0.3;
    this.energyLevel = Math.max(0, Math.min(100, energy));
  }

  getEnergy() { return this.energyLevel; }

  private getRepeatedAdvice(type: string): string | null {
    const record = this.mistakes.get(type);
    if (!record || record.count < 3) return null;
    switch (type) {
      case 'bpm_drift': return `You've had BPM drift ${record.count} times — try matching tempos before transitioning`;
      case 'bass_clash': return `Bass clash again (${record.count}x) — remember to cut bass on the incoming track`;
      default: return null;
    }
  }

  generateTransitionSuggestion(deckA: DeckState, deckB: DeckState): TransitionSuggestion | null {
    if (!deckA.loaded || !deckB.loaded) return null;

    const bpmDiff = Math.abs(deckA.bpm - deckB.bpm);
    const steps: string[] = [];
    let description = '';

    if (bpmDiff > 4) {
      description = 'Tempo-matched blend transition';
      steps.push(`Adjust ${deckA.bpm > deckB.bpm ? 'Deck B' : 'Deck A'} tempo to match`);
      steps.push('Cut bass on incoming track');
      steps.push('Slowly blend crossfader over 16 bars');
      steps.push('Swap bass at phrase boundary');
      steps.push('Complete crossfader movement');
    } else {
      description = 'Clean phrase-aligned cut';
      steps.push('Wait for phrase boundary (next 8 bars)');
      steps.push('Cut bass on incoming track');
      steps.push('Quick crossfader blend (4 bars)');
      steps.push('Swap bass frequencies');
      steps.push('Cut outgoing track');
    }

    return {
      id: crypto.randomUUID(),
      description,
      steps,
      confidence: Math.max(50, 100 - bpmDiff * 5),
    };
  }

  getGhostMixData(deckA: DeckState, deckB: DeckState): { idealCrossfader: number[]; idealEqA: number[]; idealEqB: number[] } {
    // Generate ideal crossfader/EQ curve for a 32-bar transition
    const points = 64;
    const idealCrossfader: number[] = [];
    const idealEqA: number[] = [];
    const idealEqB: number[] = [];

    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      // S-curve crossfader
      idealCrossfader.push(1 / (1 + Math.exp(-10 * (t - 0.5))) * 100);
      // EQ swap at 50% point
      idealEqA.push(t < 0.4 ? 50 : 50 - (t - 0.4) * 83);
      idealEqB.push(t < 0.3 ? 0 : Math.min(50, (t - 0.3) * 71));
    }

    return { idealCrossfader, idealEqA, idealEqB };
  }

  getMistakes() { return Array.from(this.mistakes.values()); }
  getFeedbackLog() { return [...this.feedbackLog]; }
  getScore() { return this.currentScore; }
  getPerformanceData(): PerformanceData {
    const trend = this.scoreHistory.length > 3
      ? (this.currentScore > this.scoreHistory[this.scoreHistory.length - 4] ? 'improving' : this.currentScore < this.scoreHistory[this.scoreHistory.length - 4] ? 'dropping' : 'stable')
      : 'stable';
    return {
      score: this.currentScore,
      trend,
      history: [...this.scoreHistory],
      streak: this.streak,
      bestStreak: this.bestStreak,
    };
  }

  reset() {
    this.feedbackLog = [];
    this.mistakes.clear();
    this.scoreHistory = [50];
    this.currentScore = 50;
    this.streak = 0;
    this.bestStreak = 0;
    this.energyLevel = 50;
  }
}

export const aiCoach = new AICoach();
