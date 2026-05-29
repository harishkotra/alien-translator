import { useState, useEffect, useRef, useCallback } from "react";
import {
  SimulationEngine,
  type SimulationSnapshot,
} from "./simulation/engine.ts";
import type { SimulationConfig, Personality } from "./types/index.ts";
import { resetProvider } from "./providers/index.ts";
import { Controls } from "./components/Controls.tsx";
import { SplitView } from "./components/SplitView.tsx";
import { CommsPanel } from "./components/CommsPanel.tsx";
import { DictionaryPanel } from "./components/DictionaryPanel.tsx";
import { MetricsPanel } from "./components/MetricsPanel.tsx";
import { ThemeToggle } from "./components/ThemeToggle.tsx";

function getDefaultConfig(): SimulationConfig {
  return {
    provider: "",
    modelName: "google/gemma-3-e4b",
    roundsPerSecond: 10,
    agentsPerCivilization: 50,
  };
}

export default function App() {
  const [config, setConfig] = useState<SimulationConfig>(getDefaultConfig);
  const [snap, setSnap] = useState<SimulationSnapshot | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);

  useEffect(() => {
    const engine = new SimulationEngine(config);
    engineRef.current = engine;
    engine.setUpdateCallback((s) => setSnap({ ...s }));
    setSnap(engine.getSnapshot());
    return () => {
      engine.pause();
    };
  }, []);

  const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
    setConfig(newConfig);
    resetProvider();
    if (engineRef.current) {
      engineRef.current.config = newConfig;
    }
  }, []);

  const handleStart = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleReset = useCallback(() => {
    resetProvider();
    engineRef.current?.reset();
  }, []);

  const handleStep = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.step();
    }
  }, []);

  if (!snap) return null;

  const recentTrades = snap.trades.slice(-50);

  const agentPersonalities: Record<string, Personality> = {};
  for (const a of snap.alpha.agents) agentPersonalities[a.id] = a.personality;
  for (const a of snap.beta.agents) agentPersonalities[a.id] = a.personality;

  return (
    <div className="min-h-screen bg-canvas p-5 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-fg tracking-tight">
              Alien Translator
            </h1>
            <span className="hidden sm:inline text-sm text-fg-3 font-medium">
              Emergent Communication Simulation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm text-fg-3">
              <span>
                {snap.alpha.agents.length + snap.beta.agents.length} agents
              </span>
              <span className="w-1 h-1 rounded-full bg-fg-4" />
              <span>2 civs · 50 agents each</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Description */}
        <div className="text-sm text-fg-2 leading-relaxed max-w-3xl">
          Two civilizations of AI agents are building a shared language from
          scratch. Each agent sends symbols during trade negotiations —
          successful deals reinforce a symbol's meaning, while failed trades
          weaken it. Over time, a common vocabulary emerges without any
          pre-programmed definitions.
        </div>

        {/* Controls */}
        <Controls
          config={config}
          running={snap.running}
          round={snap.round}
          onConfigChange={handleConfigChange}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onStep={handleStep}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <SplitView
              civ={snap.alpha}
              side="alpha"
              recentTrades={recentTrades}
            />
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <div className="h-64">
              <CommsPanel
                messages={snap.commsMessages}
                agentPersonalities={agentPersonalities}
              />
            </div>
            <DictionaryPanel hypotheses={snap.hypotheses} />
          </div>

          <div className="col-span-4">
            <SplitView
              civ={snap.beta}
              side="beta"
              recentTrades={recentTrades}
            />
          </div>
        </div>

        {/* Metrics */}
        <MetricsPanel metrics={snap.metrics} />

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-fg-3 border-t border-edge">
          <span>Built by</span>
          <a
            href="https://harishkotra.me"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg-2 hover:text-fg transition-colors"
          >
            Harish Kotra
          </a>
          <span className="w-1 h-1 rounded-full bg-fg-4" />
          <a
            href="https://dailybuild.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg-2 hover:text-fg transition-colors"
          >
            Check out my other builds
          </a>
        </div>
      </div>
    </div>
  );
}
