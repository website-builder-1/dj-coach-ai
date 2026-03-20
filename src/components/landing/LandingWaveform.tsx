import { useEffect, useRef } from "react";

export const LandingWaveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      const mid = rect.height / 2;
      const bars = 120;
      const barW = rect.width / bars;

      for (let i = 0; i < bars; i++) {
        const t = (i / bars + frame * 0.002) % 1;
        const h1 = Math.sin(t * Math.PI * 4) * 30 + Math.sin(t * Math.PI * 7 + frame * 0.01) * 15;
        const h2 = Math.sin(t * Math.PI * 3 + 1) * 25 + Math.cos(t * Math.PI * 5 + frame * 0.015) * 12;
        
        const alpha1 = 0.4 + Math.abs(h1) / 60;
        const alpha2 = 0.3 + Math.abs(h2) / 50;

        // Deck A waveform (cyan)
        ctx.fillStyle = `hsla(185, 70%, 50%, ${alpha1})`;
        ctx.fillRect(i * barW + 1, mid - Math.abs(h1), barW - 2, Math.abs(h1));
        
        // Deck B waveform (purple-ish)
        ctx.fillStyle = `hsla(280, 60%, 60%, ${alpha2})`;
        ctx.fillRect(i * barW + 1, mid, barW - 2, Math.abs(h2));
      }

      // Center line
      ctx.strokeStyle = "hsla(220, 12%, 30%, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(rect.width, mid);
      ctx.stroke();

      // Playhead
      const playX = (frame * 0.5) % rect.width;
      ctx.strokeStyle = "hsla(142, 70%, 50%, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, rect.height);
      ctx.stroke();

      frame++;
      requestAnimationFrame(draw);
    };

    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-dj-surface animate-fade-up" style={{ animationDelay: "400ms" }}>
      <canvas ref={canvasRef} className="w-full h-32 md:h-40" style={{ display: "block" }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(90deg, hsl(220 15% 8%) 0%, transparent 10%, transparent 90%, hsl(220 15% 8%) 100%)"
      }} />
    </div>
  );
};
