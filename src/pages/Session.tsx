import { useState } from "react";
import { DeckPanel } from "@/components/session/DeckPanel";
import { MixerPanel } from "@/components/session/MixerPanel";
import { WaveformDisplay } from "@/components/session/WaveformDisplay";
import { AIHud } from "@/components/session/AIHud";
import { TrackLibrary } from "@/components/session/TrackLibrary";
import { SessionHeader } from "@/components/session/SessionHeader";

export interface TrackInfo {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: string;
  key?: string;
}

const Session = () => {
  const [smartFader, setSmartFader] = useState(false);
  const [mode, setMode] = useState<"learning" | "assist">("learning");
  const [deckATrack, setDeckATrack] = useState<TrackInfo | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<TrackInfo | null>(null);
  const [crossfader, setCrossfader] = useState(50);
  const [mixScore, setMixScore] = useState(84);

  const handleLoadTrack = (track: TrackInfo, deck: "A" | "B") => {
    if (deck === "A") setDeckATrack(track);
    else setDeckBTrack(track);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <SessionHeader
        smartFader={smartFader}
        onSmartFaderToggle={() => setSmartFader(!smartFader)}
        mode={mode}
        onModeChange={setMode}
        mixScore={mixScore}
      />

      {/* Waveforms */}
      <div className="grid grid-cols-2 gap-px bg-border/30">
        <WaveformDisplay deck="A" track={deckATrack} color="cyan" />
        <WaveformDisplay deck="B" track={deckBTrack} color="purple" />
      </div>

      {/* Main deck area */}
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-px bg-border/30 min-h-0">
        <DeckPanel deck="A" track={deckATrack} />
        <MixerPanel crossfader={crossfader} onCrossfaderChange={setCrossfader} />
        <DeckPanel deck="B" track={deckBTrack} />
      </div>

      {/* AI HUD overlay */}
      <AIHud active={smartFader} mode={mode} />

      {/* Track Library */}
      <TrackLibrary onLoadTrack={handleLoadTrack} />
    </div>
  );
};

export default Session;
