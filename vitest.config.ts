import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'bff_functions',
        '__tests__/test_bff',
        '__tests__/test_bff_config',
        '__tests__/test_bff_invalid_config',
        'autoapi.config.ts',
        'eslint.config.ts',
        'vitest.config.ts',
        '__tests__/configs',
        'endpoints'
      ]
    },
    exclude: [
      '.stryker-tmp',
      'node_modules'
    ]
  }
});