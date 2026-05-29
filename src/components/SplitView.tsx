import type {
  Civilization,
  TradeExchange,
  Personality,
} from "../types/index.ts";
import { getSymbolSuccessRate } from "../simulation/memory.ts";

const PERSONALITY_COLORS: Record<Personality, string> = {
  cooperative: "#22c55e",
  aggressive: "#ef4444",
  cautious: "#f59e0b",
  curious: "#a78bfa",
  opportunistic: "#f97316",
};

const SIDE_COLORS = {
  alpha: {
    accent: "#4a6fa5",
    bg: "bg-alpha-bg",
    dot: "bg-alpha-500",
    text: "text-alpha-500",
    label: "Alpha",
  },
  beta: {
    accent: "#c97d4e",
    bg: "bg-beta-bg",
    dot: "bg-beta-500",
    text: "text-beta-500",
    label: "Beta",
  },
};

const RESOURCE_CONFIG = [
  { label: "Food", icon: "🌾", color: "#22c55e" },
  { label: "Water", icon: "💧", color: "#3b82f6" },
  { label: "Crystals", icon: "💎", color: "#a78bfa" },
  { label: "Energy", icon: "⚡", color: "#f59e0b" },
];

interface SplitViewProps {
  civ: Civilization;
  side: "alpha" | "beta";
  recentTrades: TradeExchange[];
}

function ResourceBar({
  label,
  value,
  max,
  color,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-fg-2">{label}</span>
          <span className="text-xs font-semibold text-fg tabular-nums">
            {value.toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 bg-edge-light rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-subtle rounded-lg px-3 py-2.5 border border-edge-light">
      <div className="text-xs text-fg-3 font-medium mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-fg tracking-tight">
        {value}
      </div>
      {sub && <div className="text-xs text-fg-3 mt-0.5">{sub}</div>}
    </div>
  );
}

export function SplitView({ civ, side, recentTrades }: SplitViewProps) {
  const colors = SIDE_COLORS[side];

  const totalResources = civ.food + civ.water + civ.crystals + civ.energy;
  const acceptedTrades = recentTrades.filter((t) => t.accepted).length;
  const tradeRate =
    recentTrades.length > 0
      ? ((acceptedTrades / recentTrades.length) * 100).toFixed(0)
      : "—";

  const personalityCounts: Record<string, number> = {};
  for (const a of civ.agents)
    personalityCounts[a.personality] =
      (personalityCounts[a.personality] || 0) + 1;

  const agentTradeCount: Record<string, { total: number; accepted: number }> =
    {};
  for (const t of recentTrades) {
    const agentId = side === "alpha" ? t.alphaAgentId : t.betaAgentId;
    if (!agentTradeCount[agentId])
      agentTradeCount[agentId] = { total: 0, accepted: 0 };
    agentTradeCount[agentId].total++;
    if (t.accepted) agentTradeCount[agentId].accepted++;
  }

  const topAgents = civ.agents
    .map((a) => ({
      id: a.id,
      personality: a.personality,
      trades: agentTradeCount[a.id]?.total || 0,
      successRate: agentTradeCount[a.id]
        ? Math.round(
            (agentTradeCount[a.id].accepted / agentTradeCount[a.id].total) *
              100,
          )
        : 0,
    }))
    .filter((a) => a.trades > 0)
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8);

  const activeSymbols = Array.from(civ.symbolMemory.usageCount.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalAgentTrades = topAgents.reduce((s, a) => s + a.trades, 0);

  const resourceValues: Record<string, number> = {
    Food: civ.food,
    Water: civ.water,
    Crystals: civ.crystals,
    Energy: civ.energy,
  };

  return (
    <div className="bg-card rounded-xl border border-edge overflow-hidden transition-colors">
      {/* Header */}
      <div
        className={`px-4 py-3 ${colors.bg} border-b border-edge transition-colors`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`} />
          <div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              {civ.name}
            </div>
            <div className="text-xs text-fg-3">{civ.agents.length} agents</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <KpiCard
            label="Total Resources"
            value={totalResources.toFixed(0)}
            sub="food + water + crystals + energy"
          />
          <KpiCard
            label="Trade Success"
            value={tradeRate === "—" ? "—" : `${tradeRate}%`}
            sub={`${acceptedTrades} of ${recentTrades.length} trades`}
          />
        </div>

        {/* Personalities */}
        <div>
          <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider mb-2">
            Personalities
          </div>
          <div className="flex gap-1 h-2 mb-2 rounded-full overflow-hidden">
            {Object.entries(personalityCounts).map(([p, count]) => (
              <div
                key={p}
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(count / civ.agents.length) * 100}%`,
                  background: PERSONALITY_COLORS[p as Personality] || "#9ca3af",
                }}
                title={`${p}: ${count}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {(Object.entries(personalityCounts) as [Personality, number][]).map(
              ([p, count]) => (
                <span key={p} className="text-xs flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: PERSONALITY_COLORS[p] }}
                  />
                  <span className="text-fg-2 capitalize">{p}</span>
                  <span className="text-fg-3 font-medium">{count}</span>
                </span>
              ),
            )}
          </div>
        </div>

        {/* Resources */}
        <div>
          <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider mb-1">
            Resources
          </div>
          {RESOURCE_CONFIG.map((rc) => (
            <ResourceBar
              key={rc.label}
              label={rc.label}
              icon={rc.icon}
              value={resourceValues[rc.label]}
              max={1200}
              color={rc.color}
            />
          ))}
        </div>

        {/* Most Active Agents */}
        {topAgents.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider mb-2">
              Most Active Agents
            </div>
            <div className="space-y-1">
              {topAgents.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <span className="text-xs text-fg-3 font-medium w-4">
                    {idx + 1}
                  </span>
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: PERSONALITY_COLORS[agent.personality],
                    }}
                  />
                  <span className="text-xs font-mono text-fg-2">
                    #{agent.id.split("-").pop()}
                  </span>
                  <span className="text-xs text-fg-3 capitalize">
                    {agent.personality}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-fg-3">
                    {agent.trades} trades
                  </span>
                  <div className="w-12 h-1.5 bg-edge-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalAgentTrades > 0 ? (agent.trades / totalAgentTrades) * 100 : 0}%`,
                        backgroundColor:
                          agent.successRate >= 50 ? "#22c55e" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequent Symbols */}
        {activeSymbols.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-fg-2 uppercase tracking-wider mb-2">
              Frequent Symbols
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSymbols.map(([sym, count]) => {
                const sr = getSymbolSuccessRate(civ.symbolMemory, sym);
                return (
                  <div
                    key={sym}
                    className="bg-subtle border border-edge-light px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <span className="text-lg">{sym}</span>
                    <span className="text-xs text-fg-3 tabular-nums">
                      {count} · {(sr * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
