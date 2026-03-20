import { useState } from "react";
import { ChevronUp, Music, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackInfo } from "@/pages/Session";

interface TrackLibraryProps {
  onLoadTrack: (track: TrackInfo, deck: "A" | "B") => void;
}

const sampleTracks: TrackInfo[] = [
  { id: "1", name: "Midnight Drive", artist: "Kasper Lindmark", bpm: 124, duration: "5:32", key: "Am" },
  { id: "2", name: "Solar Flare", artist: "Neon District", bpm: 128, duration: "6:14", key: "Cm" },
  { id: "3", name: "Deep Current", artist: "Wavelength", bpm: 122, duration: "7:01", key: "Fm" },
  { id: "4", name: "Pulse Width", artist: "Circuit Theory", bpm: 126, duration: "5:48", key: "Dm" },
  { id: "5", name: "Afterglow", artist: "Horizon Line", bpm: 130, duration: "4:55", key: "Gm" },
  { id: "6", name: "Tectonic", artist: "Sub Pressure", bpm: 125, duration: "6:38", key: "Bbm" },
];

export const TrackLibrary = ({ onLoadTrack }: TrackLibraryProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`shrink-0 border-t border-border/50 bg-card transition-all duration-300 ${expanded ? "h-48" : "h-10"}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Track Library</span>
          <span className="text-[10px] font-mono text-muted-foreground">({sampleTracks.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono gap-1">
            <Upload className="w-3 h-3" />
            Upload
          </Button>
          <ChevronUp className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
        </div>
      </button>

      {/* Track list */}
      {expanded && (
        <div className="px-4 pb-2 overflow-auto h-[calc(100%-40px)]">
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest border-b border-border/30">
                <th className="text-left py-1.5 font-medium">Title</th>
                <th className="text-left py-1.5 font-medium">Artist</th>
                <th className="text-center py-1.5 font-medium">BPM</th>
                <th className="text-center py-1.5 font-medium">Key</th>
                <th className="text-center py-1.5 font-medium">Duration</th>
                <th className="text-right py-1.5 font-medium">Load</th>
              </tr>
            </thead>
            <tbody>
              {sampleTracks.map((track) => (
                <tr key={track.id} className="group hover:bg-secondary/30 transition-colors border-b border-border/10">
                  <td className="py-1.5 text-xs text-foreground">{track.name}</td>
                  <td className="py-1.5 text-xs text-muted-foreground">{track.artist}</td>
                  <td className="py-1.5 text-xs text-center font-mono tabular-nums text-muted-foreground">{track.bpm}</td>
                  <td className="py-1.5 text-xs text-center font-mono text-muted-foreground">{track.key}</td>
                  <td className="py-1.5 text-xs text-center font-mono tabular-nums text-muted-foreground">{track.duration}</td>
                  <td className="py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="deck" size="sm" className="h-5 px-2 text-[9px]" onClick={() => onLoadTrack(track, "A")}>
                        A
                      </Button>
                      <Button variant="deck" size="sm" className="h-5 px-2 text-[9px]" onClick={() => onLoadTrack(track, "B")}>
                        B
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
