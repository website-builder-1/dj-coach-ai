interface GhostMixProps {
  data: { idealCrossfader: number[]; idealEqA: number[]; idealEqB: number[] } | null;
  crossfader: number;
}

export const GhostMix = ({ data, crossfader }: GhostMixProps) => {
  if (!data) return null;

  const points = data.idealCrossfader.length;
  const w = 100;

  // Generate SVG path
  const cfPath = data.idealCrossfader
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / points) * w} ${100 - v}`)
    .join(' ');

  return (
    <div className="h-12 bg-dj-surface/50 border-y border-border/20 px-4 flex items-center gap-3 shrink-0">
      <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest w-20">Ghost Mix</span>
      <div className="flex-1 h-8 relative">
        <svg viewBox={`0 0 ${w} 100`} className="w-full h-full" preserveAspectRatio="none">
          {/* Ideal crossfader path */}
          <path d={cfPath} fill="none" stroke="hsl(142 70% 50%)" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />
          {/* Current position */}
          <circle cx={(crossfader / 100) * w} cy={100 - crossfader} r="3" fill="hsl(0 0% 100%)" opacity="0.8" />
        </svg>
      </div>
      <span className="text-[9px] font-mono text-muted-foreground">
        Ideal crossfader curve
      </span>
    </div>
  );
};
