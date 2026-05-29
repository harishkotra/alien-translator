import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { DynamicTool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import type {
  SimulationConfig,
  Civilization,
  Personality,
} from "../types/index.ts";
import {
  messagePrompt,
  tradeEvalPrompt,
  AGENT_TRADE_PROMPT,
} from "./prompts.ts";

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenceMatch) {
    try {
      JSON.parse(fenceMatch[1]);
      return fenceMatch[1];
    } catch {}
  }
  const braceStart = trimmed.indexOf("{");
  if (braceStart === -1) return trimmed;
  let depth = 0;
  for (let i = braceStart; i < trimmed.length; i++) {
    if (trimmed[i] === "{") depth++;
    else if (trimmed[i] === "}") depth--;
    if (depth === 0) return trimmed.slice(braceStart, i + 1);
  }
  return trimmed;
}

class LenientJsonParser extends JsonOutputParser {
  async parse(text: string): Promise<object> {
    try {
      return await super.parse(text);
    } catch {
      const extracted = extractJson(text);
      if (!extracted) return { message: "" };
      try {
        return JSON.parse(extracted);
      } catch {
        return { message: "" };
      }
    }
  }
}

const SYMBOLS = [
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

// --- Model Factory ---
function createChatModel(config: SimulationConfig) {
  const baseConfig: Record<string, unknown> = {
    temperature: 0.8,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  };

  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({
        ...baseConfig,
        model: config.modelName || "gpt-4o-mini",
        apiKey:
          config.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY || "",
      });
    case "featherless":
      return new ChatOpenAI({
        ...baseConfig,
        model: config.modelName || "meta-llama/Llama-3.3-70B-Instruct",
        apiKey: config.featherlessApiKey || "",
        configuration: { baseURL: "https://api.featherless.ai/v1" },
      });
    case "lmstudio":
      return new ChatOpenAI({
        ...baseConfig,
        model: config.modelName || "local-model",
        apiKey: "not-needed",
        configuration: {
          baseURL: (config.lmstudioBaseUrl || "http://localhost:1234") + "/v1",
        },
      });
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ================================================================
// Pattern 1: ChatPromptTemplate → Model → JsonOutputParser chain
// Used for: generating agent messages
// ================================================================

export function createMessageChain(config: SimulationConfig) {
  const model = createChatModel(config);
  const parser = new LenientJsonParser();
  return messagePrompt.pipe(model).pipe(parser);
}

export async function generateMessage(
  config: SimulationConfig,
  personality: Personality,
  recentSuccesses: string[],
  recentFailures: string[],
  observations: string[],
  messageHistory: { from: string; message: string }[],
): Promise<string> {
  const chain = createMessageChain(config);
  const obsStr =
    observations.length > 0
      ? observations.map((o) => `${o}`).join(". ")
      : "Resources seem stable";
  const histStr =
    messageHistory.length > 0
      ? messageHistory.map((m) => `${m.from}: ${m.message}`).join("\n")
      : "No prior messages";

  try {
    const result = await chain.invoke({
      personality,
      observations: obsStr,
      successes:
        recentSuccesses.length > 0 ? recentSuccesses.join(", ") : "None yet",
      failures:
        recentFailures.length > 0 ? recentFailures.join(", ") : "None yet",
      history: histStr,
    });

    if (result && typeof result.message === "string" && result.message)
      return result.message;
  } catch {
    // model returned empty or non-JSON — fall back to random symbol
  }

  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

// ================================================================
// Pattern 2: Simple Prompt → Model → Structured Output chain
// Used for: lightweight trade evaluation (no tool-calling)
// ================================================================

export function createTradeEvalChain(config: SimulationConfig) {
  const model = createChatModel(config);
  const parser = new LenientJsonParser();
  return tradeEvalPrompt.pipe(model).pipe(parser);
}

export async function evaluateTradeSimple(
  config: SimulationConfig,
  personality: Personality,
  offer: Record<string, number | undefined>,
  request: Record<string, number | undefined>,
  observations: string[],
): Promise<boolean> {
  const chain = createTradeEvalChain(config);
  const obsStr =
    observations.length > 0 ? observations.join(". ") : "Resources seem stable";

  try {
    const result = await chain.invoke({
      personality,
      observations: obsStr,
      offer: JSON.stringify(offer),
      request: JSON.stringify(request),
    });

    if (typeof result.accept === "boolean") return result.accept;
  } catch {
    // fall through to random
  }

  return Math.random() > 0.5;
}

// ================================================================
// Pattern 3: createAgent (LangGraph ReAct) with DynamicTool
// Used for: agent-driven trade evaluation with resource inspection
// Demonstrates the LangChain v1.x agent SDK
// ================================================================

export async function evaluateTradeWithAgent(
  config: SimulationConfig,
  civ: Civilization,
  personality: Personality,
  offer: Record<string, number | undefined>,
  request: Record<string, number | undefined>,
  observations: string[],
): Promise<boolean> {
  const model = createChatModel(config);
  const obsStr =
    observations.length > 0 ? observations.join(". ") : "Resources seem stable";

  const resourceTool = new DynamicTool({
    name: "inspect_resources",
    description:
      "Inspect your civilization's current resource levels. Returns JSON with food, water, crystals, energy values.",
    func: async () => {
      await new Promise((r) => setTimeout(r, 10));
      return JSON.stringify({
        food: Math.round(civ.food),
        water: Math.round(civ.water),
        crystals: Math.round(civ.crystals),
        energy: Math.round(civ.energy),
      });
    },
  });

  const impactTool = new DynamicTool({
    name: "evaluate_trade_impact",
    description:
      "Calculate the net resource impact of a proposed trade. Returns JSON with give, receive, and net change.",
    func: async () => {
      await new Promise((r) => setTimeout(r, 10));
      const given = Object.values(offer).reduce(
        (s: number, v) => s + (v || 0),
        0,
      );
      const received = Object.values(request).reduce(
        (s: number, v) => s + (v || 0),
        0,
      );
      return JSON.stringify({
        give: offer,
        receive: request,
        netResourceChange: received - given,
      });
    },
  });

  try {
    const promptText = AGENT_TRADE_PROMPT.replace("{personality}", personality)
      .replace("{observations}", obsStr)
      .replace("{offer}", JSON.stringify(offer))
      .replace("{request}", JSON.stringify(request));

    const agent = createAgent({
      model,
      tools: [resourceTool, impactTool],
      systemPrompt: promptText,
    });

    const result = await agent.invoke({
      messages: [
        {
          role: "user" as const,
          content:
            "Should you accept this trade? Use the available tools to inspect your resources and evaluate the trade impact before deciding.",
        },
      ],
    });

    const lastMsg = result.messages?.[result.messages.length - 1];
    const output =
      typeof lastMsg?.content === "string" ? lastMsg.content.toUpperCase() : "";
    return output.includes("ACCEPT");
  } catch (e) {
    console.error("Trade agent failed:", e);
    return Math.random() > 0.5;
  }
}
