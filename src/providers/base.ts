import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export abstract class BaseProvider {
  abstract get modelName(): string;
  abstract call(prompt: string): Promise<string>;
}

export class OpenAIProvider extends BaseProvider {
  private llm: ChatOpenAI;
  public modelName: string;

  constructor(apiKey: string, baseUrl?: string, modelName?: string) {
    super();
    this.modelName = modelName || "gpt-4o-mini";
    this.llm = new ChatOpenAI({
      apiKey,
      modelName: this.modelName,
      configuration: {
        baseURL: baseUrl || "https://api.openai.com/v1",
      },
      temperature: 0.8,
    });
  }

  async call(prompt: string): Promise<string> {
    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    if (typeof response.content === "string") return response.content;
    if (Array.isArray(response.content)) {
      return response.content
        .map((b) => (typeof b === "object" && b && "text" in b ? b.text : ""))
        .join("");
    }
    return "";
  }
}

export class FeatherlessProvider extends BaseProvider {
  private llm: ChatOpenAI;
  public modelName: string;

  constructor(apiKey: string, baseUrl?: string, modelName?: string) {
    super();
    this.modelName = modelName || "meta-llama/Llama-3.3-70B-Instruct";
    this.llm = new ChatOpenAI({
      apiKey,
      modelName: this.modelName,
      configuration: {
        baseURL: baseUrl || "https://api.featherless.ai/v1",
      },
      temperature: 0.8,
    });
  }

  async call(prompt: string): Promise<string> {
    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    if (typeof response.content === "string") return response.content;
    if (Array.isArray(response.content)) {
      return response.content
        .map((b) => (typeof b === "object" && b && "text" in b ? b.text : ""))
        .join("");
    }
    return "";
  }
}

export class LMStudioProvider extends BaseProvider {
  private llm: ChatOpenAI;
  public modelName: string;

  constructor(baseUrl?: string, modelName?: string) {
    super();
    this.modelName = modelName || "local-model";
    this.llm = new ChatOpenAI({
      apiKey: "not-needed",
      modelName: this.modelName,
      configuration: {
        baseURL: (baseUrl || "http://localhost:1234") + "/v1",
      },
      temperature: 0.8,
    });
  }

  async call(prompt: string): Promise<string> {
    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    if (typeof response.content === "string") return response.content;
    if (Array.isArray(response.content)) {
      return response.content
        .map((b) => (typeof b === "object" && b && "text" in b ? b.text : ""))
        .join("");
    }
    return "";
  }
}
