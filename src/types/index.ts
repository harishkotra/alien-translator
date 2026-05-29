export const SYMBOLS = [
  "🟢",
  "🔺",
  "⚡",
  "🌙",
  "⬛",
  "⭐",
  "💧",
  "🌀",
  "🔷",
  "🔥",
] as const;
export type Symbol = (typeof SYMBOLS)[number];

export type ResourceType = "food" | "water" | "crystals" | "energy";

export interface Resources {
  food: number;
  water: number;
  crystals: number;
  energy: number;
}

export type Personality =
  | "cooperative"
  | "aggressive"
  | "cautious"
  | "curious"
  | "opportunistic";

export interface Memory {
  symbolsUsed: string;
  tradeResult: "success" | "failure";
  utility: number;
  round: number;
}

export interface Observation {
  resourceType: ResourceType;
  observation: string;
  round: number;
}

export interface Agent {
  id: string;
  civilizationId: string;
  personality: Personality;
  memory: Memory[];
  observations: Observation[];
}

export interface SymbolMemory {
  usageCount: Map<string, number>;
  successCount: Map<string, number>;
  lastUsed: Map<string, number>;
}

export interface Civilization {
  id: string;
  name: string;
  agents: Agent[];
  food: number;
  water: number;
  crystals: number;
  energy: number;
  symbolMemory: SymbolMemory;
}

export interface TradeOffer {
  food?: number;
  water?: number;
  crystals?: number;
  energy?: number;
}

export interface TradeExchange {
  round: number;
  alphaAgentId: string;
  betaAgentId: string;
  messages: { from: string; message: string }[];
  alphaOffer: TradeOffer;
  betaOffer: TradeOffer;
  accepted: boolean;
  alphaUtility: number;
  betaUtility: number;
}

export interface SymbolHypothesis {
  symbol: string;
  likelyMeaning: string;
  confidence: number;
  evidenceCount: number;
}

export interface SimulationConfig {
  provider: "featherless" | "lmstudio" | "openai" | "";
  featherlessApiKey?: string;
  featherlessBaseUrl?: string;
  lmstudioBaseUrl?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  modelName?: string;
  roundsPerSecond: number;
  agentsPerCivilization: number;
}

export interface Metrics {
  round: number;
  tradeSuccessRate: number;
  averageMessageLength: number;
  languageEntropy: number;
  symbolDiversity: number;
  resourceEfficiency: number;
  economicGrowth: number;
}

export interface CommsMessage {
  round: number;
  from: string;
  civilizationId: string;
  message: string;
}

export function createDefaultResources(): Resources {
  return { food: 0, water: 0, crystals: 0, energy: 0 };
}

export function deepCloneResources(r: Resources): Resources {
  return { ...r };
}
