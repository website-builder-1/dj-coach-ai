import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LandingWaveform } from "@/components/landing/LandingWaveform";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { SmartFaderDemo } from "@/components/landing/SmartFaderDemo";
import { Headphones, Cpu, BarChart3, Zap, Music, Settings2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Headphones className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">DJ Mentor</span>
          </div>
          <Button variant="hero" size="sm" onClick={() => navigate("/session")}>
            Start Mixing
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, hsl(142 70% 50%), transparent 70%)" }} />
        </div>

        <div className="container relative max-w-4xl mx-auto text-center stagger-children">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono text-primary tracking-wide">AI-POWERED DJ COACHING</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-[0.95] text-balance mb-6">
            Learn to mix with an AI that listens
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-10">
            DJ Mentor watches your every move, detects mistakes in real time, 
            and either coaches you through them — or fixes them seamlessly.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={() => navigate("/session")}>
              Start Mixing
            </Button>
            <Button variant="hero-outline" size="xl" onClick={() => {
              document.getElementById("smart-fader")?.scrollIntoView({ behavior: "smooth" });
            }}>
              How it works
            </Button>
          </div>
        </div>

        {/* Hero waveform decoration */}
        <div className="container max-w-5xl mx-auto mt-16">
          <LandingWaveform />
        </div>
      </section>

      {/* Smart Fader Section */}
      <section id="smart-fader" className="py-24 px-4 border-t border-border/30">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <span className="text-xs font-mono text-neon-amber tracking-widest uppercase mb-4 block">Core Innovation</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6 leading-tight">
                Smart Fader Mode
              </h2>
              <p className="text-muted-foreground text-lg mb-6 text-pretty">
                Toggle it off and you're on your own. Toggle it on and the AI becomes 
                your invisible co-pilot — monitoring every crossfade, EQ move, and phrase transition.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-secondary-foreground"><strong className="text-foreground">Learning Mode:</strong> AI suggests corrections, you decide what to do</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full text-neon-amber bg-accent mt-2 shrink-0" />
                  <p className="text-secondary-foreground"><strong className="text-foreground">Assist Mode:</strong> AI actively fixes your mistakes in real time</p>
                </div>
              </div>
            </div>
            <SmartFaderDemo />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase mb-4 block">Everything you need</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Professional tools, intelligent guidance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <FeatureCard
              icon={<Music className="w-5 h-5" />}
              title="Dual Deck System"
              description="Load, cue, and mix two tracks with scrolling waveforms, tempo control, and jog simulation"
            />
            <FeatureCard
              icon={<Cpu className="w-5 h-5" />}
              title="Real-Time Detection"
              description="AI detects late drops, phrase mismatches, BPM drift, bass clashes, and energy drops instantly"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="Auto Recovery"
              description="When your mix goes bad, Smart Fader smoothly blends tracks back into harmony"
            />
            <FeatureCard
              icon={<Settings2 className="w-5 h-5" />}
              title="MIDI Support"
              description="Connect physical controllers via Web MIDI. Map pads, faders, knobs, and jog wheels"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Mix Quality Score"
              description="Live 0–100 score based on timing accuracy, phrasing, and EQ usage"
            />
            <FeatureCard
              icon={<Headphones className="w-5 h-5" />}
              title="Session Review"
              description="Post-session breakdown with mistake analysis, improvement tracking, and AI feedback"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container max-w-2xl mx-auto text-center animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Ready to level up?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Load your tracks, connect your controller, and let the AI guide you.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate("/session")}>
            Launch DJ Session
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Headphones className="w-4 h-4" />
            <span>DJ Mentor</span>
          </div>
          <span className="text-xs text-muted-foreground">AI-Powered DJ Training</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
