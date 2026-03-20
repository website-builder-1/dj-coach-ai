import { useState, useCallback } from "react";
import { ChevronUp, Music, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackLibraryProps {
  onLoadFile: (file: File, deck: "A" | "B") => void;
}

export const TrackLibrary = ({ onLoadFile }: TrackLibraryProps) => {
  const [expanded, setExpanded] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((newFiles: FileList) => {
    const audioFiles = Array.from(newFiles).filter(
      f => f.type.includes('audio') || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
    );
    setFiles(prev => [...prev, ...audioFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className={`shrink-0 border-t border-border/50 bg-card transition-all duration-300 ${expanded ? "h-48" : "h-10"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Track Library</span>
          <span className="text-[10px] font-mono text-muted-foreground">({files.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono gap-1 pointer-events-none">
              <Upload className="w-3 h-3" />
              Upload
            </Button>
          </label>
          <ChevronUp className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
        </div>
      </button>

      {expanded && (
        <div
          className={`px-4 pb-2 overflow-auto h-[calc(100%-40px)] ${dragOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs font-mono text-muted-foreground">
                Drop audio files here or click Upload
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest border-b border-border/30">
                  <th className="text-left py-1.5 font-medium">File</th>
                  <th className="text-center py-1.5 font-medium">Size</th>
                  <th className="text-right py-1.5 font-medium">Load</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr key={i} className="group hover:bg-secondary/30 transition-colors border-b border-border/10">
                    <td className="py-1.5 text-xs text-foreground truncate max-w-[300px]">{file.name}</td>
                    <td className="py-1.5 text-xs text-center font-mono tabular-nums text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="deck" size="sm" className="h-5 px-2 text-[9px]" onClick={() => onLoadFile(file, "A")}>
                          A
                        </Button>
                        <Button variant="deck" size="sm" className="h-5 px-2 text-[9px]" onClick={() => onLoadFile(file, "B")}>
                          B
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
