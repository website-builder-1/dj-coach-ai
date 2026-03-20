import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { aiCoach } from "@/lib/aiCoach";

const SessionReview = () => {
  const navigate = useNavigate();
  const performance = aiCoach.getPerformanceData();
  const mistakes = aiCoach.getMistakes();
  const feedbackLog = aiCoach.getFeedbackLog();

  const successCount = feedbackLog.filter(f => f.type === 'success').length;
  const warningCount = feedbackLog.filter(f => f.type === 'warning').length;
  const errorCount = feedbackLog.filter(f => f.type === 'error').length;

  // Score chart (simplified as bars)
  const historySlice = performance.history.slice(-30);
  const maxScore = Math.max(...historySlice, 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border/50 bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate("/session")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Headphones className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Session Review</span>
        </div>
        <Button variant="hero" size="sm" onClick={() => navigate("/session")}>
          New Session
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Score Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-6 border border-border/30 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Final Score</p>
            <p className={`text-4xl font-bold font-mono tabular-nums ${
              performance.score >= 80 ? 'text-neon-green' : performance.score >= 50 ? 'text-neon-amber' : 'text-neon-red'
            }`}>{performance.score}</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border/30 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Best Streak</p>
            <p className="text-4xl font-bold font-mono tabular-nums text-neon-amber">{performance.bestStreak}</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border/30 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Good Moves</p>
            <p className="text-4xl font-bold font-mono tabular-nums text-neon-green">{successCount}</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border/30 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Mistakes</p>
            <p className="text-4xl font-bold font-mono tabular-nums text-neon-red">{errorCount + warningCount}</p>
          </div>
        </div>

        {/* Score History Chart */}
        <div className="bg-card rounded-lg p-6 border border-border/30">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Score Over Time
          </h3>
          <div className="flex items-end gap-0.5 h-32">
            {historySlice.map((score, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all ${
                  score >= 80 ? 'bg-primary/60' : score >= 50 ? 'bg-accent/60' : 'bg-destructive/60'
                }`}
                style={{ height: `${(score / maxScore) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono text-muted-foreground">Start</span>
            <span className="text-[9px] font-mono text-muted-foreground">End</span>
          </div>
        </div>

        {/* Repeated Mistakes */}
        {mistakes.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-border/30">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Mistake Patterns
            </h3>
            <div className="space-y-3">
              {mistakes.map((m) => (
                <div key={m.type} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div>
                    <p className="text-xs text-foreground font-medium">{m.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      Occurred {m.count} time{m.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neon-red">{m.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Timeline */}
        <div className="bg-card rounded-lg p-6 border border-border/30">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Session Timeline
          </h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {feedbackLog.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">No feedback recorded — start a session first</p>
            ) : (
              feedbackLog.slice().reverse().map((fb) => {
                const color = fb.type === 'success' ? 'text-neon-green' : fb.type === 'error' ? 'text-neon-red' : fb.type === 'warning' ? 'text-neon-amber' : 'text-muted-foreground';
                const dot = fb.type === 'success' ? 'bg-primary' : fb.type === 'error' ? 'bg-destructive' : fb.type === 'warning' ? 'bg-accent' : 'bg-muted-foreground';
                return (
                  <div key={fb.id} className="flex items-center gap-3 text-xs font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className={color}>{fb.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-card rounded-lg p-6 border border-primary/20">
          <h3 className="text-sm font-medium text-primary mb-3">AI Coach Summary</h3>
          <div className="space-y-2 text-xs text-muted-foreground font-mono">
            {performance.score >= 70 ? (
              <>
                <p>✓ Solid session overall. Your score of {performance.score} shows good technique.</p>
                {performance.bestStreak > 3 && <p>✓ Impressive streak of {performance.bestStreak} — keep building consistency.</p>}
                {mistakes.length > 0 && <p>⚠ Focus on: {mistakes[0]?.description.toLowerCase()}</p>}
              </>
            ) : (
              <>
                <p>Keep practicing! Your score of {performance.score} has room for improvement.</p>
                {mistakes.length > 0 && <p>⚠ Most common issue: {mistakes[0]?.description}</p>}
                <p>💡 Try using Learning mode to get suggestions before mixing.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionReview;
