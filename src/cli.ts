#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeAnalyzer } from './analyzer';
import { ConfigManager } from './config';
import { GitUtils } from './git-utils';
import { AICodeContextConfig } from './types';

const program = new Command();

program
  .name('ai-context')
  .description('AI-powered code documentation that actually helps')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize AI Code Context in the current project')
  .option('--provider <provider>', 'AI provider (openai, anthropic, local)', 'openai')
  .option('--model <model>', 'AI model to use')
  .option('--api-key <key>', 'API key for the AI provider')
  .action(async (options) => {
    try {
      await initializeProject(options);
    } catch (error: any) {
      console.error(chalk.red('Error during initialization:'), error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze code changes and generate documentation')
  .option('--commit <range>', 'Analyze specific commit range (e.g., HEAD~1..HEAD)')
  .option('--staged', 'Analyze staged changes')
  .option('--unstaged', 'Analyze unstaged changes')
  .option('--file <path>', 'Analyze specific file')
  .option('--output <path>', 'Output file for the analysis report')
  .option('--auto', 'Auto mode for git hooks (minimal output)')
  .action(async (options) => {
    try {
      await analyzeCode(options);
    } catch (error: any) {
      console.error(chalk.red('Error during analysis:'), error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch for git commits and auto-analyze changes')
  .option('--install-hook', 'Install git commit hook')
  .option('--remove-hook', 'Remove git commit hook')
  .action(async (options) => {
    try {
      await watchForChanges(options);
    } catch (error: any) {
      console.error(chalk.red('Error setting up watch:'), error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .option('--show', 'Show current configuration')
  .option('--set <key=value>', 'Set configuration value')
  .option('--reset', 'Reset to default configuration')
  .action(async (options) => {
    try {
      await manageConfig(options);
    } catch (error: any) {
      console.error(chalk.red('Error managing config:'), error?.message || 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show project status and configuration')
  .action(async () => {
    try {
      await showStatus();
    } catch (error: any) {
      console.error(chalk.red('Error showing status:'), error?.message || 'Unknown error');
      process.exit(1);
    }
  });

async function initializeProject(options: any): Promise<void> {
  console.log(chalk.blue('🤖 Initializing AI Code Context...'));

  const gitUtils = new GitUtils();
  
  if (!(await gitUtils.isGitRepository())) {
    console.error(chalk.red('Error: This is not a git repository. Please run this command in a git project.'));
    process.exit(1);
  }

  const configManager = new ConfigManager();
  
  // Interactive setup if no options provided
  let config: Partial<AICodeContextConfig> = {};
  
  if (!options.provider && !options.apiKey) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Which AI provider would you like to use?',
        choices: [
          { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'Local/Self-hosted (Ollama, etc.)', value: 'local' }
        ],
        default: 'openai'
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your API key (or press Enter to set later):',
        when: (answers) => answers.aiProvider !== 'local'
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: 'Enter your local API URL:',
        default: 'http://localhost:11434/api/chat',
        when: (answers) => answers.aiProvider === 'local'
      },
      {
        type: 'confirm',
        name: 'autoCommitHook',
        message: 'Would you like to automatically analyze commits?',
        default: false
      },
      {
        type: 'confirm',
        name: 'updateReadme',
        message: 'Should we automatically update README.md with analysis?',
        default: true
      }
    ]);

    config = answers;
  } else {
    config = {
      aiProvider: options.provider,
      apiKey: options.apiKey,
      model: options.model
    };
  }

  // Save configuration
  await configManager.save(config);

  // Install git hook if requested
  if (config.autoCommitHook) {
    await gitUtils.installCommitHook();
    console.log(chalk.green('✓ Git commit hook installed'));
  }

  console.log(chalk.green('✓ AI Code Context initialized successfully!'));
  console.log(chalk.blue('\nNext steps:'));
  console.log('  1. Run "ai-context analyze --commit HEAD~1..HEAD" to analyze recent changes');
  console.log('  2. Run "ai-context status" to check your setup');
  console.log('  3. Use "ai-context analyze --staged" before committing to review changes');
}

async function analyzeCode(options: any): Promise<void> {
  const spinner = ora('Initializing analyzer...').start();
  
  try {
    const analyzer = new CodeAnalyzer();
    await analyzer.initialize();

    let results: any[] = [];

    if (options.file) {
      spinner.text = `Analyzing file: ${options.file}`;
      const result = await analyzer.analyzeFile(options.file);
      results = [result];
    } else if (options.commit) {
      const [from, to] = options.commit.includes('..') 
        ? options.commit.split('..') 
        : [options.commit + '~1', options.commit];
      
      spinner.text = `Analyzing commits: ${from}..${to}`;
      results = await analyzer.analyzeCommitRange(from, to);
    } else if (options.staged) {
      spinner.text = 'Analyzing staged changes...';
      results = await analyzer.analyzeStagedChanges();
    } else if (options.unstaged) {
      spinner.text = 'Analyzing unstaged changes...';
      results = await analyzer.analyzeUnstagedChanges();
    } else {
      spinner.fail('Please specify what to analyze (--commit, --staged, --unstaged, or --file)');
      return;
    }

    spinner.text = 'Generating report...';
    const report = await analyzer.generateSummaryReport(results);

    spinner.succeed('Analysis complete!');

    if (options.auto) {
      // Minimal output for git hooks
      console.log(chalk.green(`Analyzed ${results.length} file(s)`));
      return;
    }

    // Output results
    if (options.output) {
      await fs.writeFile(options.output, report);
      console.log(chalk.green(`Report saved to: ${options.output}`));
    } else {
      console.log('\n' + report);
    }

    // Update README if configured
    const configManager = new ConfigManager();
    const config = await configManager.load();
    
    if (config.updateReadme && !options.auto) {
      await updateReadme(report, config);
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    throw error;
  }
}

async function watchForChanges(options: any): Promise<void> {
  const gitUtils = new GitUtils();

  if (options.installHook) {
    await gitUtils.installCommitHook();
    console.log(chalk.green('✓ Git commit hook installed'));
    console.log(chalk.blue('Now commits will be automatically analyzed!'));
    return;
  }

  if (options.removeHook) {
    await gitUtils.removeCommitHook();
    console.log(chalk.green('✓ Git commit hook removed'));
    return;
  }

  console.log(chalk.blue('Git hook management:'));
  console.log('  --install-hook  Install automatic analysis on commits');
  console.log('  --remove-hook   Remove automatic analysis');
}

async function manageConfig(options: any): Promise<void> {
  const configManager = new ConfigManager();

  if (options.show) {
    const config = await configManager.load();
    console.log(chalk.blue('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options.set) {
    const [key, value] = options.set.split('=');
    if (!key || !value) {
      console.error(chalk.red('Error: Please provide key=value format'));
      return;
    }

    const updates: any = {};
    updates[key] = value;
    await configManager.save(updates);
    console.log(chalk.green(`✓ Configuration updated: ${key} = ${value}`));
    return;
  }

  if (options.reset) {
    await configManager.createDefaultConfig();
    console.log(chalk.green('✓ Configuration reset to defaults'));
    return;
  }

  console.log(chalk.blue('Configuration management:'));
  console.log('  --show          Show current configuration');
  console.log('  --set key=value Set a configuration value');
  console.log('  --reset         Reset to default configuration');
}

async function showStatus(): Promise<void> {
  console.log(chalk.blue('🤖 AI Code Context Status\n'));

  const gitUtils = new GitUtils();
  const configManager = new ConfigManager();

  // Check git repository
  const isGitRepo = await gitUtils.isGitRepository();
  console.log(`Git Repository: ${isGitRepo ? chalk.green('✓') : chalk.red('✗')}`);

  if (isGitRepo) {
    const currentBranch = await gitUtils.getCurrentBranch();
    console.log(`Current Branch: ${chalk.yellow(currentBranch)}`);

    const projectInfo = await gitUtils.getProjectInfo();
    console.log(`Project Name: ${chalk.yellow(projectInfo.name)}`);
  }

  // Check configuration
  const config = await configManager.load();
  const validation = await configManager.validateConfig();
  
  console.log(`\nConfiguration: ${validation.valid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
  console.log(`AI Provider: ${chalk.yellow(config.aiProvider)}`);
  console.log(`Model: ${chalk.yellow(config.model || 'default')}`);
  console.log(`API Key: ${config.apiKey || configManager.getApiKey() ? chalk.green('✓ Set') : chalk.red('✗ Missing')}`);

  if (!validation.valid) {
    console.log(chalk.red('\nConfiguration Issues:'));
    validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
  }

  // Check git hook
  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'post-commit');
  const hasHook = await fs.pathExists(hookPath);
  console.log(`Git Hook: ${hasHook ? chalk.green('✓ Installed') : chalk.yellow('✗ Not installed')}`);

  console.log(chalk.blue('\nReady to analyze code! 🚀'));
}

async function updateReadme(report: string, config: AICodeContextConfig): Promise<void> {
  const readmePath = config.readmePath || 'README.md';
  
  if (!(await fs.pathExists(readmePath))) {
    return;
  }

  const content = await fs.readFile(readmePath, 'utf-8');
  
  // Look for existing AI analysis section
  const sectionMarker = '<!-- AI Code Context Analysis -->';
  const startIndex = content.indexOf(sectionMarker);
  
  let newContent: string;
  if (startIndex !== -1) {
    // Replace existing section
    const endIndex = content.indexOf(sectionMarker, startIndex + 1);
    if (endIndex !== -1) {
      newContent = content.substring(0, startIndex) + 
                  `${sectionMarker}\n\n${report}\n\n${sectionMarker}` +
                  content.substring(endIndex + sectionMarker.length);
    } else {
      // End marker not found, append at the end
      newContent = content + `\n\n${sectionMarker}\n\n${report}\n\n${sectionMarker}`;
    }
  } else {
    // Add new section at the end
    newContent = content + `\n\n${sectionMarker}\n\n${report}\n\n${sectionMarker}`;
  }

  await fs.writeFile(readmePath, newContent);
  console.log(chalk.green(`✓ Updated ${readmePath} with analysis`));
}

// Error handling
process.on('unhandledRejection', (error: any) => {
  console.error(chalk.red('Unhandled error:'), error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\nOperation cancelled by user'));
  process.exit(0);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
