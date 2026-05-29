# 👽 Alien Translator

**Two civilizations of AI agents building a shared language from scratch — powered by LangChain.**

Watch as 100 agents (50 per civilization) negotiate trades using abstract symbols. Every thought, every message, every trade decision flows through LangChain SDK pipelines — `ChatPromptTemplate`, `JsonOutputParser`, `createAgent()` (ReAct), and `DynamicTool`. Successful deals reinforce meaning; failed trades weaken it. Over hundreds of rounds, a common vocabulary emerges through pure reinforcement.

<img width="1922" height="1214" alt="alien-translator-1" src="https://github.com/user-attachments/assets/fdf3bad4-ea92-43f7-a210-162b2ece8b28" />
<img width="1922" height="1214" alt="alien-translator-2" src="https://github.com/user-attachments/assets/bd46c232-beac-4665-b887-784cf9e58d6d" />
<img width="1922" height="1214" alt="alien-translator-3" src="https://github.com/user-attachments/assets/fd48220f-7f77-4913-9be3-2fdd4cfeef14" />
<img width="1922" height="1773" alt="alien-translator-4" src="https://github.com/user-attachments/assets/2f1fab68-a820-4421-91dd-54853fbaae6b" />


---

## Why LangChain Is the Core

This is not a hardcoded simulation. Every agent interaction runs through real LangChain patterns:

| Pattern | LangChain Component | What It Does |
|---|---|---|
| **1** | `ChatPromptTemplate` → `ChatOpenAI` → `JsonOutputParser` (`RunnableSequence.pipe()`) | Generates symbol messages from personality, observations, and conversation history |
| **2** | `ChatPromptTemplate` → `ChatOpenAI` → `JsonOutputParser` | Evaluates trade proposals — returns `{"accept": true/false}` |
| **3** | `createAgent()` + `DynamicTool` (LangGraph ReAct) | Full agent loop — inspects resources, calculates trade impact, decides |

No mock data. No hardcoded symbol meanings. Every decision is a real LLM call through LangChain.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React UI (Vite)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ SplitView │  │CommsPanel│  │Dictionary│  │ Metrics │ │
│  │ (Civ A/B) │  │ (Timeline)│  │  Panel   │  │  Panel  │ │
│  └─────┬─────┘  └─────┬────┘  └────┬─────┘  └────┬────┘ │
│        │              │            │              │       │
│        └──────────────┴────────────┴──────────────┘       │
│                          │                                │
│                    SimulationSnapshot                      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   Simulation Engine                       │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐  │
│  │  Agent   │  │   Trade   │  │ Memory │  │  Analyzer   │  │
│  │  System  │  │  Engine   │  │ System │  │  Dictionary │  │
│  └────┬────┘  └────┬─────┘  └────┬───┘  └──────┬─────┘  │
│       │            │              │              │         │
│       └────────────┴──────────────┴──────────────┘         │
│                           │                                │
└───────────────────────────┼────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              LangChain Agent Layer (src/agents/)         │
│                                                           │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Pattern 1     │  │  Pattern 2   │  │  Pattern 3   │  │
│  │  ChatPrompt    │  │  ChatPrompt  │  │  createAgent │  │
│  │  Template      │  │  Template    │  │  (ReAct)     │  │
│  │    →Model      │  │    →Model    │  │  +           │  │
│  │    →JsonOutput │  │    →JsonOut  │  │  DynamicTool │  │
│  │  Parser        │  │  put Parser  │  │              │  │
│  │  (messages)    │  │  (trade eval)│  │  (agent loop)│  │
│  └───────┬────────┘  └──────┬───────┘  └──────┬───────┘  │
│          │                  │                  │           │
│          └──────────────────┴──────────────────┘           │
│                             │                              │
└─────────────────────────────┼────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────┐
│              LLM Provider Layer                          │
│  (All backed by ChatOpenAI via @langchain/openai)        │
│                                                           │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────┐     │
│  │  OpenAI  │  │Featherless │  │   LM Studio      │     │
│  │ (ChatOpen│  │(ChatOpenAI)│  │ (ChatOpenAI-     │     │
│  │  AI)     │  │            │  │  compat)         │     │
│  └──────────┘  └────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Technologies

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript 6 |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS 4 + CSS custom properties |
| **Charts** | Recharts 3 |
| **LLM Interface** | LangChain.js SDK (v1.4) — ChatPromptTemplate, JsonOutputParser, createAgent (ReAct), DynamicTool |
| **LLM Providers** | OpenAI (ChatOpenAI), Featherless.ai (ChatOpenAI), LM Studio (ChatOpenAI-compat) |
| **State** | React hooks (useState, useRef, useCallback) |
| **Persistence** | IndexedDB via idb |
| **Design** | Custom theme system with dark/light mode |

---

## 🧩 Code Walkthrough

### LangChain Agent Layer (`src/agents/`)

Every LLM interaction flows through LangChain SDK components. Three distinct patterns demonstrate real LangChain usage:

#### Pattern 1: `ChatPromptTemplate` → Model → `JsonOutputParser` (Message Generation)

```typescript
// src/agents/prompts.ts
// {{ escapes LangChain's {} template syntax for literal JSON output
export const MESSAGE_SYSTEM_PROMPT = `You are a {personality} member...
Return ONLY valid JSON: {{"message": "<your symbols>"}}`;

export const messagePrompt = ChatPromptTemplate.fromMessages([
  ["system", MESSAGE_SYSTEM_PROMPT],
  ["human", "Generate your next communication. Respond with JSON."],
]);

// src/agents/orchestrator.ts
export function createMessageChain(config: SimulationConfig) {
  const model = createChatModel(config);           // ChatOpenAI
  const parser = new LenientJsonParser();            // Handles markdown fences
  return messagePrompt.pipe(model).pipe(parser);     // RunnableSequence
}

const result = await chain.invoke({
  personality: "cooperative",
  observations: "food is scarce, water is abundant",
  successes: "🟢⚡",
  failures: "🔺🌙",
  history: "alpha-agent: ⭐💧\nbeta-agent: 🟢",
});
// result = { message: "🟢⚡🔺" }
```

#### Pattern 2: Simple Chain for Trade Evaluation

```typescript
export const tradeEvalPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a {personality} alien trader...
Respond ONLY with JSON: {{"accept": true}} or {{"accept": false}}`],
  ["human", "Should you accept this trade?"],
]);

export async function evaluateTradeSimple(config, personality, offer, request, observations) {
  const chain = createTradeEvalChain(config);  // prompt → model → parser
  const result = await chain.invoke({ personality, observations, offer, request });
  return result.accept;  // boolean from parsed JSON
}
```

#### Pattern 3: `createAgent()` with `DynamicTool` (LangGraph ReAct Agent)

The most advanced pattern — a LangGraph-based ReAct agent that uses tools to inspect its environment:

```typescript
import { createAgent, DynamicTool } from "langchain";

const resourceTool = new DynamicTool({
  name: "inspect_resources",
  description: "Check current resource levels",
  func: async () => JSON.stringify({ food: civ.food, water: civ.water, ... }),
});

const impactTool = new DynamicTool({
  name: "evaluate_trade_impact",
  description: "Calculate net resource impact",
  func: async () => JSON.stringify({ give: offer, receive: request, netChange }),
});

const agent = createAgent({
  model,                    // ChatOpenAI instance
  tools: [resourceTool, impactTool],
  systemPrompt: promptText,
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "Should I accept this trade?" }],
});
```

### Custom JSON Parser

Models often wrap JSON in markdown code fences. A `LenientJsonParser` class extends `JsonOutputParser` to handle this:

```typescript
class LenientJsonParser extends JsonOutputParser {
  async parse(text: string): Promise<object> {
    try {
      return await super.parse(text);
    } catch {
      const extracted = extractJson(text);
      return JSON.parse(extracted);
    }
  }
}
```

### Simulation Engine Loop

Each round selects random agents, runs 3 symbol exchanges through LangChain, evaluates trades, and reinforces outcomes:

```typescript
private async runTradeRound(): Promise<void> {
  const alphaAgent = pickRandom(this.alpha.agents);
  const betaAgent = pickRandom(this.beta.agents);

  // 3 back-and-forth exchanges via Pattern 1 (ChatPromptTemplate chain)
  for (let i = 0; i < 3; i++) {
    const msg = await generateAgentMessage(config, personality, successes, failures, observations, messages);
    messages.push({ from: agent.id, message: msg });
  }

  // Both agents evaluate independently (Pattern 2 or 3)
  const alphaAccept = await evaluateTradeProposal(config, alphaAgent.personality, ...);
  const betaAccept = await evaluateTradeProposal(config, betaAgent.personality, ...);

  if (alphaAccept && betaAccept) executeTrade(alpha, beta, alphaOffer, betaOffer);

  // Reinforce or weaken symbol meanings
  for (const sym of symbolsTried) {
    recordSymbolUsage(alpha.symbolMemory, sym, accepted, round);
    recordSymbolUsage(beta.symbolMemory, sym, accepted, round);
  }
}
```

### Emergent Dictionary Analyzer

Every 20 rounds, the analyzer correlates symbols with resource flows to build hypotheses:

```typescript
export function analyzeSymbols(trades: TradeExchange[], existing: SymbolHypothesis[]): SymbolHypothesis[] {
  // For each symbol, track how often it appeared in accepted trades
  // and which resources flowed as a result
  // Higher correlation → higher confidence hypothesis

  // Example output:
  // { symbol: "🟢⚡", likelyMeaning: "energy request", confidence: 0.83 }
}
```

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/harishkotra/alien-translator.git
cd alien-translator

# Install
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Configure an LLM Provider

The app requires a real LLM provider. Open the **Settings** panel and configure one:

| Provider | Setup |
|---|---|
| **OpenAI** | Paste your `sk-...` API key |
| **Featherless** | Paste your Featherless API key |
| **LM Studio** | Run LM Studio locally (default: `http://localhost:1234`) |

All providers use `ChatOpenAI` from `@langchain/openai` — LM Studio works through its OpenAI-compatible endpoint.

---

## Contributing / Forking

This project is designed to be a foundation for emergent communication research:

- **Add a new personality** — extend the `Personality` type and adjust system prompts in `src/agents/prompts.ts`
- **Add a new resource** — extend `ResourceType` and add UI in `SplitView.tsx`
- **Swap the LLM provider** — all providers use the same `ChatOpenAI` interface

### Ideas for Future Work

- **Symbol evolution** — agents invent new symbols from combinations, growing the vocabulary
- **Spatial simulation** — agents on a grid where proximity influences trade frequency
- **Cultural drift** — isolated subgroups develop dialect variations
- **Deceptive agents** — a personality that deliberately misleads
- **Reputation system** — agents track trustworthiness
- **Multi-civilization** — 3+ civilizations with alliance dynamics
- **Grammar emergence** — symbol ordering patterns resembling syntax
- **Historical replay** — scrub through the timeline to watch language develop

---

## 📈 Performance

- **50 agents/civilization** — runs smoothly in the browser
- **Default 10 rounds/second** — configurable in settings
- **2–4 LLM calls per round** — optimized for cost efficiency
- **IndexedDB persistence** — simulation state survives page reloads

---

<p align="center">
  Built by <a href="https://harishkotra.me">Harish Kotra</a> ·
  <a href="https://dailybuild.xyz">Check out my other builds</a>
</p>
