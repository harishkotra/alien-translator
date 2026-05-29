import { useRef, useEffect } from "react";
import type { SymbolHypothesis } from "../types/index.ts";

interface DictionaryPanelProps {
  hypotheses: SymbolHypothesis[];
}

export function DictionaryPanel({ hypotheses }: DictionaryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [hypotheses]);

  return (
    <div className="bg-card rounded-xl border border-edge transition-colors">
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider">
            Emergent Dictionary
          </div>
          <span className="text-[10px] text-fg-3 font-normal normal-case">
            learned hypotheses
          </span>
        </div>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-52 p-3 space-y-2">
        {hypotheses.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-fg-3">
            Need at least 5 trades to analyze
          </div>
        )}
        {hypotheses.map((h, i) => {
          const confidenceColor =
            h.confidence > 0.7
              ? { bar: "#22c55e", bg: "#f0fdf4" }
              : h.confidence > 0.4
                ? { bar: "#f59e0b", bg: "#fffbeb" }
                : { bar: "#ef4444", bg: "#fef2f2" };

          return (
            <div
              key={`${h.symbol}-${i}`}
              className="flex items-center gap-3 bg-subtle border border-edge-light px-3 py-2.5 rounded-lg fade-in transition-colors"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-card border border-edge flex items-center justify-center text-xl shrink-0 transition-colors">
                {h.symbol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-fg capitalize truncate">
                  {h.likelyMeaning}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-edge rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${h.confidence * 100}%`,
                        backgroundColor: confidenceColor.bar,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: confidenceColor.bg,
                      color: confidenceColor.bar,
                    }}
                  >
                    {(h.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
