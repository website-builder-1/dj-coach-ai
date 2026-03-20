import { useNavigate } from "react-router-dom";
import { Headphones, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionHeaderProps {
  smartFader: boolean;
  onSmartFaderToggle: () => void;
  mode: "learning" | "assist";
  onModeChange: (mode: "learning" | "assist") => void;
  mixScore: number;
}

export const SessionHeader = ({ smartFader, onSmartFaderToggle, mode, onModeChange, mixScore }: SessionHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="h-12 border-b border-border/50 bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">DJ Mentor</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Mix Score */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">SCORE</span>
          <span className={`font-mono font-bold text-sm tabular-nums ${
            mixScore >= 80 ? "text-neon-green" : mixScore >= 50 ? "text-neon-amber" : "text-neon-red"
          }`}>{mixScore}</span>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
          <button
            onClick={() => onModeChange("learning")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
              mode === "learning" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Learn
          </button>
          <button
            onClick={() => onModeChange("assist")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
              mode === "assist" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Assist
          </button>
        </div>

        {/* Smart Fader toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">SMART FADER</span>
          <button
            onClick={onSmartFaderToggle}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              smartFader ? "bg-primary glow-green" : "bg-secondary"
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
              smartFader ? "left-[22px] bg-primary-foreground" : "left-0.5 bg-muted-foreground"
            }`} />
          </button>
        </div>
      </div>
    </header>
  );
};
