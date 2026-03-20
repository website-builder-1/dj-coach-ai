import { useEffect, useRef } from "react";

interface WaveformDisplayProps {
  deck: "A" | "B";
  waveformPeaks: Float32Array | null;
  currentTime: number;
  duration: number;
  playing: boolean;
  bpm: number;
  trackName: string;
  color: "cyan" | "purple";
}

export const WaveformDisplay = ({ deck, waveformPeaks, currentTime, duration, playing, bpm, trackName, color }: WaveformDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const hue = color === "cyan" ? 185 : 280;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!waveformPeaks || waveformPeaks.length === 0) {
        // Empty state
        ctx.fillStyle = `hsla(220, 12%, 20%, 0.3)`;
        ctx.font = "11px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`Drop audio file to Deck ${deck}`, rect.width / 2, rect.height / 2 + 4);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const mid = rect.height / 2;
      const numBars = waveformPeaks.length;
      const barW = rect.width / numBars;

      // Draw waveform bars
      for (let i = 0; i < numBars; i++) {
        const h = waveformPeaks[i] * mid * 0.9;
        const progress = duration > 0 ? currentTime / duration : 0;
        const barProgress = i / numBars;
        const isPast = barProgress < progress;

        const alpha = isPast ? 0.9 : 0.35;
        const lightness = isPast ? 55 : 40;

        ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
        ctx.fillRect(i * barW, mid - h, barW - 0.5, h * 2);
      }

      // Playhead
      if (duration > 0) {
        const px = (currentTime / duration) * rect.width;
        ctx.strokeStyle = `hsla(0, 0%, 100%, 0.9)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, rect.height);
        ctx.stroke();

        // Glow effect around playhead
        const grad = ctx.createLinearGradient(px - 6, 0, px + 6, 0);
        grad.addColorStop(0, `hsla(0, 0%, 100%, 0)`);
        grad.addColorStop(0.5, `hsla(0, 0%, 100%, 0.15)`);
        grad.addColorStop(1, `hsla(0, 0%, 100%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(px - 6, 0, 12, rect.height);
      }

      // Beat grid lines
      if (bpm > 0 && duration > 0) {
        const beatDuration = 60 / bpm;
        const totalBeats = duration / beatDuration;
        ctx.strokeStyle = `hsla(220, 12%, 30%, 0.15)`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < totalBeats; i++) {
          const x = (i * beatDuration / duration) * rect.width;
          if (i % 4 === 0) {
            ctx.strokeStyle = `hsla(220, 12%, 40%, 0.3)`;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = `hsla(220, 12%, 30%, 0.1)`;
            ctx.lineWidth = 0.5;
          }
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [waveformPeaks, currentTime, duration, playing, bpm, deck, color]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-dj-surface h-24 relative">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className={`text-[10px] font-mono font-bold tracking-widest ${color === "cyan" ? "text-neon-cyan" : "text-foreground"} opacity-60`}>
          DECK {deck}
        </span>
        {trackName && (
          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
            {trackName}
          </span>
        )}
      </div>
      <div className="absolute top-2 right-3 z-10 flex items-center gap-3">
        {bpm > 0 && (
          <span className="text-[10px] font-mono text-neon-green tabular-nums">{bpm} BPM</span>
        )}
        {duration > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>
      {/* Playing indicator */}
      {playing && (
        <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-[9px] font-mono text-primary">PLAYING</span>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
