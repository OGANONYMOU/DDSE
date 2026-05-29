import '@testing-library/jest-dom';

// Silence console.error noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // Suppress known React testing warnings
    if (msg.includes('Warning:') || msg.includes('act(')) return;
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
