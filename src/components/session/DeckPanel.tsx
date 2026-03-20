import { useRef, useCallback, useState } from "react";
import { Play, Pause, SkipBack, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckState } from "@/lib/audioEngine";

interface DeckPanelProps {
  deck: "A" | "B";
  state: DeckState;
  onPlay: () => void;
  onPause: () => void;
  onCue: () => void;
  onTempoChange: (v: number) => void;
  onNudge: (dir: number) => void;
  onScratch: (delta: number) => void;
  onLoadFile: (file: File) => void;
  loading: boolean;
}

export const DeckPanel = ({ deck, state, onPlay, onPause, onCue, onTempoChange, onNudge, onScratch, onLoadFile, loading }: DeckPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jogRef = useRef<HTMLDivElement>(null);
  const [jogAngle, setJogAngle] = useState(0);
  const lastAngleRef = useRef(0);
  const isDraggingRef = useRef(false);

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

  // Jog wheel interaction
  const getAngleFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!jogRef.current) return 0;
    const rect = jogRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }, []);

  const handleJogDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastAngleRef.current = getAngleFromMouse(e);

    const handleMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const angle = Math.atan2(
        ev.clientY - (jogRef.current?.getBoundingClientRect().top ?? 0) - 64,
        ev.clientX - (jogRef.current?.getBoundingClientRect().left ?? 0) - 64
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
  }, [state.playing, onNudge, onScratch, getAngleFromMouse]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="bg-card p-4 flex flex-col gap-3 min-h-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Track info + upload */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {state.loaded ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">{state.fileName}</p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="text-neon-green tabular-nums">{state.bpm} BPM</span>
                <span>·</span>
                <span>{state.key}</span>
                <span>·</span>
                <span className="tabular-nums">{formatTime(state.duration)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {loading ? 'Analyzing audio...' : 'No track loaded'}
            </p>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
        <Button variant="deck" size="sm" className="h-7 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3 h-3" />
          Load
        </Button>
      </div>

      {/* Jog wheel */}
      <div className="flex items-center justify-center py-1">
        <div
          ref={jogRef}
          className={`w-28 h-28 rounded-full border-2 bg-dj-surface relative flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-300 ${
            state.playing ? 'border-primary/40' : 'border-border/60'
          }`}
          onMouseDown={handleJogDown}
          style={{ transform: `rotate(${jogAngle}deg)` }}
        >
          <div className="w-16 h-16 rounded-full border border-border/40 bg-card flex items-center justify-center pointer-events-none">
            <div className={`w-3 h-3 rounded-full transition-colors ${state.playing ? 'bg-primary' : 'bg-secondary'}`} />
          </div>
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${state.playing ? 'bg-primary' : 'bg-muted-foreground'}`} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div
              key={deg}
              className="absolute w-0.5 h-2 bg-border/40 pointer-events-none"
              style={{ transform: `rotate(${deg}deg) translateY(-50px)`, transformOrigin: "center center" }}
            />
          ))}
        </div>
      </div>

      {/* Nudge buttons */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="deck" size="sm" className="h-6 w-8 text-[9px]" disabled={!state.loaded} onClick={() => onNudge(-1)}>
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <span className="text-[9px] font-mono text-muted-foreground px-1">NUDGE</span>
        <Button variant="deck" size="sm" className="h-6 w-8 text-[9px]" disabled={!state.loaded} onClick={() => onNudge(1)}>
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="deck" size="sm" className="w-16" disabled={!state.loaded} onClick={onCue}>
          <SkipBack className="w-3 h-3 mr-1" />
          CUE
        </Button>
        <Button
          variant={state.playing ? "default" : "deck"}
          size="sm"
          className="w-16"
          disabled={!state.loaded}
          onClick={state.playing ? onPause : onPlay}
        >
          {state.playing ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
          {state.playing ? "PAUSE" : "PLAY"}
        </Button>
      </div>

      {/* Tempo slider */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Tempo</span>
          <span className={`text-[10px] font-mono tabular-nums ${state.tempo === 0 ? "text-muted-foreground" : state.tempo > 0 ? "text-neon-green" : "text-neon-red"}`}>
            {state.tempo > 0 ? "+" : ""}{state.tempo.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min={-8}
          max={8}
          step={0.1}
          value={state.tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
};
