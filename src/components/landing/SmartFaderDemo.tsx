import { useState } from "react";

export const SmartFaderDemo = () => {
  const [active, setActive] = useState(false);

  return (
    <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="rounded-xl border border-border/50 bg-card p-8 relative overflow-hidden">
        {/* Glow effect when active */}
        {active && (
          <div className="absolute inset-0 pointer-events-none opacity-20" 
            style={{ background: "radial-gradient(circle at center, hsl(142 70% 50%), transparent 70%)" }} />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Smart Fader</span>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                active ? "bg-primary glow-green" : "bg-secondary"
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-foreground transition-all duration-300 ${
                active ? "left-[30px]" : "left-0.5"
              }`} />
            </button>
          </div>

          {/* Simulated HUD messages */}
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
              active ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 border border-transparent"
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${active ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className={`font-mono text-xs transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`}>
                {active ? "Monitoring beat alignment..." : "AI inactive"}
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 delay-100 ${
              active ? "bg-accent/10 border border-accent/20 opacity-100" : "opacity-40 border border-transparent"
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-accent" : "bg-muted-foreground"}`} />
              <span className={`font-mono text-xs ${active ? "text-neon-amber" : "text-muted-foreground"}`}>
                {active ? "Bass clash detected — reducing low EQ" : "—"}
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 delay-200 ${
              active ? "bg-primary/10 border border-primary/20 opacity-100" : "opacity-40 border border-transparent"
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className={`font-mono text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                {active ? "✓ Timing corrected — mix recovered" : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
