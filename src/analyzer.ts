import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { GitUtils } from './git-utils';
import { createAIProvider, AIProvider } from './ai-provider';
import { ConfigManager } from './config';
import { AnalysisResult, GitDiffResult, ProjectContext, AICodeContextConfig } from './types';

export class CodeAnalyzer {
  private gitUtils: GitUtils;
  private aiProvider!: AIProvider;
  private config!: AICodeContextConfig;
  private configManager: ConfigManager;

  constructor(projectRoot: string = process.cwd()) {
    this.gitUtils = new GitUtils(projectRoot);
    this.configManager = new ConfigManager(projectRoot);
  }

  async initialize(): Promise<void> {
    this.config = await this.configManager.load();
    this.aiProvider = createAIProvider(this.config);
  }

  async analyzeCommitRange(fromCommit: string, toCommit: string = 'HEAD'): Promise<AnalysisResult[]> {
    const diffs = await this.gitUtils.getDiffBetweenCommits(fromCommit, toCommit);
    return this.analyzeDiffs(diffs);
  }

  async analyzeStagedChanges(): Promise<AnalysisResult[]> {
    const diffs = await this.gitUtils.getStagedChanges();
    return this.analyzeDiffs(diffs);
  }

  async analyzeUnstagedChanges(): Promise<AnalysisResult[]> {
    const diffs = await this.gitUtils.getUnstagedChanges();
    return this.analyzeDiffs(diffs);
  }

  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);
    const projectContext = await this.getProjectContext();

    const prompt = this.buildAnalysisPrompt(projectContext, language);
    const response = await this.aiProvider.analyzeCode(prompt, content);

    return this.parseAnalysisResponse(filePath, language, response.content);
  }

  private async analyzeDiffs(diffs: GitDiffResult[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const projectContext = await this.getProjectContext();

    for (const diff of diffs) {
      if (this.shouldAnalyzeFile(diff.file)) {
        const language = this.detectLanguage(diff.file);
        const diffContent = this.formatDiffForAnalysis(diff);
        
        const prompt = this.buildDiffAnalysisPrompt(projectContext, language);
        const response = await this.aiProvider.analyzeCode(prompt, diffContent);

        const result = this.parseAnalysisResponse(diff.file, language, response.content);
        results.push(result);
      }
    }

    return results;
  }

  private shouldAnalyzeFile(filePath: string): boolean {
    const { includePatterns, excludePatterns } = this.config;

    // Check exclude patterns first
    if (excludePatterns) {
      for (const pattern of excludePatterns) {
        if (this.matchesPattern(filePath, pattern)) {
          return false;
        }
      }
    }

    // Check include patterns
    if (includePatterns) {
      for (const pattern of includePatterns) {
        if (this.matchesPattern(filePath, pattern)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    return new RegExp(`^${regex}$`).test(filePath);
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.cxx': 'cpp',
      '.cc': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala'
    };

    return languageMap[ext] || 'unknown';
  }

  private formatDiffForAnalysis(diff: GitDiffResult): string {
    let content = `File: ${diff.file}\n`;
    content += `Changes: +${diff.additions} -${diff.deletions}\n\n`;

    if (diff.content) {
      content += `Full file content:\n${diff.content}\n\n`;
    }

    content += `Specific changes:\n`;
    for (const change of diff.changes) {
      content += `${change.type} at line ${change.lineNumber}: ${change.content}\n`;
      if (change.context && change.context.length > 0) {
        content += `Context: ${change.context.join(' ')}\n`;
      }
    }

    return content;
  }

  private buildAnalysisPrompt(projectContext: ProjectContext, language: string): string {
    const basePrompt = this.config.customPrompts?.codeAnalysis || '';
    
    return `${basePrompt}

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Framework: ${projectContext.framework || 'Unknown'}
- Main Purpose: ${projectContext.mainPurpose}
- Language: ${language}

Please analyze the following code and provide structured insights.`;
  }

  private buildDiffAnalysisPrompt(projectContext: ProjectContext, language: string): string {
    return `You are analyzing code changes in a ${projectContext.type} project using ${language}.

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Framework: ${projectContext.framework || 'Unknown'}
- Main Purpose: ${projectContext.mainPurpose}

Analyze the following code changes and provide:
1. Summary: A brief overview of what changed
2. Purpose: Why this change was likely made
3. Key Changes: List the most important modifications
4. Impact: How this affects the system/application
5. Documentation: Clear explanation for other developers
6. Suggestions: Any improvements or concerns

Focus on helping developers understand the change quickly and effectively.`;
  }

  private parseAnalysisResponse(filePath: string, language: string, response: string): AnalysisResult {
    // Parse the AI response into structured data
    const sections = this.extractSections(response);

    return {
      file: filePath,
      language,
      summary: sections.summary || 'No summary provided',
      purpose: sections.purpose || 'No purpose identified',
      keyChanges: sections.keyChanges || [],
      impact: sections.impact || 'Impact not specified',
      documentation: sections.documentation || response,
      suggestions: sections.suggestions || []
    };
  }

  private extractSections(response: string): any {
    const sections: any = {};
    
    // Try to extract structured information using simple regex patterns
    const summaryMatch = response.match(/(?:Summary|SUMMARY)[:\-\s]*([\s\S]*?)(?=\n(?:Purpose|PURPOSE|Key|Impact|Documentation|Suggestions|$))/i);
    if (summaryMatch) sections.summary = summaryMatch[1].trim();

    const purposeMatch = response.match(/(?:Purpose|PURPOSE)[:\-\s]*([\s\S]*?)(?=\n(?:Key|Impact|Documentation|Suggestions|$))/i);
    if (purposeMatch) sections.purpose = purposeMatch[1].trim();

    const impactMatch = response.match(/(?:Impact|IMPACT)[:\-\s]*([\s\S]*?)(?=\n(?:Documentation|Suggestions|$))/i);
    if (impactMatch) sections.impact = impactMatch[1].trim();

    const docMatch = response.match(/(?:Documentation|DOCUMENTATION)[:\-\s]*([\s\S]*?)(?=\n(?:Suggestions|$))/i);
    if (docMatch) sections.documentation = docMatch[1].trim();

    // Extract lists for key changes and suggestions
    const keyChangesMatch = response.match(/(?:Key Changes|KEY CHANGES)[:\-\s]*([\s\S]*?)(?=\n(?:Impact|Documentation|Suggestions|$))/i);
    if (keyChangesMatch) {
      sections.keyChanges = this.extractListItems(keyChangesMatch[1]);
    }

    const suggestionsMatch = response.match(/(?:Suggestions|SUGGESTIONS)[:\-\s]*([\s\S]*?)$/i);
    if (suggestionsMatch) {
      sections.suggestions = this.extractListItems(suggestionsMatch[1]);
    }

    return sections;
  }

  private extractListItems(text: string): string[] {
    const items = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove bullet points and numbering
        return line.replace(/^[\-\*\+\d]+\.?\s*/, '').trim();
      })
      .filter(line => line.length > 0);

    return items;
  }

  private async getProjectContext(): Promise<ProjectContext> {
    const projectInfo = await this.gitUtils.getProjectInfo();
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    let projectType = 'Unknown';
    let framework = 'Unknown';
    let mainPurpose = 'Software development project';

    try {
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Detect project type and framework
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies.react) {
          projectType = 'React Application';
          framework = 'React';
        } else if (dependencies.vue) {
          projectType = 'Vue.js Application';
          framework = 'Vue.js';
        } else if (dependencies.angular) {
          projectType = 'Angular Application';
          framework = 'Angular';
        } else if (dependencies.express) {
          projectType = 'Node.js Server';
          framework = 'Express';
        } else if (dependencies.next) {
          projectType = 'Next.js Application';
          framework = 'Next.js';
        }

        mainPurpose = packageJson.description || mainPurpose;
      }
    } catch {
      // Ignore errors, use defaults
    }

    // Detect language from file extensions
    const languages = await this.detectProjectLanguages();

    return {
      name: projectInfo.name,
      type: projectType,
      framework,
      languages,
      mainPurpose
    };
  }

  private async detectProjectLanguages(): Promise<string[]> {
    const patterns = ['**/*.js', '**/*.ts', '**/*.py', '**/*.java', '**/*.cpp', '**/*.c'];
    const languages = new Set<string>();

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { 
          ignore: this.config.excludePatterns || [],
          cwd: process.cwd()
        });
        
        for (const file of files.slice(0, 10)) { // Sample a few files
          const language = this.detectLanguage(file);
          if (language !== 'unknown') {
            languages.add(language);
          }
        }
      } catch {
        // Ignore glob errors
      }
    }

    return Array.from(languages);
  }

  async generateSummaryReport(results: AnalysisResult[]): Promise<string> {
    const projectContext = await this.getProjectContext();
    
    let report = `# Code Analysis Report\n\n`;
    report += `**Project:** ${projectContext.name}\n`;
    report += `**Type:** ${projectContext.type}\n`;
    report += `**Languages:** ${projectContext.languages.join(', ')}\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    report += `## Summary\n\n`;
    report += `Analyzed ${results.length} file(s) with AI-powered code analysis.\n\n`;

    for (const result of results) {
      report += `### ${result.file}\n\n`;
      report += `**Language:** ${result.language}\n\n`;
      report += `**Summary:** ${result.summary}\n\n`;
      report += `**Purpose:** ${result.purpose}\n\n`;
      
      if (result.keyChanges.length > 0) {
        report += `**Key Changes:**\n`;
        for (const change of result.keyChanges) {
          report += `- ${change}\n`;
        }
        report += `\n`;
      }
      
      report += `**Impact:** ${result.impact}\n\n`;
      
      if (result.suggestions.length > 0) {
        report += `**Suggestions:**\n`;
        for (const suggestion of result.suggestions) {
          report += `- ${suggestion}\n`;
        }
        report += `\n`;
      }
      
      report += `---\n\n`;
    }

    return report;
  }
}
