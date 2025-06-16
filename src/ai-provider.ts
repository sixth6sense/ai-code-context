import axios, { AxiosResponse } from "axios";
import { AIProviderResponse, AICodeContextConfig } from "./types";

export abstract class AIProvider {
  protected config: AICodeContextConfig;

  constructor(config: AICodeContextConfig) {
    this.config = config;
  }

  abstract analyzeCode(
    prompt: string,
    code: string
  ): Promise<AIProviderResponse>;
  abstract generateDocumentation(
    prompt: string,
    code: string
  ): Promise<AIProviderResponse>;
  abstract summarizeChanges(
    prompt: string,
    changes: string
  ): Promise<AIProviderResponse>;
}

export class OpenAIProvider extends AIProvider {
  private apiUrl = "https://api.openai.com/v1/chat/completions";

  async analyzeCode(prompt: string, code: string): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async generateDocumentation(
    prompt: string,
    code: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async summarizeChanges(
    prompt: string,
    changes: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, changes);
  }

  private async makeRequest(
    prompt: string,
    content: string
  ): Promise<AIProviderResponse> {
    try {
      const response: AxiosResponse = await axios.post(
        this.apiUrl,
        {
          model: this.config.model || "gpt-4",
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: content,
            },
          ],
          max_tokens: this.config.maxTokens || 2000,
          temperature: this.config.temperature || 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(
        `OpenAI API request failed: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }
}

export class AnthropicProvider extends AIProvider {
  private apiUrl = "https://api.anthropic.com/v1/messages";

  async analyzeCode(prompt: string, code: string): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async generateDocumentation(
    prompt: string,
    code: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async summarizeChanges(
    prompt: string,
    changes: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, changes);
  }

  private async makeRequest(
    prompt: string,
    content: string
  ): Promise<AIProviderResponse> {
    try {
      const response: AxiosResponse = await axios.post(
        this.apiUrl,
        {
          model: this.config.model || "claude-3-sonnet-20240229",
          max_tokens: this.config.maxTokens || 2000,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\n${content}`,
            },
          ],
        },
        {
          headers: {
            "x-api-key": this.config.apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
        }
      );

      return {
        content: response.data.content[0].text,
        usage: {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens:
            response.data.usage.input_tokens +
            response.data.usage.output_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(
        `Anthropic API request failed: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }
}

export class LocalProvider extends AIProvider {
  private apiUrl: string;

  constructor(config: AICodeContextConfig) {
    super(config);
    this.apiUrl = config.apiUrl || "http://localhost:11434/api/chat";
  }

  async analyzeCode(prompt: string, code: string): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async generateDocumentation(
    prompt: string,
    code: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, code);
  }

  async summarizeChanges(
    prompt: string,
    changes: string
  ): Promise<AIProviderResponse> {
    return this.makeRequest(prompt, changes);
  }

  private async makeRequest(
    prompt: string,
    content: string
  ): Promise<AIProviderResponse> {
    try {
      const response: AxiosResponse = await axios.post(
        this.apiUrl,
        {
          model: this.config.model || "llama2",
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: content,
            },
          ],
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.message.content,
      };
    } catch (error: any) {
      throw new Error(
        `Local API request failed: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }
}

export function createAIProvider(config: AICodeContextConfig): AIProvider {
  switch (config.aiProvider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "local":
      return new LocalProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
  }
}
