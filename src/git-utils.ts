import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GitDiffResult, GitChange } from './types';

export class GitUtils {
  private git: SimpleGit;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.git = simpleGit(projectRoot);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'main';
  }

  async getRecentCommits(count: number = 10): Promise<any[]> {
    const log = await this.git.log({ maxCount: count });
    return [...log.all];
  }

  async getDiffBetweenCommits(fromCommit: string, toCommit: string = 'HEAD'): Promise<GitDiffResult[]> {
    const diffSummary = await this.git.diffSummary([`${fromCommit}..${toCommit}`]);
    
    const results: GitDiffResult[] = [];
    
    for (const file of diffSummary.files) {
      const fileDiff = await this.git.diff([`${fromCommit}..${toCommit}`, '--', file.file]);
      const changes = this.parseDiffOutput(fileDiff);
      
      results.push({
        file: file.file,
        additions: (file as any).insertions || 0,
        deletions: (file as any).deletions || 0,
        changes,
        content: await this.getFileContent(file.file)
      });
    }
    
    return results;
  }

  async getStagedChanges(): Promise<GitDiffResult[]> {
    const diffSummary = await this.git.diffSummary(['--cached']);
    const results: GitDiffResult[] = [];
    
    for (const file of diffSummary.files) {
      const fileDiff = await this.git.diff(['--cached', '--', file.file]);
      const changes = this.parseDiffOutput(fileDiff);
      
      results.push({
        file: file.file,
        additions: (file as any).insertions || 0,
        deletions: (file as any).deletions || 0,
        changes,
        content: await this.getFileContent(file.file)
      });
    }
    
    return results;
  }

  async getUnstagedChanges(): Promise<GitDiffResult[]> {
    const diffSummary = await this.git.diffSummary();
    const results: GitDiffResult[] = [];
    
    for (const file of diffSummary.files) {
      const fileDiff = await this.git.diff(['--', file.file]);
      const changes = this.parseDiffOutput(fileDiff);
      
      results.push({
        file: file.file,
        additions: (file as any).insertions || 0,
        deletions: (file as any).deletions || 0,
        changes,
        content: await this.getFileContent(file.file)
      });
    }
    
    return results;
  }

  private parseDiffOutput(diffOutput: string): GitChange[] {
    const lines = diffOutput.split('\n');
    const changes: GitChange[] = [];
    let currentLineNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('@@')) {
        // Parse line number from hunk header
        const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentLineNumber = parseInt(match[1], 10);
        }
        continue;
      }
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        changes.push({
          type: 'addition',
          lineNumber: currentLineNumber,
          content: line.substring(1),
          context: this.getContextLines(lines, i)
        });
        currentLineNumber++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        changes.push({
          type: 'deletion',
          lineNumber: currentLineNumber,
          content: line.substring(1),
          context: this.getContextLines(lines, i)
        });
      } else if (line.startsWith(' ')) {
        currentLineNumber++;
      }
    }
    
    return changes;
  }

  private getContextLines(lines: string[], currentIndex: number, contextSize: number = 3): string[] {
    const start = Math.max(0, currentIndex - contextSize);
    const end = Math.min(lines.length, currentIndex + contextSize + 1);
    
    return lines.slice(start, end)
      .filter(line => line.startsWith(' '))
      .map(line => line.substring(1));
  }

  private async getFileContent(filePath: string): Promise<string | undefined> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      if (await fs.pathExists(fullPath)) {
        return await fs.readFile(fullPath, 'utf-8');
      }
    } catch {
      // File might have been deleted
    }
    return undefined;
  }

  async getFileHistory(filePath: string, maxCount: number = 5): Promise<any[]> {
    const log = await this.git.log({ file: filePath, maxCount });
    return [...log.all];
  }

  async getProjectInfo(): Promise<{ name: string; remoteUrl?: string }> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');
      
      return {
        name: path.basename(this.projectRoot),
        remoteUrl: origin?.refs?.fetch
      };
    } catch {
      return {
        name: path.basename(this.projectRoot)
      };
    }
  }

  async installCommitHook(): Promise<void> {
    const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'post-commit');
    const hookContent = `#!/bin/sh
# AI Code Context post-commit hook
ai-context analyze --commit HEAD~1..HEAD --auto
`;

    await fs.ensureFile(hookPath);
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, '755');
  }

  async removeCommitHook(): Promise<void> {
    const hookPath = path.join(this.projectRoot, '.git', 'hooks', 'post-commit');
    if (await fs.pathExists(hookPath)) {
      await fs.remove(hookPath);
    }
  }
}
