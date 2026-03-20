import { useState, useCallback } from "react";
import { DeckPanel } from "@/components/session/DeckPanel";
import { MixerPanel } from "@/components/session/MixerPanel";
import { WaveformDisplay } from "@/components/session/WaveformDisplay";
import { AIHud } from "@/components/session/AIHud";
import { SessionHeader } from "@/components/session/SessionHeader";
import { EnergyMeter } from "@/components/session/EnergyMeter";
import { AutoTransition } from "@/components/session/AutoTransition";
import { FeedbackNotification } from "@/components/session/FeedbackNotification";
import { TrackLibrary } from "@/components/session/TrackLibrary";
import { useAudioEngine } from "@/hooks/useAudioEngine";

const Session = () => {
  const [smartFader, setSmartFader] = useState(false);
  const [mode, setMode] = useState<"learning" | "assist">("learning");
  const [headphoneCueA, setHeadphoneCueA] = useState(false);
  const [headphoneCueB, setHeadphoneCueB] = useState(false);
  const [headphoneCueMaster, setHeadphoneCueMaster] = useState(false);
  const [cfxA, setCfxA] = useState(50);
  const [cfxB, setCfxB] = useState(50);
  const [volumeA, setVolumeA] = useState(80);
  const [volumeB, setVolumeB] = useState(80);

  const engine = useAudioEngine(smartFader, mode);

  const handleFileLoad = useCallback(async (file: File, deck: "A" | "B") => {
    await engine.loadFile(deck, file);
  }, [engine.loadFile]);

  const handleSync = useCallback((deck: 'A' | 'B') => {
    engine.sync(deck);
  }, [engine.sync]);

  const handlePadTrigger = useCallback((deck: 'A' | 'B', pad: number, shifted: boolean) => {
    engine.triggerPad(deck, pad, shifted);
  }, [engine.triggerPad]);

  const handleVolumeChange = useCallback((deck: 'A' | 'B', val: number) => {
    if (deck === 'A') setVolumeA(val);
    else setVolumeB(val);
    engine.setVolume(deck, val / 100);
  }, [engine.setVolume]);

  const handleHeadphoneCue = useCallback((target: 'A' | 'B' | 'master') => {
    if (target === 'A') setHeadphoneCueA(p => !p);
    else if (target === 'B') setHeadphoneCueB(p => !p);
    else setHeadphoneCueMaster(p => !p);
  }, []);

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
      />

      {/* Waveforms */}
      <div className="grid grid-cols-2 gap-px bg-border/20 shrink-0">
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

      {/* Main deck area */}
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-px bg-border/20 min-h-0">
        <DeckPanel
          deck="A"
          state={engine.deckA}
          onPlay={() => engine.play('A')}
          onPause={() => engine.pause('A')}
          onCue={() => engine.cue('A')}
          onSync={() => handleSync('A')}
          onTempoChange={(v) => engine.setTempo('A', v)}
          onNudge={(d) => engine.nudge('A', d)}
          onScratch={(d) => engine.scratch('A', d)}
          onLoadFile={(f) => handleFileLoad(f, 'A')}
          onPadTrigger={(pad, shifted) => handlePadTrigger('A', pad, shifted)}
          loading={engine.loading === 'A'}
        />
        <MixerPanel
          crossfader={engine.crossfader}
          onCrossfaderChange={engine.updateCrossfader}
          volumeA={volumeA}
          volumeB={volumeB}
          onVolumeChange={handleVolumeChange}
          levelA={engine.levels.levelA}
          levelB={engine.levels.levelB}
          eqA={engine.deckA.eq}
          eqB={engine.deckB.eq}
          onEQChange={engine.setEQ}
          cfxA={cfxA}
          cfxB={cfxB}
          onCFXChange={(deck, val) => deck === 'A' ? setCfxA(val) : setCfxB(val)}
          headphoneCueA={headphoneCueA}
          headphoneCueB={headphoneCueB}
          headphoneCueMaster={headphoneCueMaster}
          onHeadphoneCue={handleHeadphoneCue}
          smartFader={smartFader}
          onSmartFaderToggle={() => setSmartFader(!smartFader)}
        />
        <DeckPanel
          deck="B"
          state={engine.deckB}
          onPlay={() => engine.play('B')}
          onPause={() => engine.pause('B')}
          onCue={() => engine.cue('B')}
          onSync={() => handleSync('B')}
          onTempoChange={(v) => engine.setTempo('B', v)}
          onNudge={(d) => engine.nudge('B', d)}
          onScratch={(d) => engine.scratch('B', d)}
          onLoadFile={(f) => handleFileLoad(f, 'B')}
          onPadTrigger={(pad, shifted) => handlePadTrigger('B', pad, shifted)}
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
