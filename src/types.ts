export interface AICodeContextConfig {
  aiProvider: "openai" | "anthropic" | "local";
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  autoCommitHook?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  outputFormat?: "markdown" | "comments" | "both";
  updateReadme?: boolean;
  readmePath?: string;
  languages?: string[];
  customPrompts?: {
    codeAnalysis?: string;
    documentation?: string;
    summary?: string;
  };
}

export interface GitDiffResult {
  file: string;
  additions: number;
  deletions: number;
  changes: GitChange[];
  content?: string;
}

export interface GitChange {
  type: "addition" | "deletion" | "modification";
  lineNumber: number;
  content: string;
  context?: string[];
}

export interface AnalysisResult {
  file: string;
  language: string;
  summary: string;
  purpose: string;
  keyChanges: string[];
  impact: string;
  documentation: string;
  suggestions: string[];
}

export interface AIProviderResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProjectContext {
  name: string;
  type: string;
  framework?: string;
  languages: string[];
  mainPurpose: string;
}
