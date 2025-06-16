import { ConfigManager } from '../src/config';
import { AICodeContextConfig } from '../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempConfigPath: string;

  beforeEach(() => {
    configManager = new ConfigManager('/tmp/test-project');
    tempConfigPath = path.join('/tmp/test-project', '.aicontext.json');
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load default config when no config file exists', async () => {
      (mockFs.pathExists as jest.Mock).mockResolvedValue(false);

      const config = await configManager.load();

      expect(config.aiProvider).toBe('openai');
      expect(config.model).toBe('gpt-4');
      expect(config.autoCommitHook).toBe(false);
    });

    it('should merge user config with defaults', async () => {
      const userConfig: Partial<AICodeContextConfig> = {
        aiProvider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        autoCommitHook: true
      };

      (mockFs.pathExists as jest.Mock).mockResolvedValue(true);
      (mockFs.readJson as jest.Mock).mockResolvedValue(userConfig);

      const config = await configManager.load();

      expect(config.aiProvider).toBe('anthropic');
      expect(config.model).toBe('claude-3-sonnet-20240229');
      expect(config.autoCommitHook).toBe(true);
      expect(config.temperature).toBe(0.3); // Should retain default
    });

    it('should handle corrupted config file gracefully', async () => {
      (mockFs.pathExists as jest.Mock).mockResolvedValue(true);
      (mockFs.readJson as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));

      const config = await configManager.load();

      expect(config.aiProvider).toBe('openai'); // Should use defaults
    });
  });

  describe('save', () => {
    it('should save config to file', async () => {
      const updates = {
        aiProvider: 'anthropic' as const,
        model: 'claude-3-sonnet-20240229'
      };

      await configManager.save(updates);

      expect(mockFs.ensureFile).toHaveBeenCalledWith(tempConfigPath);
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        tempConfigPath,
        expect.objectContaining(updates),
        { spaces: 2 }
      );
    });
  });

  describe('getApiKey', () => {
    it('should return config API key if set', async () => {
      await configManager.load();
      configManager.get().apiKey = 'config-key';

      const apiKey = configManager.getApiKey();

      expect(apiKey).toBe('config-key');
    });

    it('should fallback to environment variables', async () => {
      process.env.OPENAI_API_KEY = 'env-openai-key';
      await configManager.load();

      const apiKey = configManager.getApiKey();

      expect(apiKey).toBe('env-openai-key');
      delete process.env.OPENAI_API_KEY;
    });
  });

  describe('validateConfig', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('should return valid for proper config', async () => {
      configManager.get().apiKey = 'test-key';

      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing API key', async () => {
      configManager.get().apiKey = '';
      process.env.OPENAI_API_KEY = '';
      process.env.ANTHROPIC_API_KEY = '';

      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('API key is required');
    });

    it('should detect invalid AI provider', async () => {
      configManager.get().apiKey = 'test-key';
      (configManager.get() as any).aiProvider = 'invalid-provider';

      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('aiProvider must be one of');
    });

    it('should detect invalid maxTokens', async () => {
      configManager.get().apiKey = 'test-key';
      configManager.get().maxTokens = 50; // Too low

      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('maxTokens should be between');
    });

    it('should detect invalid temperature', async () => {
      configManager.get().apiKey = 'test-key';
      configManager.get().temperature = 1.5; // Too high

      const validation = await configManager.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('temperature should be between');
    });
  });
});
