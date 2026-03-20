// AlphaTheta DDJ-FLX2 hardcoded MIDI mapping
// Based on official MIDI Message List (DDJ-FLX2_MIDI_Message_List_E1.pdf)
//
// MIDI Channels (0-indexed for Web MIDI):
//   Ch 0 = Deck 1, Ch 1 = Deck 2, Ch 6 = Global/Mixer
//   Ch 7-10 = Performance Pads (Deck 1/2, with/without Shift)

export interface FLX2Control {
  type: 'cc' | 'note' | 'cc14';  // cc14 = 14-bit CC (MSB+LSB pair)
  channel: number;     // 0-indexed MIDI channel
  number: number;      // CC or Note number (for cc14, this is the MSB CC)
  lsb?: number;        // LSB CC number for 14-bit controls
  target: string;      // App control target
  invert?: boolean;    // Invert the value
  relative?: boolean;  // Relative encoder (0x40 = center)
}

// Deck controls — parameterized by channel (0 = Deck 1, 1 = Deck 2)
function deckControls(ch: number): FLX2Control[] {
  const deck = ch === 0 ? 'deckA' : 'deckB';
  return [
    // Transport
    { type: 'note', channel: ch, number: 0x0B, target: `${deck}.play` },       // PLAY/PAUSE
    { type: 'note', channel: ch, number: 0x0C, target: `${deck}.cue` },        // CUE
    { type: 'note', channel: ch, number: 0x58, target: `${deck}.sync` },       // BEAT SYNC
    { type: 'note', channel: ch, number: 0x3F, target: `${deck}.shift` },      // SHIFT

    // Tempo fader (14-bit: CC0 MSB + CC32 LSB)
    { type: 'cc14', channel: ch, number: 0x00, lsb: 0x20, target: `${deck}.tempo` },

    // Jog wheel — platter top (vinyl mode)
    { type: 'cc', channel: ch, number: 0x22, target: `${deck}.jog_platter`, relative: true },
    // Jog wheel — outer ring
    { type: 'cc', channel: ch, number: 0x21, target: `${deck}.jog_ring`, relative: true },
    // Jog touch (note on = touching, note off = released)
    { type: 'note', channel: ch, number: 0x36, target: `${deck}.jog_touch` },

    // EQ (14-bit but we use MSB only for responsiveness)
    { type: 'cc', channel: ch, number: 0x07, target: `${deck}.eq_hi` },        // EQ HI
    { type: 'cc', channel: ch, number: 0x0B, target: `${deck}.eq_mid` },       // EQ MID
    { type: 'cc', channel: ch, number: 0x0F, target: `${deck}.eq_lo` },        // EQ LOW

    // Channel fader (14-bit: CC17 MSB + CC49 LSB)
    { type: 'cc14', channel: ch, number: 0x11, lsb: 0x31, target: `${deck}.volume` },

    // Headphone cue
    { type: 'note', channel: ch, number: 0x54, target: `${deck}.headphone_cue` },
  ];
}

// Mixer/Global controls (channel 6)
const mixerControls: FLX2Control[] = [
  // Crossfader (14-bit: CC31 MSB + CC63 LSB) — or CC33 based on PDF
  { type: 'cc14', channel: 6, number: 0x1F, lsb: 0x3F, target: 'mixer.crossfader' },

  // Master level
  { type: 'cc14', channel: 6, number: 0x28, lsb: 0x60, target: 'mixer.master_level' },

  // Headphones level
  { type: 'cc14', channel: 6, number: 0x2D, lsb: 0x65, target: 'mixer.headphone_level' },

  // Color FX (per channel)
  { type: 'cc14', channel: 6, number: 0x17, lsb: 0x37, target: 'mixer.cfx_ch1' },
  { type: 'cc14', channel: 6, number: 0x18, lsb: 0x38, target: 'mixer.cfx_ch2' },

  // Smart Fader button — channel 6, Note 9
  { type: 'note', channel: 6, number: 0x09, target: 'mixer.smart_fader' },

  // Headphone cue master
  { type: 'note', channel: 6, number: 0x63, target: 'mixer.headphone_cue_master' },
];

// Performance pads (channels 7-10)
function padControls(): FLX2Control[] {
  const pads: FLX2Control[] = [];
  // Deck 1 pads: ch 7 (no shift), ch 8 (shift)
  // Deck 2 pads: ch 9 (no shift), ch 10 (shift)
  for (let padIdx = 0; padIdx < 8; padIdx++) {
    // Pad mode 1 note numbers: 0-7
    pads.push(
      { type: 'note', channel: 7, number: padIdx, target: `deckA.pad${padIdx + 1}` },
      { type: 'note', channel: 9, number: padIdx, target: `deckB.pad${padIdx + 1}` },
      // Shifted pads
      { type: 'note', channel: 8, number: padIdx, target: `deckA.pad${padIdx + 1}_shift` },
      { type: 'note', channel: 10, number: padIdx, target: `deckB.pad${padIdx + 1}_shift` },
    );
  }
  return pads;
}

// Full DDJ-FLX2 mapping
export const DDJ_FLX2_MAPPING: FLX2Control[] = [
  ...deckControls(0),
  ...deckControls(1),
  ...mixerControls,
  ...padControls(),
];

// Device name patterns to auto-detect
export const DDJ_FLX2_DEVICE_NAMES = [
  'DDJ-FLX2',
  'DDJ-FLX2 (DDJ-FLX2)',
  'AlphaTheta DDJ-FLX2',
  'Pioneer DDJ-FLX2',
];

export function isDDJFLX2(deviceName: string): boolean {
  const upper = deviceName.toUpperCase();
  return upper.includes('DDJ-FLX2') || upper.includes('DDJ FLX2');
}
