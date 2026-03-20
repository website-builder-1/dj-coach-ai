import { useEffect, useState } from "react";
import { Feedback } from "@/lib/aiCoach";

interface FeedbackNotificationProps {
  feedbacks: Feedback[];
}

export const FeedbackNotification = ({ feedbacks }: FeedbackNotificationProps) => {
  const [visible, setVisible] = useState<Feedback[]>([]);

  useEffect(() => {
    if (feedbacks.length === 0) return;
    const latest = feedbacks[0];
    // Don't show info type as notifications
    if (latest.type === 'info') return;

    setVisible(prev => [latest, ...prev].slice(0, 3));

    // Auto-dismiss after 3 seconds
    const timeout = setTimeout(() => {
      setVisible(prev => prev.filter(f => f.id !== latest.id));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [feedbacks]);

  if (visible.length === 0) return null;

  const bgStyles = {
    success: "bg-primary/10 border-primary/30",
    warning: "bg-accent/10 border-accent/30",
    error: "bg-destructive/10 border-destructive/30",
    info: "bg-card border-border",
  };

  const textStyles = {
    success: "text-neon-green",
    warning: "text-neon-amber",
    error: "text-neon-red",
    info: "text-muted-foreground",
  };

  return (
    <div className="fixed top-16 right-4 z-40 space-y-2 w-72">
      {visible.map((fb) => (
        <div
          key={fb.id}
          className={`px-4 py-3 rounded-lg border animate-fade-up backdrop-blur-sm ${bgStyles[fb.type]}`}
        >
          <p className={`text-xs font-mono font-medium ${textStyles[fb.type]}`}>
            {fb.type === 'success' ? '✓ ' : fb.type === 'error' ? '✗ ' : '⚠ '}
            {fb.text}
          </p>
        </div>
      ))}
    </div>
  );
};
