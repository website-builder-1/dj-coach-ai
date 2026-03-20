// Core Web Audio API engine for DJ Mentor
export interface DeckState {
  loaded: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  key: string;
  tempo: number; // percentage adjustment (-8 to +8)
  cuePoint: number;
  volume: number;
  eq: { hi: number; mid: number; lo: number; gain: number };
  filter: { type: 'off' | 'hpf' | 'lpf'; frequency: number };
  waveformPeaks: Float32Array | null;
  audioBuffer: AudioBuffer | null;
  fileName: string;
}

type DeckId = 'A' | 'B';
type DeckListener = (deck: DeckId, state: DeckState) => void;
type MasterListener = (data: { levelA: number; levelB: number }) => void;

const DEFAULT_DECK_STATE: DeckState = {
  loaded: false, playing: false, currentTime: 0, duration: 0,
  bpm: 0, key: '—', tempo: 0, cuePoint: 0, volume: 1,
  eq: { hi: 50, mid: 50, lo: 50, gain: 70 },
  filter: { type: 'off', frequency: 1000 },
  waveformPeaks: null, audioBuffer: null, fileName: '',
};

class DeckNode {
  source: AudioBufferSourceNode | null = null;
  gainNode: GainNode;
  eqHi: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqLo: BiquadFilterNode;
  filterNode: BiquadFilterNode;
  analyser: AnalyserNode;
  state: DeckState = { ...DEFAULT_DECK_STATE };
  private startOffset = 0;
  private startTime = 0;
  private ctx: AudioContext;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.gainNode = ctx.createGain();
    this.eqHi = ctx.createBiquadFilter();
    this.eqHi.type = 'highshelf';
    this.eqHi.frequency.value = 3200;
    this.eqMid = ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 0.7;
    this.eqLo = ctx.createBiquadFilter();
    this.eqLo.type = 'lowshelf';
    this.eqLo.frequency.value = 320;
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'allpass';
    this.filterNode.frequency.value = 1000;

    // Chain: source -> eqLo -> eqMid -> eqHi -> filter -> gain -> analyser -> destination
    this.eqLo.connect(this.eqMid);
    this.eqMid.connect(this.eqHi);
    this.eqHi.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(destination);
  }

  loadBuffer(buffer: AudioBuffer, fileName: string) {
    this.stop();
    this.state.audioBuffer = buffer;
    this.state.duration = buffer.duration;
    this.state.loaded = true;
    this.state.fileName = fileName;
    this.state.currentTime = 0;
    this.state.cuePoint = 0;
    this.startOffset = 0;
  }

  play() {
    if (!this.state.audioBuffer || this.state.playing) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.state.audioBuffer;
    this.source.playbackRate.value = 1 + this.state.tempo / 100;
    this.source.connect(this.eqLo);
    this.source.start(0, this.startOffset);
    this.startTime = this.ctx.currentTime;
    this.state.playing = true;
    this.source.onended = () => {
      if (this.state.playing) {
        this.state.playing = false;
        this.startOffset = 0;
        this.state.currentTime = 0;
      }
    };
  }

  pause() {
    if (!this.state.playing || !this.source) return;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.source.playbackRate.value;
    this.startOffset += elapsed;
    if (this.startOffset > this.state.duration) this.startOffset = 0;
    this.source.onended = null;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.state.playing = false;
  }

  stop() {
    this.pause();
    this.startOffset = 0;
    this.state.currentTime = 0;
  }

  cue() {
    if (this.state.playing) {
      // Set cue point at current position
      this.state.cuePoint = this.getCurrentTime();
      this.pause();
      this.startOffset = this.state.cuePoint;
      this.state.currentTime = this.state.cuePoint;
    } else {
      // Return to cue point
      this.startOffset = this.state.cuePoint;
      this.state.currentTime = this.state.cuePoint;
    }
  }

  getCurrentTime(): number {
    if (!this.state.playing || !this.source) return this.startOffset;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.source.playbackRate.value;
    const t = this.startOffset + elapsed;
    return Math.min(t, this.state.duration);
  }

  setTempo(pct: number) {
    this.state.tempo = pct;
    if (this.source) {
      this.source.playbackRate.value = 1 + pct / 100;
    }
  }

  setEQ(band: 'hi' | 'mid' | 'lo' | 'gain', value: number) {
    this.state.eq[band] = value;
    const dbRange = 24;
    const db = ((value - 50) / 50) * dbRange;
    switch (band) {
      case 'hi': this.eqHi.gain.value = db; break;
      case 'mid': this.eqMid.gain.value = db; break;
      case 'lo': this.eqLo.gain.value = db; break;
      case 'gain': this.gainNode.gain.value = value / 70; break;
    }
  }

  setFilter(type: 'off' | 'hpf' | 'lpf', frequency: number) {
    this.state.filter = { type, frequency };
    if (type === 'off') {
      this.filterNode.type = 'allpass';
    } else {
      this.filterNode.type = type === 'hpf' ? 'highpass' : 'lowpass';
      this.filterNode.frequency.value = frequency;
      this.filterNode.Q.value = 0.707;
    }
  }

  nudge(direction: number) {
    if (!this.source || !this.state.playing) return;
    // Temporarily speed up/slow down
    const base = 1 + this.state.tempo / 100;
    this.source.playbackRate.value = base + direction * 0.02;
    setTimeout(() => {
      if (this.source) this.source.playbackRate.value = base;
    }, 200);
  }

  scratch(delta: number) {
    if (this.state.playing) return;
    this.startOffset = Math.max(0, Math.min(this.state.duration, this.startOffset + delta));
    this.state.currentTime = this.startOffset;
  }

  getLevel(): number {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return (sum / data.length / 255) * 100;
  }

  setVolume(v: number) {
    this.state.volume = v;
    // Volume is controlled by crossfader in the engine
  }

  updateCurrentTime() {
    this.state.currentTime = this.getCurrentTime();
  }
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  deckA: DeckNode | null = null;
  deckB: DeckNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private crossfader = 50;
  private listeners: DeckListener[] = [];
  private masterListeners: MasterListener[] = [];
  private rafId: number | null = null;

  async init() {
    if (this.ctx) {
      // Always try to resume in case it's suspended
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    this.ctx = new AudioContext();
    this.gainA = this.ctx.createGain();
    this.gainB = this.ctx.createGain();
    this.gainA.connect(this.ctx.destination);
    this.gainB.connect(this.ctx.destination);
    this.deckA = new DeckNode(this.ctx, this.gainA);
    this.deckB = new DeckNode(this.ctx, this.gainB);
    this.applyCrossfader();
    this.startLoop();
  }

  async resume() {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private startLoop() {
    const tick = () => {
      this.deckA?.updateCurrentTime();
      this.deckB?.updateCurrentTime();
      this.listeners.forEach(fn => {
        if (this.deckA) fn('A', { ...this.deckA.state });
        if (this.deckB) fn('B', { ...this.deckB.state });
      });
      const levelA = this.deckA?.getLevel() ?? 0;
      const levelB = this.deckB?.getLevel() ?? 0;
      this.masterListeners.forEach(fn => fn({ levelA, levelB }));
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  onDeckUpdate(fn: DeckListener) { this.listeners.push(fn); }
  offDeckUpdate(fn: DeckListener) { this.listeners = this.listeners.filter(f => f !== fn); }
  onMasterLevel(fn: MasterListener) { this.masterListeners.push(fn); }
  offMasterLevel(fn: MasterListener) { this.masterListeners = this.masterListeners.filter(f => f !== fn); }

  getDeck(id: DeckId): DeckNode | null {
    return id === 'A' ? this.deckA : this.deckB;
  }

  async loadFile(deckId: DeckId, file: File): Promise<{ waveformPeaks: Float32Array; bpm: number; key: string }> {
    await this.init();
    const arrayBuf = await file.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuf);
    const deck = this.getDeck(deckId)!;
    deck.loadBuffer(audioBuffer, file.name);

    // Extract waveform peaks
    const peaks = extractPeaks(audioBuffer, 800);
    deck.state.waveformPeaks = peaks;

    // Detect BPM
    const bpm = detectBPM(audioBuffer);
    deck.state.bpm = bpm;

    // Detect key (simplified)
    const key = detectKey(audioBuffer);
    deck.state.key = key;

    return { waveformPeaks: peaks, bpm, key };
  }

  setCrossfader(value: number) {
    this.crossfader = value;
    this.applyCrossfader();
  }

  getCrossfader() { return this.crossfader; }

  private applyCrossfader() {
    if (!this.gainA || !this.gainB) return;
    // Equal-power crossfade
    const x = this.crossfader / 100;
    this.gainA.gain.value = Math.cos(x * Math.PI / 2);
    this.gainB.gain.value = Math.sin(x * Math.PI / 2);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.deckA?.stop();
    this.deckB?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

// === BPM Detection ===
function detectBPM(buffer: AudioBuffer): number {
  const offlineCtx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  // Low-pass filter the signal for kick detection
  const filtered = new Float32Array(data.length);
  let prev = 0;
  const alpha = 0.05;
  for (let i = 0; i < data.length; i++) {
    prev = prev + alpha * (Math.abs(data[i]) - prev);
    filtered[i] = prev;
  }

  // Find peaks
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const peaks: number[] = [];
  for (let i = windowSize; i < filtered.length - windowSize; i += windowSize) {
    let maxVal = 0, maxIdx = i;
    for (let j = i; j < i + windowSize && j < filtered.length; j++) {
      if (filtered[j] > maxVal) { maxVal = filtered[j]; maxIdx = j; }
    }
    if (maxVal > 0.01) peaks.push(maxIdx);
  }

  if (peaks.length < 2) return 120; // fallback

  // Calculate intervals
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const interval = (peaks[i] - peaks[i - 1]) / sampleRate * 60;
    if (interval > 0) {
      const bpm = 60 / ((peaks[i] - peaks[i - 1]) / sampleRate);
      if (bpm >= 60 && bpm <= 200) intervals.push(bpm);
    }
  }

  if (intervals.length === 0) return 120;

  // Cluster and find most common BPM
  const rounded = intervals.map(b => Math.round(b));
  const counts = new Map<number, number>();
  rounded.forEach(b => counts.set(b, (counts.get(b) || 0) + 1));
  let bestBPM = 120, bestCount = 0;
  counts.forEach((count, bpm) => {
    if (count > bestCount) { bestCount = count; bestBPM = bpm; }
  });

  return bestBPM;
}

// === Key Detection (simplified chromagram) ===
function detectKey(buffer: AudioBuffer): string {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  // Use first 10 seconds
  const len = Math.min(data.length, sampleRate * 10);
  const fftSize = 4096;
  const chroma = new Float32Array(12);

  for (let offset = 0; offset + fftSize < len; offset += fftSize) {
    // Simple energy in each frequency bin mapped to chroma
    for (let i = 0; i < fftSize; i++) {
      const freq = (i * sampleRate) / fftSize;
      if (freq < 60 || freq > 2000) continue;
      const noteNum = 12 * Math.log2(freq / 440) + 69;
      const chromaIdx = Math.round(noteNum) % 12;
      if (chromaIdx >= 0 && chromaIdx < 12) {
        chroma[chromaIdx] += data[offset + i] * data[offset + i];
      }
    }
  }

  let maxIdx = 0;
  for (let i = 1; i < 12; i++) {
    if (chroma[i] > chroma[maxIdx]) maxIdx = i;
  }

  // Determine major/minor (simplified)
  const third = chroma[(maxIdx + 4) % 12];
  const minThird = chroma[(maxIdx + 3) % 12];
  const isMinor = minThird > third;

  return keys[maxIdx] + (isMinor ? 'm' : '');
}

// === Waveform Peak Extraction ===
function extractPeaks(buffer: AudioBuffer, numPeaks: number): Float32Array {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / numPeaks);
  const peaks = new Float32Array(numPeaks);

  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize && start + j < data.length; j++) {
      const abs = Math.abs(data[start + j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  return peaks;
}

// Singleton
export const audioEngine = new AudioEngine();
