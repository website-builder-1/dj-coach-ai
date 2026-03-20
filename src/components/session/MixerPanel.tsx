import { useState, useRef, useCallback } from "react";

interface MixerPanelProps {
  crossfader: number;
  onCrossfaderChange: (val: number) => void;
  volumeA: number;
  volumeB: number;
  onVolumeChange: (deck: 'A' | 'B', val: number) => void;
  levelA: number;
  levelB: number;
  eqA: { hi: number; mid: number; lo: number; gain: number };
  eqB: { hi: number; mid: number; lo: number; gain: number };
  onEQChange: (deck: 'A' | 'B', band: 'hi' | 'mid' | 'lo' | 'gain', value: number) => void;
  cfxA: number;
  cfxB: number;
  onCFXChange: (deck: 'A' | 'B', value: number) => void;
  headphoneCueA: boolean;
  headphoneCueB: boolean;
  headphoneCueMaster: boolean;
  onHeadphoneCue: (target: 'A' | 'B' | 'master') => void;
  smartFader: boolean;
  onSmartFaderToggle: () => void;
}

const RotaryKnob = ({
  label, value, onChange, accentClass = 'bg-primary'
}: {
  label: string; value: number; onChange: (v: number) => void; accentClass?: string;
}) => {
  const rotation = (value / 100) * 270 - 135;
  const knobRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const onDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = (startY.current - ev.clientY) * 0.5;
      onChange(Math.max(0, Math.min(100, startVal.current + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [value, onChange]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        ref={knobRef}
        className="dj-knob w-8 h-8"
        onMouseDown={onDown}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -2 : 2;
          onChange(Math.max(0, Math.min(100, value + delta)));
        }}
      >
        <div
          className={`absolute w-0.5 h-2.5 ${accentClass} rounded-full top-0.5 left-1/2 -translate-x-1/2 origin-[center_14px]`}
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
};

const VUMeter = ({ level }: { level: number }) => {
  const segments = 16;
  return (
    <div className="flex flex-col-reverse gap-px w-3">
      {Array.from({ length: segments }).map((_, i) => {
        const active = i < Math.floor((level / 100) * segments);
        const isRed = i >= 13;
        const isYellow = i >= 10 && i < 13;
        return (
          <div
            key={i}
            className={`w-full h-1 rounded-[1px] transition-colors duration-75 ${
              active
                ? isRed ? 'bg-destructive' : isYellow ? 'bg-accent' : 'bg-primary'
                : 'bg-secondary/50'
            }`}
          />
        );
      })}
    </div>
  );
};

const VerticalFader = ({
  value, onChange, height = 120
}: {
  value: number; onChange: (v: number) => void; height?: number;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getValueFromY = useCallback((clientY: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(100, (1 - y / rect.height) * 100));
  }, [value]);

  const onDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    onChange(getValueFromY(e.clientY));
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onChange(getValueFromY(ev.clientY));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onChange, getValueFromY]);

  const thumbY = (1 - value / 100) * (height - 16);

  return (
    <div
      ref={trackRef}
      className="w-5 relative cursor-pointer rounded-sm"
      style={{ height }}
      onMouseDown={onDown}
    >
      {/* Track */}
      <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full rounded-full bg-dj-surface border border-border/30" />
      {/* Fill */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded-full bg-primary/40 bottom-0"
        style={{ height: `${value}%` }}
      />
      {/* Thumb */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-5 h-4 rounded-sm cursor-grab active:cursor-grabbing"
        style={{
          top: thumbY,
          background: 'linear-gradient(180deg, hsl(220 12% 30%), hsl(220 12% 18%))',
          border: '1px solid hsl(220 12% 35%)',
        }}
      />
    </div>
  );
};

export const MixerPanel = ({
  crossfader, onCrossfaderChange,
  volumeA, volumeB, onVolumeChange,
  levelA, levelB,
  eqA, eqB, onEQChange,
  cfxA, cfxB, onCFXChange,
  headphoneCueA, headphoneCueB, headphoneCueMaster,
  onHeadphoneCue,
  smartFader, onSmartFaderToggle,
}: MixerPanelProps) => {
  return (
    <div className="bg-card w-52 border-x border-border/20 flex flex-col items-center py-3 px-2 gap-2">
      {/* EQ Section */}
      <div className="w-full grid grid-cols-2 gap-3 px-1">
        {/* Channel A EQ */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[8px] font-mono text-neon-cyan tracking-widest mb-0.5">EQ</span>
          <RotaryKnob label="HI" value={eqA.hi} onChange={(v) => onEQChange('A', 'hi', v)} />
          <RotaryKnob label="MID" value={eqA.mid} onChange={(v) => onEQChange('A', 'mid', v)} />
          <RotaryKnob label="LOW" value={eqA.lo} onChange={(v) => onEQChange('A', 'lo', v)} />
        </div>
        {/* Channel B EQ */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[8px] font-mono text-foreground/50 tracking-widest mb-0.5">EQ</span>
          <RotaryKnob label="HI" value={eqB.hi} onChange={(v) => onEQChange('B', 'hi', v)} />
          <RotaryKnob label="MID" value={eqB.mid} onChange={(v) => onEQChange('B', 'mid', v)} />
          <RotaryKnob label="LOW" value={eqB.lo} onChange={(v) => onEQChange('B', 'lo', v)} />
        </div>
      </div>

      {/* MASTER + SMART CFX */}
      <div className="flex items-center gap-1.5 w-full px-1">
        <button className="flex-1 py-1 text-[8px] font-mono font-medium tracking-wider rounded border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors bg-dj-surface">
          MASTER
        </button>
        <button className="flex-1 py-1 text-[8px] font-mono font-medium tracking-wider rounded border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors bg-dj-surface">
          SMART CFX
        </button>
      </div>

      {/* Headphone Cue */}
      <div className="flex items-center gap-1 w-full px-1">
        <span className="text-[7px] font-mono text-muted-foreground/60 tracking-widest">PHONES</span>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onHeadphoneCue('A')}
            className={`w-6 h-5 rounded text-[8px] font-mono font-bold border transition-colors ${
              headphoneCueA ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-dj-surface border-border/30 text-muted-foreground'
            }`}
          >
            1
          </button>
          <button
            onClick={() => onHeadphoneCue('B')}
            className={`w-6 h-5 rounded text-[8px] font-mono font-bold border transition-colors ${
              headphoneCueB ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-dj-surface border-border/30 text-muted-foreground'
            }`}
          >
            2
          </button>
        </div>
      </div>

      {/* CFX Knobs */}
      <div className="grid grid-cols-2 gap-3 w-full px-1">
        <RotaryKnob label="CFX" value={cfxA} onChange={(v) => onCFXChange('A', v)} accentClass="bg-accent" />
        <RotaryKnob label="CFX" value={cfxB} onChange={(v) => onCFXChange('B', v)} accentClass="bg-accent" />
      </div>

      {/* Channel Faders + VU Meters */}
      <div className="flex items-end justify-center gap-2 flex-1">
        <VUMeter level={levelA} />
        <VerticalFader value={volumeA} onChange={(v) => onVolumeChange('A', v)} height={100} />
        <div className="w-px h-full bg-border/20" />
        <VerticalFader value={volumeB} onChange={(v) => onVolumeChange('B', v)} height={100} />
        <VUMeter level={levelB} />
      </div>

      {/* Smart Fader button */}
      <button
        onClick={onSmartFaderToggle}
        className={`w-full py-1.5 rounded text-[9px] font-mono font-bold tracking-wider border transition-all ${
          smartFader
            ? 'bg-primary/15 border-primary/40 text-primary glow-green'
            : 'bg-dj-surface border-border/30 text-muted-foreground hover:text-foreground'
        }`}
      >
        SMART FADER
      </button>

      {/* Crossfader */}
      <div className="w-full px-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-mono text-muted-foreground">A</span>
          <span className="text-[8px] font-mono text-muted-foreground">B</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={crossfader}
          onChange={(e) => onCrossfaderChange(Number(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
};
