import { useState } from "react";
import type { SimulationConfig } from "../types/index.ts";

interface ControlsProps {
  config: SimulationConfig;
  running: boolean;
  round: number;
  onConfigChange: (config: SimulationConfig) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
}

export function Controls({
  config,
  running,
  round,
  onConfigChange,
  onStart,
  onPause,
  onReset,
  onStep,
}: ControlsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-edge shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-fg tabular-nums">
            Round {round}
          </span>
          {running && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 status-dot" />
              Running
            </span>
          )}
        </div>

        <div className="flex rounded-lg border border-edge overflow-hidden bg-subtle p-0.5">
          {!running ? (
            <button
              onClick={onStart}
              className="px-3.5 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md transition-colors hover:bg-green-700"
            >
              Start
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-3.5 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md transition-colors hover:bg-amber-700"
            >
              Pause
            </button>
          )}
          <button
            onClick={onStep}
            disabled={running}
            className="px-3.5 py-1.5 text-sm font-medium text-alpha-500 transition-colors hover:bg-card disabled:opacity-30 disabled:hover:bg-transparent rounded-md"
          >
            Step
          </button>
          <button
            onClick={onReset}
            className="px-3.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-card rounded-md"
          >
            Reset
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-fg-3 hover:text-fg-2 transition-colors"
        >
          {expanded ? "Hide Settings" : "Settings"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-edge px-4 py-3 bg-subtle transition-colors">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">Provider</label>
              <select
                value={config.provider}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    provider: e.target.value as SimulationConfig["provider"],
                  })
                }
                className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors"
              >
                <option value="">Select a provider</option>
                <option value="openai">OpenAI</option>
                <option value="featherless">Featherless</option>
                <option value="lmstudio">LM Studio</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">Model</label>
              <input
                type="text"
                value={config.modelName || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, modelName: e.target.value })
                }
                placeholder="gpt-4o-mini"
                className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors placeholder:text-fg-4"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">
                Rounds/sec
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={config.roundsPerSecond}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    roundsPerSecond: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-2">
                LM Studio URL
              </label>
              <input
                type="text"
                value={config.lmstudioBaseUrl || "http://localhost:1234"}
                onChange={(e) =>
                  onConfigChange({ ...config, lmstudioBaseUrl: e.target.value })
                }
                className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors"
              />
            </div>
            {config.provider === "openai" && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-medium text-fg-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={config.openaiApiKey || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, openaiApiKey: e.target.value })
                  }
                  className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors"
                />
              </div>
            )}
            {config.provider === "featherless" && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-medium text-fg-2">
                  Featherless API Key
                </label>
                <input
                  type="password"
                  value={config.featherlessApiKey || ""}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      featherlessApiKey: e.target.value,
                    })
                  }
                  className="bg-card border border-edge text-fg px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-alpha-500/20 focus:border-alpha-500 transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
