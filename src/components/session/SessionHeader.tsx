import { useNavigate } from "react-router-dom";
import { Headphones, ArrowLeft, Usb, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceData } from "@/lib/aiCoach";

interface SessionHeaderProps {
  smartFader: boolean;
  onSmartFaderToggle: () => void;
  mode: "learning" | "assist";
  onModeChange: (mode: "learning" | "assist") => void;
  mixScore: number;
  performance: PerformanceData;
  midiConnected: boolean;
}

export const SessionHeader = ({
  smartFader, onSmartFaderToggle, mode, onModeChange, mixScore,
  performance, midiConnected
}: SessionHeaderProps) => {
  const navigate = useNavigate();

  const TrendIcon = performance.trend === 'improving' ? TrendingUp : performance.trend === 'dropping' ? TrendingDown : Minus;
  const trendColor = performance.trend === 'improving' ? 'text-neon-green' : performance.trend === 'dropping' ? 'text-neon-red' : 'text-muted-foreground';

  return (
    <header className="h-10 border-b border-border/30 bg-card flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => navigate("/")}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-xs text-foreground">DJ Mentor</span>
        </div>
        {midiConnected && (
          <div className="flex items-center gap-1 text-neon-green ml-1">
            <Usb className="w-3 h-3" />
            <span className="text-[8px] font-mono">MIDI</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Score */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground">SCORE</span>
          <span className={`font-mono font-bold text-xs tabular-nums ${
            mixScore >= 80 ? 'text-neon-green' : mixScore >= 50 ? 'text-neon-amber' : 'text-neon-red'
          }`}>{mixScore}</span>
          <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          {performance.streak > 2 && (
            <span className="text-[8px] font-mono text-neon-amber">🔥{performance.streak}</span>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-secondary rounded p-0.5">
          <button
            onClick={() => onModeChange("learning")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200 ${
              mode === "learning" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Learn
          </button>
          <button
            onClick={() => onModeChange("assist")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200 ${
              mode === "assist" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Assist
          </button>
        </div>

        {/* AI toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground">AI</span>
          <button
            onClick={onSmartFaderToggle}
            className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
              smartFader ? 'bg-primary glow-green' : 'bg-secondary'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
              smartFader ? 'left-[18px] bg-primary-foreground' : 'left-0.5 bg-muted-foreground'
            }`} />
          </button>
        </div>

        <Button variant="deck" size="sm" className="h-6 text-[9px]" onClick={() => navigate("/review")}>
          End
        </Button>
      </div>
    </header>
  );
};
