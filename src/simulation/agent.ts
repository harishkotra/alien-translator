import type {
  SimulationConfig,
  Observation,
  Personality,
} from "../types/index.ts";
import {
  generateMessage,
  evaluateTradeSimple,
} from "../agents/orchestrator.ts";

/**
 * Uses LangChain ChatPromptTemplate → Model → JsonOutputParser pipeline.
 * Demonstrates Pattern 1: prompt template chaining with structured output.
 */
export async function generateAgentMessage(
  config: SimulationConfig,
  personality: Personality,
  recentSuccesses: string[],
  recentFailures: string[],
  observations: Observation[],
  messageHistory: { from: string; message: string }[],
): Promise<string> {
  return generateMessage(
    config,
    personality,
    recentSuccesses,
    recentFailures,
    observations.map((o) => `${o.resourceType} is ${o.observation}`),
    messageHistory,
  );
}

/**
 * Uses LangChain ChatPromptTemplate → Model → JsonOutputParser pipeline.
 * Demonstrates Pattern 2: structured output parsing from prompt chains.
 *
 * For a more advanced approach (Pattern 3: AgentExecutor with tools),
 * see evaluateTradeWithAgent in agents/orchestrator.ts.
 */
export async function evaluateTradeProposal(
  config: SimulationConfig,
  personality: Personality,
  offer: { food?: number; water?: number; crystals?: number; energy?: number },
  request: {
    food?: number;
    water?: number;
    crystals?: number;
    energy?: number;
  },
  observations: string[],
): Promise<boolean> {
  return evaluateTradeSimple(config, personality, offer, request, observations);
}
