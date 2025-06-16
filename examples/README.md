# AI Code Context Examples

This directory contains example configurations for different project types and setups.

## Configuration Examples

### React/TypeScript Projects

- **File:** `react-project.json`
- **Use case:** React applications with TypeScript
- **Features:** React-specific prompts, component analysis, modern JavaScript patterns

### Python Projects

- **File:** `python-project.json`
- **Use case:** Python applications and libraries
- **Features:** Python-specific analysis, PEP compliance, type hints documentation

### Local AI Setup

- **File:** `local-ai.json`
- **Use case:** Privacy-focused setup with local AI models (Ollama)
- **Features:** No external API calls, reduced token usage, auto-commit analysis

## How to Use

1. Copy the relevant example to your project root as `.aicontext.json`
2. Modify the configuration to match your specific needs
3. Add your API key if using external providers
4. Run `ai-context init` to validate the setup

## Customization Tips

### Custom Prompts

Tailor the AI prompts to your project's specific needs:

```json
{
  "customPrompts": {
    "codeAnalysis": "Your custom analysis prompt here...",
    "documentation": "Your custom documentation prompt here...",
    "summary": "Your custom summary prompt here..."
  }
}
```

### File Patterns

Adjust include/exclude patterns for your project structure:

```json
{
  "includePatterns": ["src/**/*.ts", "lib/**/*.js"],
  "excludePatterns": ["**/*.test.*", "node_modules/**"]
}
```

### Output Formats

Choose how you want the analysis delivered:

- `"markdown"` - Markdown format only
- `"comments"` - Inline code comments
- `"both"` - Both markdown and comments

## Framework-Specific Examples

### Next.js

```json
{
  "includePatterns": ["pages/**/*.tsx", "components/**/*.tsx", "lib/**/*.ts"],
  "customPrompts": {
    "codeAnalysis": "Focus on Next.js patterns, SSR/SSG considerations, and API routes..."
  }
}
```

### Express.js API

```json
{
  "includePatterns": ["routes/**/*.js", "middleware/**/*.js", "models/**/*.js"],
  "customPrompts": {
    "codeAnalysis": "Analyze API endpoints, middleware logic, and database interactions..."
  }
}
```

### Django

```json
{
  "includePatterns": ["**/*.py"],
  "excludePatterns": ["migrations/**", "venv/**"],
  "customPrompts": {
    "codeAnalysis": "Focus on Django models, views, and URL patterns..."
  }
}
```
