import {
  OpenAIProvider,
  AnthropicProvider,
  LocalProvider,
  createAIProvider,
} from "../src/ai-provider";
import { AICodeContextConfig } from "../src/types";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

describe("AI Providers", () => {
  const mockConfig: AICodeContextConfig = {
    aiProvider: "openai",
    apiKey: "test-api-key",
    model: "gpt-4",
    maxTokens: 2000,
    temperature: 0.3,
    autoCommitHook: false,
    includePatterns: [],
    excludePatterns: [],
    outputFormat: "markdown",
    updateReadme: true,
    languages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("OpenAIProvider", () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider(mockConfig);
    });

    it("should make successful API request", async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: "Test analysis result",
              },
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
          },
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await provider.analyzeCode("Test prompt", "Test code");

      expect(result.content).toBe("Test analysis result");
      expect(result.usage?.totalTokens).toBe(300);
      expect(mockAxios.post).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          model: "gpt-4",
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system", content: "Test prompt" }),
            expect.objectContaining({ role: "user", content: "Test code" }),
          ]),
          max_tokens: 2000,
          temperature: 0.3,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle API errors", async () => {
      const mockError = {
        response: {
          data: {
            error: {
              message: "API rate limit exceeded",
            },
          },
        },
      };

      mockAxios.post.mockRejectedValue(mockError);

      await expect(
        provider.analyzeCode("Test prompt", "Test code")
      ).rejects.toThrow("OpenAI API request failed: API rate limit exceeded");
    });
  });

  describe("AnthropicProvider", () => {
    let provider: AnthropicProvider;
    let anthropicConfig: AICodeContextConfig;

    beforeEach(() => {
      anthropicConfig = { ...mockConfig, aiProvider: "anthropic" };
      provider = new AnthropicProvider(anthropicConfig);
    });

    it("should make successful API request", async () => {
      const mockResponse = {
        data: {
          content: [
            {
              text: "Test analysis result",
            },
          ],
          usage: {
            input_tokens: 100,
            output_tokens: 200,
          },
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await provider.analyzeCode("Test prompt", "Test code");

      expect(result.content).toBe("Test analysis result");
      expect(result.usage?.totalTokens).toBe(300);
      expect(mockAxios.post).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          model: "gpt-4",
          max_tokens: 2000,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: "Test prompt\n\nTest code",
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          }),
        })
      );
    });
  });

  describe("LocalProvider", () => {
    let provider: LocalProvider;
    let localConfig: AICodeContextConfig;

    beforeEach(() => {
      localConfig = {
        ...mockConfig,
        aiProvider: "local",
        apiUrl: "http://localhost:11434/api/chat",
      };
      provider = new LocalProvider(localConfig);
    });

    it("should make successful API request to local endpoint", async () => {
      const mockResponse = {
        data: {
          message: {
            content: "Test local analysis result",
          },
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await provider.analyzeCode("Test prompt", "Test code");

      expect(result.content).toBe("Test local analysis result");
      expect(mockAxios.post).toHaveBeenCalledWith(
        "http://localhost:11434/api/chat",
        expect.objectContaining({
          model: "gpt-4",
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system", content: "Test prompt" }),
            expect.objectContaining({ role: "user", content: "Test code" }),
          ]),
          stream: false,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("createAIProvider", () => {
    it("should create OpenAI provider", () => {
      const provider = createAIProvider({
        ...mockConfig,
        aiProvider: "openai",
      });
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it("should create Anthropic provider", () => {
      const provider = createAIProvider({
        ...mockConfig,
        aiProvider: "anthropic",
      });
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it("should create Local provider", () => {
      const provider = createAIProvider({ ...mockConfig, aiProvider: "local" });
      expect(provider).toBeInstanceOf(LocalProvider);
    });

    it("should throw error for unsupported provider", () => {
      expect(() => {
        createAIProvider({ ...mockConfig, aiProvider: "unsupported" as any });
      }).toThrow("Unsupported AI provider: unsupported");
    });
  });
});
