import { useState } from "react";

interface MixerPanelProps {
  crossfader: number;
  onCrossfaderChange: (val: number) => void;
}

interface EQState {
  hi: number;
  mid: number;
  lo: number;
  gain: number;
}

const EQKnob = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => {
  const rotation = (value / 100) * 270 - 135;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="dj-knob"
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -2 : 2;
          onChange(Math.max(0, Math.min(100, value + delta)));
        }}
      >
        {/* Indicator line */}
        <div
          className="absolute w-0.5 h-3 bg-primary rounded-full top-1 left-1/2 -translate-x-1/2 origin-[center_18px]"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
};

const VUMeter = ({ level }: { level: number }) => {
  const segments = 12;
  return (
    <div className="flex flex-col-reverse gap-0.5">
      {Array.from({ length: segments }).map((_, i) => {
        const active = i < Math.floor((level / 100) * segments);
        const isRed = i >= 10;
        const isYellow = i >= 7 && i < 10;
        return (
          <div
            key={i}
            className={`w-2 h-1.5 rounded-[1px] transition-colors duration-100 ${
              active
                ? isRed ? "bg-destructive" : isYellow ? "bg-accent" : "bg-primary"
                : "bg-secondary"
            }`}
          />
        );
      })}
    </div>
  );
};

export const MixerPanel = ({ crossfader, onCrossfaderChange }: MixerPanelProps) => {
  const [eqA, setEqA] = useState<EQState>({ hi: 50, mid: 50, lo: 50, gain: 70 });
  const [eqB, setEqB] = useState<EQState>({ hi: 50, mid: 50, lo: 50, gain: 70 });

  return (
    <div className="bg-card w-56 border-x border-border/30 flex flex-col items-center py-4 px-3 gap-4">
      {/* Channel labels */}
      <div className="w-full flex justify-between px-2">
        <span className="text-[9px] font-mono text-neon-cyan tracking-widest">CH A</span>
        <span className="text-[9px] font-mono text-foreground tracking-widest opacity-60">CH B</span>
      </div>

      {/* EQ Section */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Channel A EQ */}
        <div className="flex flex-col items-center gap-3">
          <EQKnob label="Gain" value={eqA.gain} onChange={(v) => setEqA({ ...eqA, gain: v })} />
          <EQKnob label="Hi" value={eqA.hi} onChange={(v) => setEqA({ ...eqA, hi: v })} />
          <EQKnob label="Mid" value={eqA.mid} onChange={(v) => setEqA({ ...eqA, mid: v })} />
          <EQKnob label="Lo" value={eqA.lo} onChange={(v) => setEqA({ ...eqA, lo: v })} />
        </div>
        {/* Channel B EQ */}
        <div className="flex flex-col items-center gap-3">
          <EQKnob label="Gain" value={eqB.gain} onChange={(v) => setEqB({ ...eqB, gain: v })} />
          <EQKnob label="Hi" value={eqB.hi} onChange={(v) => setEqB({ ...eqB, hi: v })} />
          <EQKnob label="Mid" value={eqB.mid} onChange={(v) => setEqB({ ...eqB, mid: v })} />
          <EQKnob label="Lo" value={eqB.lo} onChange={(v) => setEqB({ ...eqB, lo: v })} />
        </div>
      </div>

      {/* VU Meters */}
      <div className="flex items-end gap-4 py-2">
        <VUMeter level={65} />
        <VUMeter level={72} />
      </div>

      {/* Crossfader */}
      <div className="w-full mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono text-muted-foreground">A</span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Crossfader</span>
          <span className="text-[9px] font-mono text-muted-foreground">B</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={crossfader}
          onChange={(e) => onCrossfaderChange(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
};
