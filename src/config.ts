import * as fs from "fs-extra";
import * as path from "path";
import { AICodeContextConfig } from "./types";

const DEFAULT_CONFIG: AICodeContextConfig = {
  aiProvider: "openai",
  model: "gpt-4",
  maxTokens: 2000,
  temperature: 0.3,
  autoCommitHook: false,
  includePatterns: [
    "**/*.js",
    "**/*.ts",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.py",
    "**/*.java",
    "**/*.cpp",
    "**/*.c",
    "**/*.h",
  ],
  excludePatterns: [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".git/**",
    "**/*.test.*",
    "**/*.spec.*",
  ],
  outputFormat: "both",
  updateReadme: true,
  readmePath: "README.md",
  languages: ["javascript", "typescript", "python", "java", "cpp", "c"],
  customPrompts: {
    codeAnalysis: `Analyze this code change and provide:
1. A clear summary of what the code does
2. The purpose and business value
3. Key technical changes made
4. Potential impact on the system
5. Any concerns or suggestions for improvement

Be concise but comprehensive. Focus on helping other developers understand the change quickly.`,
    documentation: `Generate clear, helpful documentation for this code that includes:
1. What this code does (functionality)
2. Why it exists (purpose/business need)
3. How to use it (if applicable)
4. Important implementation details
5. Any dependencies or prerequisites

Write for developers who haven't seen this code before.`,
    summary: `Provide a brief, one-paragraph summary of this code change that would be useful in a commit message or pull request description.`,
  },
};

export class ConfigManager {
  private configPath: string;
  private config: AICodeContextConfig;

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = path.join(projectRoot, ".aicontext.json");
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(): Promise<AICodeContextConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const userConfig = await fs.readJson(this.configPath);
        this.config = { ...DEFAULT_CONFIG, ...userConfig };
      }
    } catch (error) {
      console.warn("Warning: Could not load config file, using defaults");
    }
    return this.config;
  }

  async save(config: Partial<AICodeContextConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await fs.ensureFile(this.configPath);
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
  }

  get(): AICodeContextConfig {
    return this.config;
  }

  getApiKey(): string {
    return (
      this.config.apiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      ""
    );
  }

  async createDefaultConfig(): Promise<void> {
    await fs.ensureFile(this.configPath);
    await fs.writeJson(this.configPath, DEFAULT_CONFIG, { spaces: 2 });
  }

  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.getApiKey()) {
      errors.push(
        "API key is required. Set it in .aicontext.json or as environment variable (OPENAI_API_KEY or ANTHROPIC_API_KEY)"
      );
    }

    if (!["openai", "anthropic", "local"].includes(this.config.aiProvider)) {
      errors.push("aiProvider must be one of: openai, anthropic, local");
    }

    if (
      this.config.maxTokens &&
      (this.config.maxTokens < 100 || this.config.maxTokens > 8000)
    ) {
      errors.push("maxTokens should be between 100 and 8000");
    }

    if (
      this.config.temperature &&
      (this.config.temperature < 0 || this.config.temperature > 1)
    ) {
      errors.push("temperature should be between 0 and 1");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
