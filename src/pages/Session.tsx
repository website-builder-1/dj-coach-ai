import { useState, useCallback } from "react";
import { DeckPanel } from "@/components/session/DeckPanel";
import { MixerPanel } from "@/components/session/MixerPanel";
import { WaveformDisplay } from "@/components/session/WaveformDisplay";
import { AIHud } from "@/components/session/AIHud";
import { TrackLibrary } from "@/components/session/TrackLibrary";
import { SessionHeader } from "@/components/session/SessionHeader";
import { EnergyMeter } from "@/components/session/EnergyMeter";
import { GhostMix } from "@/components/session/GhostMix";
import { AutoTransition } from "@/components/session/AutoTransition";
import { FeedbackNotification } from "@/components/session/FeedbackNotification";
import { useAudioEngine } from "@/hooks/useAudioEngine";

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
  const [ghostMixOn, setGhostMixOn] = useState(false);

  const engine = useAudioEngine(smartFader, mode);

  const handleFileLoad = useCallback(async (file: File, deck: "A" | "B") => {
    await engine.loadFile(deck, file);
  }, [engine.loadFile]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <SessionHeader
        smartFader={smartFader}
        onSmartFaderToggle={() => setSmartFader(!smartFader)}
        mode={mode}
        onModeChange={setMode}
        mixScore={engine.performance.score}
        performance={engine.performance}
        midiConnected={engine.midiConnected}
        ghostMixOn={ghostMixOn}
        onGhostMixToggle={() => setGhostMixOn(!ghostMixOn)}
      />

      {/* Waveforms */}
      <div className="grid grid-cols-2 gap-px bg-border/30">
        <WaveformDisplay
          deck="A"
          waveformPeaks={engine.deckA.waveformPeaks}
          currentTime={engine.deckA.currentTime}
          duration={engine.deckA.duration}
          playing={engine.deckA.playing}
          bpm={engine.deckA.bpm}
          trackName={engine.deckA.fileName}
          color="cyan"
        />
        <WaveformDisplay
          deck="B"
          waveformPeaks={engine.deckB.waveformPeaks}
          currentTime={engine.deckB.currentTime}
          duration={engine.deckB.duration}
          playing={engine.deckB.playing}
          bpm={engine.deckB.bpm}
          trackName={engine.deckB.fileName}
          color="purple"
        />
      </div>

      {/* Ghost Mix overlay */}
      {ghostMixOn && engine.deckA.loaded && engine.deckB.loaded && (
        <GhostMix data={engine.getGhostData()} crossfader={engine.crossfader} />
      )}

      {/* Main deck area */}
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-px bg-border/30 min-h-0">
        <DeckPanel
          deck="A"
          state={engine.deckA}
          onPlay={() => engine.play('A')}
          onPause={() => engine.pause('A')}
          onCue={() => engine.cue('A')}
          onTempoChange={(v) => engine.setTempo('A', v)}
          onNudge={(d) => engine.nudge('A', d)}
          onScratch={(d) => engine.scratch('A', d)}
          onLoadFile={(f) => handleFileLoad(f, 'A')}
          loading={engine.loading === 'A'}
        />
        <MixerPanel
          crossfader={engine.crossfader}
          onCrossfaderChange={engine.updateCrossfader}
          levelA={engine.levels.levelA}
          levelB={engine.levels.levelB}
          eqA={engine.deckA.eq}
          eqB={engine.deckB.eq}
          onEQChange={engine.setEQ}
          onFilterChange={engine.setFilter}
        />
        <DeckPanel
          deck="B"
          state={engine.deckB}
          onPlay={() => engine.play('B')}
          onPause={() => engine.pause('B')}
          onCue={() => engine.cue('B')}
          onTempoChange={(v) => engine.setTempo('B', v)}
          onNudge={(d) => engine.nudge('B', d)}
          onScratch={(d) => engine.scratch('B', d)}
          onLoadFile={(f) => handleFileLoad(f, 'B')}
          loading={engine.loading === 'B'}
        />
      </div>

      {/* Energy Meter */}
      <EnergyMeter energy={engine.energy} score={engine.performance.score} />

      {/* AI HUD overlay */}
      <AIHud active={smartFader} mode={mode} feedbacks={engine.feedbacks} />

      {/* Feedback Notifications */}
      <FeedbackNotification feedbacks={engine.feedbacks} />

      {/* Auto Transition */}
      {smartFader && engine.deckA.loaded && engine.deckB.loaded && (
        <AutoTransition
          suggestion={engine.getTransitionSuggestion()}
          onExecute={() => {
            // Auto-execute transition
            let step = 0;
            const interval = setInterval(() => {
              step++;
              const target = Math.min(100, step * 5);
              engine.updateCrossfader(target);
              if (target >= 100) clearInterval(interval);
            }, 200);
          }}
        />
      )}

      {/* Track Library */}
      <TrackLibrary onLoadFile={handleFileLoad} />
    </div>
  );
};

export default Session;
