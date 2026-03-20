import { useRef, useCallback, useState } from "react";
import { Play, Pause, SkipBack, Upload, Disc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckState } from "@/lib/audioEngine";

interface DeckPanelProps {
  deck: "A" | "B";
  state: DeckState;
  onPlay: () => void;
  onPause: () => void;
  onCue: () => void;
  onSync: () => void;
  onTempoChange: (v: number) => void;
  onNudge: (dir: number) => void;
  onScratch: (delta: number) => void;
  onLoadFile: (file: File) => void;
  onPadTrigger: (pad: number, shifted: boolean) => void;
  loading: boolean;
}

type PadMode = 'hotcue' | 'padfx' | 'loop' | 'sampler';

export const DeckPanel = ({
  deck, state, onPlay, onPause, onCue, onSync,
  onTempoChange, onNudge, onScratch, onLoadFile, onPadTrigger, loading
}: DeckPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jogRef = useRef<HTMLDivElement>(null);
  const [jogAngle, setJogAngle] = useState(0);
  const lastAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [padMode, setPadMode] = useState<PadMode>('hotcue');
  const [shiftHeld, setShiftHeld] = useState(false);
  const [activePads, setActivePads] = useState<Set<number>>(new Set());

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadFile(file);
  }, [onLoadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes('audio') || file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i))) {
      onLoadFile(file);
    }
  }, [onLoadFile]);

  // Jog wheel
  const handleJogDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const rect = jogRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastAngleRef.current = Math.atan2(
      e.clientY - rect.top - rect.height / 2,
      e.clientX - rect.left - rect.width / 2
    );

    const handleMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !jogRef.current) return;
      const r = jogRef.current.getBoundingClientRect();
      const angle = Math.atan2(
        ev.clientY - r.top - r.height / 2,
        ev.clientX - r.left - r.width / 2
      );
      const delta = angle - lastAngleRef.current;
      lastAngleRef.current = angle;
      setJogAngle(prev => prev + delta * 30);

      if (state.playing) {
        onNudge(delta > 0 ? 1 : -1);
      } else {
        onScratch(delta * 0.5);
      }
    };

    const handleUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [state.playing, onNudge, onScratch]);

  const handlePadPress = (padIdx: number) => {
    setActivePads(prev => new Set(prev).add(padIdx));
    onPadTrigger(padIdx, shiftHeld);
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(padIdx);
        return next;
      });
    }, 150);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isLeft = deck === 'A';
  const accentColor = isLeft ? 'text-neon-cyan' : 'text-foreground opacity-70';
  const padModes: { key: PadMode; label: string }[] = [
    { key: 'hotcue', label: 'HOT CUE' },
    { key: 'padfx', label: 'PAD FX' },
    { key: 'loop', label: 'LOOP' },
    { key: 'sampler', label: 'SAMPLER' },
  ];

  return (
    <div
      className="bg-card flex flex-col min-h-0 overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Track info bar */}
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {state.loaded ? (
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{state.fileName}</p>
              <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground shrink-0">
                <span className="text-neon-green tabular-nums">{state.bpm} BPM</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{state.key}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="tabular-nums">{formatTime(state.currentTime)} / {formatTime(state.duration)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground font-mono">
              {loading ? 'Analyzing audio…' : 'No track loaded'}
            </p>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
        <Button variant="deck" size="sm" className="h-6 text-[9px] gap-1 shrink-0 ml-2" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3 h-3" />
        </Button>
      </div>

      {/* Main deck content */}
      <div className="flex-1 flex flex-col justify-between p-3 gap-2 min-h-0">
        {/* Top row: Transport + Jog */}
        <div className={`flex items-start gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
          {/* Jog Wheel */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              ref={jogRef}
              className={`w-[120px] h-[120px] rounded-full border-2 bg-dj-surface relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
                state.playing ? 'border-primary/30' : 'border-border/40'
              }`}
              onMouseDown={handleJogDown}
              style={{ transform: `rotate(${jogAngle}deg)` }}
            >
              {/* Outer ring ticks */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-px h-2 bg-border/30 pointer-events-none"
                  style={{ transform: `rotate(${deg}deg) translateY(-55px)`, transformOrigin: 'center center' }}
                />
              ))}
              {/* Inner platter */}
              <div className="w-14 h-14 rounded-full border border-border/30 bg-card flex items-center justify-center pointer-events-none">
                <Disc className={`w-5 h-5 ${state.playing ? 'text-primary/60' : 'text-muted-foreground/30'}`} />
              </div>
              {/* Position marker */}
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full pointer-events-none ${
                state.playing ? 'bg-primary' : 'bg-muted-foreground/40'
              }`} />
            </div>
          </div>

          {/* Transport + Sync */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* SHIFT + BEAT SYNC */}
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={() => setShiftHeld(true)}
                onMouseUp={() => setShiftHeld(false)}
                onMouseLeave={() => setShiftHeld(false)}
                className={`px-2.5 py-1 rounded text-[9px] font-mono font-medium border transition-colors ${
                  shiftHeld
                    ? 'bg-foreground/10 border-foreground/30 text-foreground'
                    : 'bg-dj-surface border-border/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                SHIFT
              </button>
              <button
                onClick={onSync}
                disabled={!state.loaded}
                className="px-2.5 py-1 rounded text-[9px] font-mono font-medium border bg-dj-surface border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 transition-colors"
              >
                BEAT SYNC
              </button>
            </div>

            {/* CUE + PLAY/PAUSE */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCue}
                disabled={!state.loaded}
                className={`flex-1 h-10 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-100 active:scale-[0.97] disabled:opacity-30 ${
                  isLeft
                    ? 'bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25'
                    : 'bg-destructive/15 border border-destructive/40 text-destructive hover:bg-destructive/25'
                }`}
              >
                <SkipBack className="w-3.5 h-3.5" />
                CUE
              </button>
              <button
                onClick={state.playing ? onPause : onPlay}
                disabled={!state.loaded}
                className={`flex-1 h-10 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-100 active:scale-[0.97] disabled:opacity-30 ${
                  state.playing
                    ? 'bg-primary/20 border border-primary/50 text-primary'
                    : 'bg-primary/10 border border-primary/30 text-primary/70 hover:bg-primary/20'
                }`}
              >
                {state.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {state.playing ? 'PAUSE' : 'PLAY'}
              </button>
            </div>

            {/* Tempo slider */}
            <div className="mt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Tempo</span>
                <span className={`text-[9px] font-mono tabular-nums ${
                  state.tempo === 0 ? 'text-muted-foreground' : state.tempo > 0 ? 'text-neon-green' : 'text-neon-red'
                }`}>
                  {state.tempo > 0 ? '+' : ''}{state.tempo.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={-8}
                max={8}
                step={0.1}
                value={state.tempo}
                onChange={(e) => onTempoChange(Number(e.target.value))}
                className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-foreground
                  [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border
                  [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
              />
            </div>
          </div>
        </div>

        {/* Performance Pads */}
        <div className="mt-auto">
          {/* Pad mode selector */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {padModes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPadMode(key)}
                className={`flex-1 py-1 text-[8px] font-mono font-medium tracking-wider rounded transition-colors ${
                  padMode === key
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* 8 pads in 2 rows */}
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((pad) => (
              <button
                key={pad}
                onClick={() => handlePadPress(pad)}
                disabled={!state.loaded}
                className={`h-9 rounded-md border text-[10px] font-mono font-bold transition-all duration-75 active:scale-[0.95] disabled:opacity-20 ${
                  activePads.has(pad)
                    ? 'bg-primary/30 border-primary/50 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                    : 'bg-dj-surface border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                }`}
              >
                {pad}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
