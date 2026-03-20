// Web MIDI API integration for DJ Mentor
// Supports auto-detection of AlphaTheta DDJ-FLX2 with hardcoded mappings

import { DDJ_FLX2_MAPPING, FLX2Control, isDDJFLX2 } from './ddjFlx2Mapping';

export interface MIDIMapping {
  channel: number;
  cc: number;
  target: string;
}

type MIDICallback = (target: string, value: number) => void;
type MIDIActivityCallback = (channel: number, cc: number, value: number) => void;
type ConnectionCallback = (connected: boolean, deviceName: string) => void;

class MIDIController {
  private access: MIDIAccess | null = null;
  private manualMappings: MIDIMapping[] = [];
  private callbacks: MIDICallback[] = [];
  private activityCallbacks: MIDIActivityCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private learnMode = false;
  private learnTarget: string | null = null;
  private learnResolve: ((mapping: MIDIMapping) => void) | null = null;

  // 14-bit CC state: key = `${channel}-${msbCC}`, value = last MSB
  private cc14State = new Map<string, number>();

  // Jog touch state per deck
  private jogTouching = new Set<string>();

  // Shift state per channel
  private shiftState = new Map<number, boolean>();

  connected = false;
  deviceName = '';
  isHardwareMapped = false; // true when DDJ-FLX2 auto-detected

  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return false;
    }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.access.inputs.forEach(input => {
        this.connectInput(input);
      });
      this.access.onstatechange = (e) => {
        const port = (e as any).port;
        if (port.type === 'input') {
          if (port.state === 'connected') {
            this.connectInput(port);
          } else if (port.state === 'disconnected') {
            this.connected = false;
            this.deviceName = '';
            this.isHardwareMapped = false;
            this.connectionCallbacks.forEach(fn => fn(false, ''));
          }
        }
      };
      return this.connected;
    } catch (err) {
      console.error('MIDI access denied:', err);
      return false;
    }
  }

  private connectInput(input: MIDIInput) {
    input.onmidimessage = this.handleMessage.bind(this);
    this.deviceName = input.name || 'MIDI Controller';
    this.connected = true;

    // Auto-detect DDJ-FLX2
    if (isDDJFLX2(this.deviceName)) {
      this.isHardwareMapped = true;
      console.log(`[MIDI] DDJ-FLX2 detected: "${this.deviceName}" — applying built-in mapping`);
    } else {
      console.log(`[MIDI] Generic controller: "${this.deviceName}" — use learn mode to map`);
    }

    this.connectionCallbacks.forEach(fn => fn(true, this.deviceName));
  }

  private handleMessage(event: MIDIMessageEvent) {
    if (!event.data || event.data.length < 2) return;

    const [status, data1, data2 = 0] = event.data;
    const channel = status & 0x0F;
    const type = status & 0xF0;

    // Only handle CC (0xB0) and Note On/Off (0x90, 0x80)
    if (type !== 0xB0 && type !== 0x90 && type !== 0x80) return;

    // Notify activity listeners
    this.activityCallbacks.forEach(fn => fn(channel, data1, data2));

    // Learn mode — capture any input
    if (this.learnMode && this.learnTarget && this.learnResolve && type !== 0x80) {
      const mapping: MIDIMapping = { channel, cc: data1, target: this.learnTarget };
      this.manualMappings.push(mapping);
      this.learnResolve(mapping);
      this.learnMode = false;
      this.learnTarget = null;
      this.learnResolve = null;
      return;
    }

    // DDJ-FLX2 hardware mapping
    if (this.isHardwareMapped) {
      this.handleFLX2Message(channel, type, data1, data2);
      return;
    }

    // Manual/generic mapping fallback
    if (type === 0xB0) {
      const mapping = this.manualMappings.find(m => m.channel === channel && m.cc === data1);
      if (mapping) {
        this.callbacks.forEach(fn => fn(mapping.target, data2 / 127));
      }
    } else if (type === 0x90) {
      const mapping = this.manualMappings.find(m => m.channel === channel && m.cc === data1);
      if (mapping) {
        this.callbacks.forEach(fn => fn(mapping.target, data2 / 127));
      }
    }
  }

  private handleFLX2Message(channel: number, type: number, data1: number, data2: number) {
    // Track shift state
    if (type === 0x90 && data1 === 0x3F && (channel === 0 || channel === 1)) {
      this.shiftState.set(channel, data2 > 0);
      return;
    }
    if (type === 0x80 && data1 === 0x3F && (channel === 0 || channel === 1)) {
      this.shiftState.set(channel, false);
      return;
    }

    if (type === 0xB0) {
      // CC message — find matching control
      this.handleFLX2CC(channel, data1, data2);
    } else if (type === 0x90 || type === 0x80) {
      // Note message
      const velocity = type === 0x80 ? 0 : data2;
      this.handleFLX2Note(channel, data1, velocity);
    }
  }

  private handleFLX2CC(channel: number, cc: number, value: number) {
    // Check for 14-bit CC (LSB part)
    for (const ctrl of DDJ_FLX2_MAPPING) {
      if (ctrl.type === 'cc14' && ctrl.channel === channel && ctrl.lsb === cc) {
        // This is an LSB message — combine with stored MSB
        const msbKey = `${channel}-${ctrl.number}`;
        const msb = this.cc14State.get(msbKey) ?? 0;
        const combined = ((msb << 7) | value) / 16383;
        this.dispatch(ctrl.target, ctrl.invert ? 1 - combined : combined);
        return;
      }
    }

    // Check for MSB or regular CC
    for (const ctrl of DDJ_FLX2_MAPPING) {
      if (ctrl.channel !== channel) continue;

      if (ctrl.type === 'cc14' && ctrl.number === cc) {
        // Store MSB for 14-bit
        this.cc14State.set(`${channel}-${cc}`, value);
        // Also dispatch with MSB-only resolution for immediate response
        const combined = value / 127;
        this.dispatch(ctrl.target, ctrl.invert ? 1 - combined : combined);
        return;
      }

      if (ctrl.type === 'cc' && ctrl.number === cc) {
        if (ctrl.relative) {
          // Relative encoder: values 0x01-0x3F = clockwise, 0x41-0x7F = counter-clockwise
          // 0x40 = center/no movement
          let delta: number;
          if (value <= 0x3F) {
            delta = value;        // clockwise
          } else {
            delta = value - 128;  // counter-clockwise (negative)
          }
          this.dispatch(ctrl.target, delta);
        } else {
          const normalized = value / 127;
          this.dispatch(ctrl.target, ctrl.invert ? 1 - normalized : normalized);
        }
        return;
      }
    }
  }

  private handleFLX2Note(channel: number, note: number, velocity: number) {
    for (const ctrl of DDJ_FLX2_MAPPING) {
      if (ctrl.type === 'note' && ctrl.channel === channel && ctrl.number === note) {
        this.dispatch(ctrl.target, velocity / 127);
        return;
      }
    }
  }

  private dispatch(target: string, value: number) {
    this.callbacks.forEach(fn => fn(target, value));
  }

  // Jog touch tracking (used by audio engine hook)
  setJogTouching(deck: string, touching: boolean) {
    if (touching) this.jogTouching.add(deck);
    else this.jogTouching.delete(deck);
  }

  isJogTouching(deck: string): boolean {
    return this.jogTouching.has(deck);
  }

  isShiftHeld(channel: number): boolean {
    return this.shiftState.get(channel) ?? false;
  }

  // Learn mode
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
    this.manualMappings = this.manualMappings.filter(m => m.target !== target);
  }

  getMappings() { return [...this.manualMappings]; }
  isLearning() { return this.learnMode; }
  getLearningTarget() { return this.learnTarget; }

  onControl(fn: MIDICallback) { this.callbacks.push(fn); }
  offControl(fn: MIDICallback) { this.callbacks = this.callbacks.filter(f => f !== fn); }
  onActivity(fn: MIDIActivityCallback) { this.activityCallbacks.push(fn); }
  offActivity(fn: MIDIActivityCallback) { this.activityCallbacks = this.activityCallbacks.filter(f => f !== fn); }
  onConnection(fn: ConnectionCallback) { this.connectionCallbacks.push(fn); }
  offConnection(fn: ConnectionCallback) { this.connectionCallbacks = this.connectionCallbacks.filter(f => f !== fn); }
}

export const midiController = new MIDIController();
