// Web MIDI API integration for DJ Mentor

export interface MIDIMapping {
  channel: number;
  cc: number;
  target: string; // e.g. 'deckA.tempo', 'mixer.crossfader', 'deckB.play'
}

type MIDICallback = (target: string, value: number) => void;
type MIDIActivityCallback = (channel: number, cc: number, value: number) => void;

class MIDIController {
  private access: MIDIAccess | null = null;
  private mappings: MIDIMapping[] = [];
  private callbacks: MIDICallback[] = [];
  private activityCallbacks: MIDIActivityCallback[] = [];
  private learnMode = false;
  private learnTarget: string | null = null;
  private learnResolve: ((mapping: MIDIMapping) => void) | null = null;
  connected = false;
  deviceName = '';

  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return false;
    }
    try {
      this.access = await navigator.requestMIDIAccess();
      this.access.inputs.forEach(input => {
        input.onmidimessage = this.handleMessage.bind(this);
        this.deviceName = input.name || 'MIDI Controller';
        this.connected = true;
      });
      this.access.onstatechange = (e) => {
        const port = (e as any).port;
        if (port.type === 'input') {
          if (port.state === 'connected') {
            port.onmidimessage = this.handleMessage.bind(this);
            this.deviceName = port.name || 'MIDI Controller';
            this.connected = true;
          } else {
            this.connected = false;
            this.deviceName = '';
          }
        }
      };
      return this.connected;
    } catch (err) {
      console.error('MIDI access denied:', err);
      return false;
    }
  }

  private handleMessage(event: MIDIMessageEvent) {
    const [status, cc, value] = event.data;
    const channel = status & 0x0F;
    const type = status & 0xF0;

    // Only handle CC (0xB0) and Note On (0x90)
    if (type !== 0xB0 && type !== 0x90) return;

    // Notify activity listeners
    this.activityCallbacks.forEach(fn => fn(channel, cc, value));

    // Learn mode
    if (this.learnMode && this.learnTarget && this.learnResolve) {
      const mapping: MIDIMapping = { channel, cc, target: this.learnTarget };
      this.mappings.push(mapping);
      this.learnResolve(mapping);
      this.learnMode = false;
      this.learnTarget = null;
      this.learnResolve = null;
      return;
    }

    // Find mapping and trigger callback
    const mapping = this.mappings.find(m => m.channel === channel && m.cc === cc);
    if (mapping) {
      const normalized = value / 127;
      this.callbacks.forEach(fn => fn(mapping.target, normalized));
    }
  }

  startLearn(target: string): Promise<MIDIMapping> {
    return new Promise((resolve) => {
      this.learnMode = true;
      this.learnTarget = target;
      this.learnResolve = resolve;
    });
  }

  cancelLearn() {
    this.learnMode = false;
    this.learnTarget = null;
    this.learnResolve = null;
  }

  removeMapping(target: string) {
    this.mappings = this.mappings.filter(m => m.target !== target);
  }

  getMappings() { return [...this.mappings]; }
  isLearning() { return this.learnMode; }
  getLearningTarget() { return this.learnTarget; }

  onControl(fn: MIDICallback) { this.callbacks.push(fn); }
  offControl(fn: MIDICallback) { this.callbacks = this.callbacks.filter(f => f !== fn); }
  onActivity(fn: MIDIActivityCallback) { this.activityCallbacks.push(fn); }
  offActivity(fn: MIDIActivityCallback) { this.activityCallbacks = this.activityCallbacks.filter(f => f !== fn); }
}

export const midiController = new MIDIController();
