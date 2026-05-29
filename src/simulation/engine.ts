import type {
  Civilization,
  Agent,
  TradeExchange,
  SymbolHypothesis,
  Metrics,
  SimulationConfig,
  CommsMessage,
  Personality,
  Resources,
  ResourceType,
} from "../types/index.ts";
import { SYMBOLS } from "../types/index.ts";
import { generateAgentMessage, evaluateTradeProposal } from "./agent.ts";
import {
  generateTradeOffer,
  executeTrade,
  computeTradeUtility,
} from "./trade.ts";
import {
  recordSymbolUsage,
  getRecentSuccessfulSymbols,
  getRecentFailedSymbols,
  createSymbolMemory,
} from "./memory.ts";
import { analyzeSymbols } from "./analyzer.ts";

const PERSONALITIES: Personality[] = [
  "cooperative",
  "aggressive",
  "cautious",
  "curious",
  "opportunistic",
];

function generateObservations(
  civ: Civilization,
): { resourceType: ResourceType; observation: string; round: number }[] {
  const obs: {
    resourceType: ResourceType;
    observation: string;
    round: number;
  }[] = [];
  if (civ.food < 200)
    obs.push({ resourceType: "food", observation: "scarce", round: 0 });
  else if (civ.food > 800)
    obs.push({ resourceType: "food", observation: "abundant", round: 0 });
  else obs.push({ resourceType: "food", observation: "stable", round: 0 });

  if (civ.water < 200)
    obs.push({ resourceType: "water", observation: "scarce", round: 0 });
  else if (civ.water > 800)
    obs.push({ resourceType: "water", observation: "abundant", round: 0 });
  else obs.push({ resourceType: "water", observation: "stable", round: 0 });

  if (civ.crystals < 200)
    obs.push({ resourceType: "crystals", observation: "scarce", round: 0 });
  else if (civ.crystals > 800)
    obs.push({ resourceType: "crystals", observation: "abundant", round: 0 });
  else obs.push({ resourceType: "crystals", observation: "stable", round: 0 });

  if (civ.energy < 200)
    obs.push({ resourceType: "energy", observation: "scarce", round: 0 });
  else if (civ.energy > 800)
    obs.push({ resourceType: "energy", observation: "abundant", round: 0 });
  else obs.push({ resourceType: "energy", observation: "stable", round: 0 });

  return obs;
}

function randomResources(): Resources {
  return {
    food: Math.floor(Math.random() * 900) + 100,
    water: Math.floor(Math.random() * 900) + 100,
    crystals: Math.floor(Math.random() * 900) + 100,
    energy: Math.floor(Math.random() * 900) + 100,
  };
}

export interface SimulationSnapshot {
  alpha: Civilization;
  beta: Civilization;
  trades: TradeExchange[];
  hypotheses: SymbolHypothesis[];
  metrics: Metrics[];
  commsMessages: CommsMessage[];
  round: number;
  running: boolean;
}

export class SimulationEngine {
  alpha: Civilization;
  beta: Civilization;
  trades: TradeExchange[] = [];
  hypotheses: SymbolHypothesis[] = [];
  metricsHistory: Metrics[] = [];
  commsMessages: CommsMessage[] = [];
  round: number = 0;
  running: boolean = false;
  config: SimulationConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onUpdate: ((snap: SimulationSnapshot) => void) | null = null;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.alpha = this.createCivilization(
      "alpha",
      "Civilization Alpha",
      config.agentsPerCivilization,
    );
    this.beta = this.createCivilization(
      "beta",
      "Civilization Beta",
      config.agentsPerCivilization,
    );
    this.alpha.food = 1000;
    this.alpha.water = 100;
    this.alpha.crystals = 900;
    this.alpha.energy = 300;
    this.beta.food = 100;
    this.beta.water = 900;
    this.beta.crystals = 100;
    this.beta.energy = 1200;
  }

  private createCivilization(
    id: string,
    name: string,
    agentCount: number,
  ): Civilization {
    const agents: Agent[] = [];
    for (let i = 0; i < agentCount; i++) {
      agents.push({
        id: `${id}-agent-${i}`,
        civilizationId: id,
        personality:
          PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        memory: [],
        observations: [],
      });
    }
    const res = randomResources();
    return {
      id,
      name,
      agents,
      food: res.food,
      water: res.water,
      crystals: res.crystals,
      energy: res.energy,
      symbolMemory: createSymbolMemory(),
    };
  }

  private computeMetrics(): Metrics {
    const trades = this.trades.slice(-50);
    const totalTrades = trades.length;
    const successful = trades.filter((t) => t.accepted).length;
    const successRate = totalTrades > 0 ? successful / totalTrades : 0;

    const avgLen =
      trades.length > 0
        ? trades.reduce((sum, t) => {
            const lens = t.messages.map((m) => m.message.length);
            return (
              sum +
              (lens.length > 0
                ? lens.reduce((a, b) => a + b, 0) / lens.length
                : 0)
            );
          }, 0) / trades.length
        : 0;

    const allMessages = trades.flatMap((t) => t.messages.map((m) => m.message));
    const entropy =
      allMessages.length > 0
        ? (-new Set(allMessages).size / allMessages.length) *
          Math.log2(new Set(allMessages).size / allMessages.length + 0.001)
        : 0;

    const uniqueSymbols = new Set(allMessages.flatMap((m) => [...m])).size;
    const diversity = SYMBOLS.length > 0 ? uniqueSymbols / SYMBOLS.length : 0;

    const totalAlpha =
      this.alpha.food +
      this.alpha.water +
      this.alpha.crystals +
      this.alpha.energy;
    const totalBeta =
      this.beta.food + this.beta.water + this.beta.crystals + this.beta.energy;
    const total = totalAlpha + totalBeta;
    const initialTotal = 1100 + 1100 + 1000 + 1500; // rough starting
    const growth = initialTotal > 0 ? (total - initialTotal) / initialTotal : 0;

    return {
      round: this.round,
      tradeSuccessRate: Math.round(successRate * 10000) / 100,
      averageMessageLength: Math.round(avgLen * 100) / 100,
      languageEntropy: Math.round(entropy * 100) / 100,
      symbolDiversity: Math.round(diversity * 100) / 100,
      resourceEfficiency:
        Math.round((successful / (totalTrades || 1)) * 10000) / 100,
      economicGrowth: Math.round(growth * 10000) / 100,
    };
  }

  private async runTradeRound(): Promise<void> {
    const alphaAgent =
      this.alpha.agents[Math.floor(Math.random() * this.alpha.agents.length)];
    const betaAgent =
      this.beta.agents[Math.floor(Math.random() * this.beta.agents.length)];

    const alphaSuccesses = getRecentSuccessfulSymbols(
      this.alpha.symbolMemory,
      this.round,
    );
    const alphaFailures = getRecentFailedSymbols(
      this.alpha.symbolMemory,
      this.round,
    );
    const betaSuccesses = getRecentSuccessfulSymbols(
      this.beta.symbolMemory,
      this.round,
    );
    const betaFailures = getRecentFailedSymbols(
      this.beta.symbolMemory,
      this.round,
    );

    const alphaObs = generateObservations(this.alpha);
    const betaObs = generateObservations(this.beta);

    const messages: { from: string; message: string }[] = [];
    const maxExchanges = 3;

    for (let i = 0; i < maxExchanges; i++) {
      if (i % 2 === 0) {
        const msg = await generateAgentMessage(
          this.config,
          alphaAgent.personality,
          alphaSuccesses,
          alphaFailures,
          alphaObs,
          messages,
        );
        messages.push({ from: alphaAgent.id, message: msg });
        this.commsMessages.push({
          round: this.round,
          from: alphaAgent.id,
          civilizationId: "alpha",
          message: msg,
        });
      } else {
        const msg = await generateAgentMessage(
          this.config,
          betaAgent.personality,
          betaSuccesses,
          betaFailures,
          betaObs,
          messages,
        );
        messages.push({ from: betaAgent.id, message: msg });
        this.commsMessages.push({
          round: this.round,
          from: betaAgent.id,
          civilizationId: "beta",
          message: msg,
        });
      }
    }

    if (this.commsMessages.length > 200) {
      this.commsMessages = this.commsMessages.slice(-150);
    }

    const alphaTrade = generateTradeOffer(this.alpha);
    const betaTrade = generateTradeOffer(this.beta);

    const alphaAccept = await evaluateTradeProposal(
      this.config,
      alphaAgent.personality,
      alphaTrade.offer,
      alphaTrade.request,
      alphaObs.map((o) => o.observation),
    );
    const betaAccept = await evaluateTradeProposal(
      this.config,
      betaAgent.personality,
      betaTrade.offer,
      betaTrade.request,
      betaObs.map((o) => o.observation),
    );

    const accepted = alphaAccept && betaAccept;

    if (accepted) {
      executeTrade(this.alpha, this.beta, alphaTrade.offer, betaTrade.offer);
    }

    const { alphaUtility, betaUtility } = computeTradeUtility(
      this.alpha,
      this.beta,
      alphaTrade.offer,
      betaTrade.offer,
      accepted,
    );

    const symbolsTried = [...new Set(messages.map((m) => m.message))];
    for (const sym of symbolsTried) {
      recordSymbolUsage(this.alpha.symbolMemory, sym, accepted, this.round);
      recordSymbolUsage(this.beta.symbolMemory, sym, accepted, this.round);
    }

    const tradeExchange: TradeExchange = {
      round: this.round,
      alphaAgentId: alphaAgent.id,
      betaAgentId: betaAgent.id,
      messages,
      alphaOffer: alphaTrade.offer,
      betaOffer: betaTrade.offer,
      accepted,
      alphaUtility,
      betaUtility,
    };

    this.trades.push(tradeExchange);

    alphaAgent.memory.push({
      symbolsUsed: symbolsTried.join(","),
      tradeResult: accepted ? "success" : "failure",
      utility: alphaUtility,
      round: this.round,
    });
    betaAgent.memory.push({
      symbolsUsed: symbolsTried.join(","),
      tradeResult: accepted ? "success" : "failure",
      utility: betaUtility,
      round: this.round,
    });

    if (alphaAgent.memory.length > 50)
      alphaAgent.memory = alphaAgent.memory.slice(-50);
    if (betaAgent.memory.length > 50)
      betaAgent.memory = betaAgent.memory.slice(-50);

    if (this.round % 20 === 0 && this.trades.length > 0) {
      this.hypotheses = analyzeSymbols(this.trades, this.hypotheses);
    }

    this.metricsHistory.push(this.computeMetrics());
    if (this.metricsHistory.length > 500) {
      this.metricsHistory = this.metricsHistory.slice(-500);
    }

    if (this.trades.length > 1000) {
      this.trades = this.trades.slice(-500);
    }
  }

  async step(): Promise<void> {
    try {
      this.round++;
      await this.runTradeRound();
    } catch (e) {
      console.error("Round failed:", e);
      this.metricsHistory.push({
        round: this.round,
        tradeSuccessRate: 0,
        averageMessageLength: 0,
        languageEntropy: 0,
        symbolDiversity: 0,
        resourceEfficiency: 0,
        economicGrowth: 0,
      });
    }
    if (this.onUpdate) {
      this.onUpdate(this.getSnapshot());
    }
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    await this.step();
    if (this.running) {
      const msPerRound = 1000 / this.config.roundsPerSecond;
      this.timer = setTimeout(
        () => this.tick(),
        msPerRound,
      ) as unknown as ReturnType<typeof setInterval>;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.onUpdate) this.onUpdate(this.getSnapshot());
    this.tick();
  }

  pause(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.onUpdate) this.onUpdate(this.getSnapshot());
  }

  setUpdateCallback(cb: (snap: SimulationSnapshot) => void): void {
    this.onUpdate = cb;
  }

  reset(config?: SimulationConfig): void {
    this.pause();
    if (config) this.config = config;
    this.alpha = this.createCivilization(
      "alpha",
      "Civilization Alpha",
      this.config.agentsPerCivilization,
    );
    this.beta = this.createCivilization(
      "beta",
      "Civilization Beta",
      this.config.agentsPerCivilization,
    );
    this.alpha.food = 1000;
    this.alpha.water = 100;
    this.alpha.crystals = 900;
    this.alpha.energy = 300;
    this.beta.food = 100;
    this.beta.water = 900;
    this.beta.crystals = 100;
    this.beta.energy = 1200;
    this.trades = [];
    this.hypotheses = [];
    this.metricsHistory = [];
    this.commsMessages = [];
    this.round = 0;
    if (this.onUpdate) this.onUpdate(this.getSnapshot());
  }

  getSnapshot(): SimulationSnapshot {
    return {
      alpha: this.alpha,
      beta: this.beta,
      trades: this.trades,
      hypotheses: this.hypotheses,
      metrics: this.metricsHistory,
      commsMessages: this.commsMessages,
      round: this.round,
      running: this.running,
    };
  }
}
