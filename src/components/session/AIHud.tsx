import { useState, useEffect } from "react";
import { Brain, ChevronDown } from "lucide-react";

interface AIHudProps {
  active: boolean;
  mode: "learning" | "assist";
}

interface HudMessage {
  id: number;
  type: "success" | "warning" | "error" | "info";
  text: string;
}

const demoMessages: HudMessage[] = [
  { id: 1, type: "success", text: "Beat alignment: perfect" },
  { id: 2, type: "info", text: "Next phrase in: 4 bars" },
  { id: 3, type: "warning", text: "Bass frequencies overlapping" },
  { id: 4, type: "success", text: "Transition timing: on point" },
  { id: 5, type: "error", text: "Late drop detected — 120ms behind" },
  { id: 6, type: "info", text: "Incoming track phrase aligned" },
  { id: 7, type: "success", text: "EQ balance: clean" },
];

export const AIHud = ({ active, mode }: AIHudProps) => {
  const [messages, setMessages] = useState<HudMessage[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!active) {
      setMessages([]);
      return;
    }

    // Cycle through demo messages
    let idx = 0;
    const interval = setInterval(() => {
      setMessages((prev) => {
        const newMsg = demoMessages[idx % demoMessages.length];
        const updated = [{ ...newMsg, id: Date.now() }, ...prev].slice(0, 4);
        return updated;
      });
      idx++;
    }, 3000);

    // Initial message
    setMessages([{ id: Date.now(), type: "info", text: `Smart Fader active — ${mode} mode` }]);

    return () => clearInterval(interval);
  }, [active, mode]);

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

  return (
    <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-30 w-80">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-t-lg bg-card border border-border/50 border-b-0"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono text-primary tracking-widest uppercase">AI Coach</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        </div>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
      </button>

      {/* Messages */}
      {expanded && (
        <div className="rounded-b-lg bg-card/95 backdrop-blur-sm border border-border/50 border-t-0 p-2 space-y-1.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono animate-fade-up ${typeStyles[msg.type]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[msg.type]}`} />
              {msg.text}
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-[10px] font-mono text-muted-foreground text-center py-2">
              Waiting for input...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
