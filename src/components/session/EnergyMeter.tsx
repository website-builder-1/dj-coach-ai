interface EnergyMeterProps {
  energy: number;
  score: number;
}

export const EnergyMeter = ({ energy, score }: EnergyMeterProps) => {
  const segments = 20;
  const activeSegs = Math.floor((energy / 100) * segments);

  return (
    <div className="h-6 bg-dj-surface border-y border-border/30 flex items-center px-4 gap-3 shrink-0">
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest w-16">Energy</span>
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-3 flex-1 rounded-[1px] transition-all duration-150 ${
              i < activeSegs
                ? i > segments * 0.8
                  ? "bg-destructive"
                  : i > segments * 0.6
                  ? "bg-accent"
                  : "bg-primary"
                : "bg-secondary/50"
            }`}
            style={{ opacity: i < activeSegs ? 0.5 + (i / segments) * 0.5 : 0.3 }}
          />
        ))}
      </div>
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest w-16">Crowd</span>
      <div className={`text-xs font-mono font-bold tabular-nums ${
        energy > 70 ? 'text-neon-green' : energy > 40 ? 'text-neon-amber' : 'text-neon-red'
      }`}>
        {Math.round(energy)}%
      </div>
    </div>
  );
};
