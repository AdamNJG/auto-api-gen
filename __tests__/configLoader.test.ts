import { describe, test, expect } from 'vitest';
import { loadConfig } from '../src/configLoader/configLoader';
import * as path from 'path';

describe('configLoader tests',() => {

  const extensions: string[] = [
    'ts',
    'cjs',
    'mjs',
    'json',
    'js'
  ];

  test.each(extensions)(`Config loads for each type of extension: (%s)`,
    async (item) => {

      const config = await loadConfig(path.resolve(`./__tests__/configs/${item}`));

      expect(config).toBeDefined();
      expect(config?.api_folders).toBeDefined();
      expect(config?.api_folders).toHaveLength(1);
      expect(config?.api_folders[0].api_slug).toBe('_api');
      expect(config?.api_folders[0].directory).toBe('stuff');
      expect(config?.port).toBe(1234);
    }, 10000);

  test(`Config in the base of the directory loads`, async () => {
    const config = await loadConfig(path.resolve());

    expect(config).toBeDefined();
  });

  test(`No config found, returns undefined`, async () => {
    const config = await loadConfig(path.resolve('./src'));

    expect(config).not.toBeDefined();
  });
});
