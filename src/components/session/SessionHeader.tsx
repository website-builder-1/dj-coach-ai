import { useNavigate } from "react-router-dom";
import { Headphones, ArrowLeft, Usb, Ghost, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  ghostMixOn: boolean;
  onGhostMixToggle: () => void;
}

export const SessionHeader = ({
  smartFader, onSmartFaderToggle, mode, onModeChange, mixScore,
  performance, midiConnected, ghostMixOn, onGhostMixToggle
}: SessionHeaderProps) => {
  const navigate = useNavigate();

  const TrendIcon = performance.trend === 'improving' ? TrendingUp : performance.trend === 'dropping' ? TrendingDown : Minus;
  const trendColor = performance.trend === 'improving' ? 'text-neon-green' : performance.trend === 'dropping' ? 'text-neon-red' : 'text-muted-foreground';

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
        {midiConnected && (
          <div className="flex items-center gap-1 text-neon-green">
            <Usb className="w-3 h-3" />
            <span className="text-[9px] font-mono">MIDI</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Score + Trend */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">SCORE</span>
          <span className={`font-mono font-bold text-sm tabular-nums ${
            mixScore >= 80 ? "text-neon-green" : mixScore >= 50 ? "text-neon-amber" : "text-neon-red"
          }`}>{mixScore}</span>
          <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          {performance.streak > 2 && (
            <span className="text-[9px] font-mono text-neon-amber">🔥{performance.streak}</span>
          )}
        </div>

        {/* Ghost Mix Toggle */}
        <button
          onClick={onGhostMixToggle}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
            ghostMixOn ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Ghost className="w-3 h-3" />
          Ghost
        </button>

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
          <span className="text-xs font-mono text-muted-foreground">AI</span>
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

        {/* End Session */}
        <Button variant="deck" size="sm" className="text-[10px]" onClick={() => navigate("/review")}>
          End
        </Button>
      </div>
    </header>
  );
};
