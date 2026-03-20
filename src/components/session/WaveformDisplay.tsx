import { useEffect, useRef } from "react";
import { TrackInfo } from "@/pages/Session";

interface WaveformDisplayProps {
  deck: "A" | "B";
  track: TrackInfo | null;
  color: "cyan" | "purple";
}

export const WaveformDisplay = ({ deck, track, color }: WaveformDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let frame = 0;
    let animId: number;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!track) {
        ctx.fillStyle = `hsla(220, 12%, 20%, 0.3)`;
        ctx.font = "11px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`Load track to Deck ${deck}`, rect.width / 2, rect.height / 2 + 4);
        animId = requestAnimationFrame(draw);
        return;
      }

      const mid = rect.height / 2;
      const bars = Math.floor(rect.width / 3);
      const barW = rect.width / bars;

      for (let i = 0; i < bars; i++) {
        const t = (i / bars + frame * 0.001) % 1;
        const h = Math.sin(t * Math.PI * 6) * mid * 0.7 + Math.sin(t * Math.PI * 11 + frame * 0.008) * mid * 0.3;
        const alpha = 0.3 + Math.abs(h) / (mid * 1.5);

        ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`;
        ctx.fillRect(i * barW, mid - Math.abs(h) * 0.5, barW - 1, Math.abs(h));
      }

      // Playhead
      const px = (frame * 0.3) % rect.width;
      ctx.strokeStyle = `hsla(0, 0%, 100%, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, rect.height);
      ctx.stroke();

      // Beat grid lines
      const beatSpacing = rect.width / 16;
      ctx.strokeStyle = `hsla(220, 12%, 30%, 0.2)`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * beatSpacing, 0);
        ctx.lineTo(i * beatSpacing, rect.height);
        ctx.stroke();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [track, deck, color]);

  return (
    <div className="bg-dj-surface h-24 relative">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className={`text-[10px] font-mono font-bold tracking-widest ${color === "cyan" ? "text-neon-cyan" : "text-foreground" } opacity-60`}>
          DECK {deck}
        </span>
        {track && (
          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
            {track.artist} — {track.name}
          </span>
        )}
      </div>
      {track && (
        <div className="absolute top-2 right-3 z-10">
          <span className="text-[10px] font-mono text-neon-green">{track.bpm} BPM</span>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
