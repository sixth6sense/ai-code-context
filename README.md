# 🤖 AI Code Context

> AI-powered code documentation that actually helps developers understand and maintain code

[![npm version](https://badge.fury.io/js/ai-code-context.svg)](https://badge.fury.io/js/ai-code-context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/ai-code-context/ai-code-context/actions/workflows/ci.yml/badge.svg)](https://github.com/ai-code-context/ai-code-context/actions/workflows/ci.yml)

## The Problem

Developers spend **30%+ of their time** understanding existing code and writing documentation. When working on unfamiliar codebases or returning to old projects, developers waste hours figuring out what code does and why it was written that way.

## The Solution

**AI Code Context** automatically generates and maintains contextual documentation for your code changes using AI. It integrates seamlessly into your git workflow and provides human-readable explanations that actually help developers understand code faster.

## ✨ Features

- 🔍 **Smart Code Analysis** - Analyzes git diffs and understands code changes in context
- 📝 **Auto-Documentation** - Generates clear, helpful documentation automatically
- 🔗 **Git Integration** - Hooks into your git workflow for seamless analysis
- 🧠 **Multiple AI Providers** - Works with OpenAI, Anthropic, or local models
- 🎯 **Language Agnostic** - Supports any programming language
- 🚀 **Zero Config** - Works out of the box with sensible defaults
- 🔐 **Privacy Focused** - Option to use local AI models

## 🚀 Quick Start

### Installation

```bash
npm install -g ai-code-context
```

### Initialize in your project

```bash
cd your-project
ai-context init
```

### Analyze your code

```bash
# Analyze recent changes
ai-context analyze --commit HEAD~1..HEAD

# Analyze staged changes before committing
ai-context analyze --staged

# Analyze specific file
ai-context analyze --file src/components/UserProfile.tsx

# Set up automatic analysis on commits
ai-context watch --install-hook
```

## 📖 Usage Examples

### Analyzing Git Commits

```bash
# Analyze the last commit
ai-context analyze --commit HEAD~1..HEAD

# Analyze a range of commits
ai-context analyze --commit feature-branch..main

# Analyze uncommitted changes
ai-context analyze --unstaged
```

### Example Output

```markdown
# Code Analysis Report

**Project:** my-react-app
**Type:** React Application
**Languages:** typescript, javascript
**Generated:** 2024-01-15T10:30:00.000Z

## Summary

Analyzed 3 file(s) with AI-powered code analysis.

### src/components/UserProfile.tsx

**Language:** typescript

**Summary:** Added new user profile component with avatar display and edit functionality

**Purpose:** Create a reusable user profile component for displaying user information with editing capabilities

**Key Changes:**

- Implemented UserProfile React component with TypeScript
- Added avatar image display with fallback to initials
- Integrated edit mode toggle for profile information
- Added form validation for email and username fields

**Impact:** Enables user profile functionality across the application with consistent UI/UX

**Suggestions:**

- Consider adding loading states for async operations
- Add unit tests for form validation logic
- Consider extracting avatar logic into separate component for reusability
```

### Configuration

Create `.aicontext.json` in your project root:

```json
{
  "aiProvider": "openai",
  "model": "gpt-4",
  "apiKey": "your-api-key-here",
  "maxTokens": 2000,
  "temperature": 0.3,
  "autoCommitHook": true,
  "includePatterns": ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.py"],
  "excludePatterns": ["node_modules/**", "dist/**", "**/*.test.*"],
  "outputFormat": "both",
  "updateReadme": true
}
```

## 🎛️ Configuration Options

| Option            | Description                                   | Default                       |
| ----------------- | --------------------------------------------- | ----------------------------- |
| `aiProvider`      | AI provider: `openai`, `anthropic`, `local`   | `openai`                      |
| `model`           | AI model to use                               | `gpt-4`                       |
| `apiKey`          | API key for AI provider                       | env var                       |
| `maxTokens`       | Maximum tokens per request                    | `2000`                        |
| `temperature`     | AI creativity (0-1)                           | `0.3`                         |
| `autoCommitHook`  | Auto-analyze on commits                       | `false`                       |
| `includePatterns` | Files to analyze                              | `["**/*.js", "**/*.ts", ...]` |
| `excludePatterns` | Files to ignore                               | `["node_modules/**", ...]`    |
| `outputFormat`    | Output format: `markdown`, `comments`, `both` | `both`                        |
| `updateReadme`    | Auto-update README.md                         | `true`                        |

## 🧠 AI Provider Setup

### OpenAI

```bash
export OPENAI_API_KEY="your-api-key"
ai-context init --provider openai --model gpt-4
```

### Anthropic (Claude)

```bash
export ANTHROPIC_API_KEY="your-api-key"
ai-context init --provider anthropic --model claude-3-sonnet-20240229
```

### Local/Self-hosted (Ollama)

```bash
# Start Ollama server
ollama serve

# Configure AI Code Context
ai-context init --provider local --model llama2
```

## 🔧 Commands

### `ai-context init`

Initialize AI Code Context in your project.

```bash
ai-context init [options]

Options:
  --provider <provider>  AI provider (openai, anthropic, local)
  --model <model>       AI model to use
  --api-key <key>       API key for the AI provider
```

### `ai-context analyze`

Analyze code changes and generate documentation.

```bash
ai-context analyze [options]

Options:
  --commit <range>   Analyze specific commit range (e.g., HEAD~1..HEAD)
  --staged          Analyze staged changes
  --unstaged        Analyze unstaged changes
  --file <path>     Analyze specific file
  --output <path>   Output file for the analysis report
  --auto           Auto mode for git hooks (minimal output)
```

### `ai-context watch`

Set up automatic analysis on git commits.

```bash
ai-context watch [options]

Options:
  --install-hook    Install git commit hook
  --remove-hook     Remove git commit hook
```

### `ai-context config`

Manage configuration.

```bash
ai-context config [options]

Options:
  --show           Show current configuration
  --set <key=value> Set configuration value
  --reset          Reset to default configuration
```

### `ai-context status`

Show project status and configuration.

```bash
ai-context status
```

## 🔄 Git Integration

### Automatic Analysis on Commits

Install the git hook to automatically analyze commits:

```bash
ai-context watch --install-hook
```

This creates a `post-commit` hook that runs `ai-context analyze --commit HEAD~1..HEAD --auto` after each commit.

### Pre-commit Analysis

Add to your `.git/hooks/pre-commit`:

```bash
#!/bin/sh
ai-context analyze --staged
```

## 🏗️ Integration Examples

### GitHub Actions

```yaml
name: AI Code Analysis
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install -g ai-code-context
      - run: ai-context analyze --commit ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### VS Code Extension

Install the AI Code Context VS Code extension for integrated analysis:

```bash
code --install-extension ai-code-context.vscode-extension
```

### Package.json Scripts

```json
{
  "scripts": {
    "analyze": "ai-context analyze --staged",
    "analyze:last": "ai-context analyze --commit HEAD~1..HEAD",
    "analyze:branch": "ai-context analyze --commit main..HEAD"
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ai-code-context/ai-code-context.git
cd ai-code-context
npm install
npm run build
npm link
```

### Running Tests

```bash
npm test
npm run test:coverage
```

## 📊 Benefits

- **Save 2-3 hours per week** on documentation tasks
- **Faster onboarding** for new team members
- **Better code reviews** with AI-generated context
- **Improved maintainability** with up-to-date documentation
- **Language agnostic** - works with any codebase
- **Privacy focused** - option for local AI processing

## 🛡️ Privacy & Security

- **API Keys**: Stored locally in `.aicontext.json` or environment variables
- **Code Privacy**: Use local AI models to keep code on your infrastructure
- **No Data Storage**: AI providers process requests but don't store your code
- **Secure Transmission**: All API calls use HTTPS encryption

## 📄 License

MIT © [AI Code Context Contributors](LICENSE)

## 🙋‍♂️ Support

- 📚 [Documentation](https://github.com/ai-code-context/ai-code-context/wiki)
- 🐛 [Issue Tracker](https://github.com/ai-code-context/ai-code-context/issues)
- 💬 [Discussions](https://github.com/ai-code-context/ai-code-context/discussions)
- 📧 [Email Support](mailto:support@ai-code-context.dev)

---

**Made with ❤️ by developers, for developers who want to spend less time writing docs and more time writing code.**
