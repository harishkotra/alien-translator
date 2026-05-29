import { useRef, useEffect } from "react";
import type { CommsMessage, Personality } from "../types/index.ts";

const PERSONALITY_LABELS: Record<Personality, string> = {
  cooperative: "COOP",
  aggressive: "AGGR",
  cautious: "CAUT",
  curious: "CURI",
  opportunistic: "OPPO",
};

const PERSONALITY_COLORS: Record<Personality, string> = {
  cooperative: "#22c55e",
  aggressive: "#ef4444",
  cautious: "#f59e0b",
  curious: "#a78bfa",
  opportunistic: "#f97316",
};

const SIDE_LABELS = { alpha: "α", beta: "β" } as const;
const SIDE_COLORS = { alpha: "#4a6fa5", beta: "#c97d4e" } as const;

interface CommsPanelProps {
  messages: CommsMessage[];
  agentPersonalities: Record<string, Personality>;
}

export function CommsPanel({ messages, agentPersonalities }: CommsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const recent = messages.slice(-30);

  return (
    <div className="bg-card rounded-xl border border-edge flex flex-col h-full overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-edge">
        <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider">
          Live Communications
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0"
      >
        {recent.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-fg-3">
            Awaiting first contact...
          </div>
        )}
        {recent.map((msg, i) => {
          const personality = agentPersonalities[msg.from];
          const side = msg.civilizationId as "alpha" | "beta";
          return (
            <div
              key={`${msg.round}-${i}`}
              className="msg-animate flex items-start gap-3 py-2 group"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${SIDE_COLORS[side]}18`,
                  color: SIDE_COLORS[side],
                }}
              >
                {SIDE_LABELS[side]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-medium text-fg-2">
                    #{msg.from.split("-").pop()}
                  </span>
                  {personality && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase leading-tight"
                      style={{
                        backgroundColor: `${PERSONALITY_COLORS[personality]}14`,
                        color: PERSONALITY_COLORS[personality],
                      }}
                    >
                      {PERSONALITY_LABELS[personality]}
                    </span>
                  )}
                  <span className="text-[10px] text-fg-4 ml-auto">
                    R{msg.round}
                  </span>
                </div>
                <div className="text-lg leading-snug">{msg.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
