import { useState } from "react";
import { Wand2, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitionSuggestion } from "@/lib/aiCoach";

interface AutoTransitionProps {
  suggestion: TransitionSuggestion | null;
  onExecute: () => void;
}

export const AutoTransition = ({ suggestion, onExecute }: AutoTransitionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!suggestion) return null;

  return (
    <div className="fixed bottom-52 right-4 z-20 w-64">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-t-lg bg-card border border-border/50 border-b-0 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-mono text-accent tracking-widest uppercase">Auto Transition</span>
        </div>
        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="rounded-b-lg bg-card/95 backdrop-blur-sm border border-border/50 border-t-0 p-3 space-y-2">
          <p className="text-xs text-foreground font-medium">{suggestion.description}</p>
          <div className="space-y-1">
            {suggestion.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] font-mono text-muted-foreground">
              Confidence: {suggestion.confidence}%
            </span>
            <Button variant="default" size="sm" className="h-6 text-[9px] gap-1" onClick={onExecute}>
              <Play className="w-3 h-3" />
              Execute
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
