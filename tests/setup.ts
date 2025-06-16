// Test setup file
global.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
