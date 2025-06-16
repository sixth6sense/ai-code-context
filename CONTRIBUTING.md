# Contributing to AI Code Context

Thank you for your interest in contributing to AI Code Context! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/ai-code-context.git
   cd ai-code-context
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Link for local testing**

   ```bash
   npm link
   ```

5. **Run tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## Project Structure

```
ai-code-context/
├── src/                  # Source code
│   ├── cli.ts           # Main CLI interface
│   ├── analyzer.ts      # Code analysis logic
│   ├── ai-provider.ts   # AI API integrations
│   ├── git-utils.ts     # Git operations
│   ├── config.ts        # Configuration management
│   └── types.ts         # TypeScript definitions
├── tests/               # Test files
├── examples/            # Example configurations
├── .github/             # GitHub workflows
└── docs/                # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Use strict mode settings
- Add JSDoc comments for public APIs

### Code Style

- Use ESLint configuration provided
- Follow existing naming conventions
- Keep functions focused and small
- Add error handling for all operations

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use Jest and follow existing test patterns
- Mock external dependencies (APIs, file system)

## Making Changes

### Before Starting

1. Create an issue describing the bug or feature
2. Wait for discussion and approval before starting work
3. Fork the repository and create a feature branch

### Development Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**

   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: add new feature description"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/) format:

   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `test:` - Adding tests
   - `refactor:` - Code refactoring

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Guidelines

- Fill out the PR template completely
- Include tests for new functionality
- Update documentation if needed
- Ensure all CI checks pass
- Keep PR scope focused and small

## Types of Contributions

### Bug Reports

- Use the bug report template
- Provide clear reproduction steps
- Include error messages and logs
- Specify your environment details

### Feature Requests

- Use the feature request template
- Explain the problem you're solving
- Provide use cases and examples
- Consider implementation complexity

### Code Contributions

- Bug fixes are always welcome
- New features should be discussed first
- Performance improvements
- Documentation improvements
- Test coverage improvements

### AI Provider Support

When adding a new AI provider:

1. **Create provider class**

   ```typescript
   export class NewAIProvider extends AIProvider {
     // Implement required methods
   }
   ```

2. **Add to factory function**

   ```typescript
   case 'new-provider':
     return new NewAIProvider(config);
   ```

3. **Update configuration types**

   ```typescript
   aiProvider: "openai" | "anthropic" | "local" | "new-provider";
   ```

4. **Add tests and documentation**

## Testing Guidelines

### Unit Tests

```typescript
describe("Component", () => {
  beforeEach(() => {
    // Setup
  });

  it("should behave correctly", () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test CLI commands end-to-end
- Mock external APIs and file system
- Test error handling paths

### Manual Testing

Before submitting:

1. Test CLI installation: `npm link`
2. Test basic commands: `ai-context --help`
3. Test with sample repository
4. Test error scenarios

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include usage examples
- Document complex algorithms
- Explain non-obvious decisions

### User Documentation

- Update README.md for new features
- Add examples for new configurations
- Update CLI help text
- Create tutorials for complex features

## Release Process

1. **Version bump** (maintainers only)

   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**

   - Add new features and changes
   - Include breaking changes
   - Credit contributors

3. **Create release**
   - Tag release in GitHub
   - Publish to npm
   - Update documentation

## Getting Help

- **Questions**: Open a discussion
- **Bugs**: Open an issue
- **Features**: Open an issue or discussion
- **Security**: Email security@ai-code-context.dev

## Recognition

Contributors are recognized in:

- CHANGELOG.md for each release
- GitHub contributors section
- Special thanks in release notes

Thank you for contributing to AI Code Context! 🚀
