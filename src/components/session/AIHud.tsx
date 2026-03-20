import { useState } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { Feedback } from "@/lib/aiCoach";

interface AIHudProps {
  active: boolean;
  mode: "learning" | "assist";
  feedbacks: Feedback[];
}

export const AIHud = ({ active, mode, feedbacks }: AIHudProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!active) return null;

  const typeStyles = {
    success: "border-primary/30 bg-primary/5 text-neon-green",
    warning: "border-accent/30 bg-accent/5 text-neon-amber",
    error: "border-destructive/30 bg-destructive/5 text-neon-red",
    info: "border-border bg-card text-muted-foreground",
  };

  const dotStyles = {
    success: "bg-primary",
    warning: "bg-accent",
    error: "bg-destructive",
    info: "bg-muted-foreground",
  };

  const displayFeedbacks = feedbacks.length > 0
    ? feedbacks.slice(0, 4)
    : [{ id: 'init', type: 'info' as const, text: `Smart Fader active — ${mode} mode`, timestamp: Date.now(), category: 'system' }];

  return (
    <div className="fixed bottom-52 left-1/2 -translate-x-1/2 z-30 w-80">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-t-lg bg-card border border-border/50 border-b-0"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono text-primary tracking-widest uppercase">
            AI Coach — {mode}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        </div>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
      </button>

      {expanded && (
        <div className="rounded-b-lg bg-card/95 backdrop-blur-sm border border-border/50 border-t-0 p-2 space-y-1.5 max-h-48 overflow-auto">
          {displayFeedbacks.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono animate-fade-up ${typeStyles[msg.type]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[msg.type]}`} />
              {msg.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
