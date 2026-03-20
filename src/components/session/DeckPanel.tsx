import { useState } from "react";
import { Play, Pause, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackInfo } from "@/pages/Session";

interface DeckPanelProps {
  deck: "A" | "B";
  track: TrackInfo | null;
}

export const DeckPanel = ({ deck, track }: DeckPanelProps) => {
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(0);

  return (
    <div className="bg-card p-4 flex flex-col gap-4 min-h-0">
      {/* Track info */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          {track ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No track loaded</p>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
          {track?.duration || "--:--"}
        </span>
      </div>

      {/* Jog wheel */}
      <div className="flex items-center justify-center py-2">
        <div className="w-32 h-32 rounded-full border-2 border-border/60 bg-dj-surface relative flex items-center justify-center cursor-grab active:cursor-grabbing group hover:border-primary/30 transition-colors duration-300">
          {/* Inner ring */}
          <div className="w-20 h-20 rounded-full border border-border/40 bg-card flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-secondary" />
          </div>
          {/* Indicator dot */}
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors ${playing ? "bg-primary" : "bg-muted-foreground"}`} />
          {/* Rotation marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div
              key={deg}
              className="absolute w-0.5 h-2 bg-border/40"
              style={{
                transform: `rotate(${deg}deg) translateY(-58px)`,
                transformOrigin: "center center",
              }}
            />
          ))}
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="deck" size="sm" className="w-16" disabled={!track}>
          <SkipBack className="w-3 h-3 mr-1" />
          CUE
        </Button>
        <Button
          variant={playing ? "default" : "deck"}
          size="sm"
          className="w-16"
          disabled={!track}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
          {playing ? "PAUSE" : "PLAY"}
        </Button>
      </div>

      {/* Tempo slider */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Tempo</span>
          <span className={`text-[10px] font-mono tabular-nums ${tempo === 0 ? "text-muted-foreground" : tempo > 0 ? "text-neon-green" : "text-neon-red"}`}>
            {tempo > 0 ? "+" : ""}{tempo.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min={-8}
          max={8}
          step={0.1}
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
      </div>
    </div>
  );
};
