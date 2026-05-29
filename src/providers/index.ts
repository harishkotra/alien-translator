import type { SimulationConfig } from "../types/index.ts";
import {
  OpenAIProvider,
  FeatherlessProvider,
  LMStudioProvider,
  type BaseProvider,
} from "./base.ts";

let providerInstance: BaseProvider | null = null;

export function getProvider(config: SimulationConfig): BaseProvider {
  if (providerInstance) return providerInstance;

  switch (config.provider) {
    case "featherless": {
      const key =
        config.featherlessApiKey ||
        import.meta.env.VITE_FEATHERLESS_API_KEY ||
        "";
      const base =
        config.featherlessBaseUrl ||
        import.meta.env.VITE_FEATHERLESS_BASE_URL ||
        "https://api.featherless.ai/v1";
      providerInstance = new FeatherlessProvider(key, base, config.modelName);
      break;
    }
    case "lmstudio": {
      const base =
        config.lmstudioBaseUrl ||
        import.meta.env.VITE_LMSTUDIO_BASE_URL ||
        "http://localhost:1234";
      providerInstance = new LMStudioProvider(base, config.modelName);
      break;
    }
    case "openai": {
      const key =
        config.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY || "";
      const base =
        config.openaiBaseUrl ||
        import.meta.env.VITE_OPENAI_BASE_URL ||
        "https://api.openai.com/v1";
      providerInstance = new OpenAIProvider(key, base, config.modelName);
      break;
    }
  }
  return providerInstance!;
}

export function resetProvider(): void {
  providerInstance = null;
}
