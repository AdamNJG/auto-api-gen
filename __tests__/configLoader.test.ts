import { describe, test, expect, afterAll, beforeAll } from 'vitest';
import { loadConfig } from '../src/configLoader/configLoader';
import * as fs from 'fs';
import * as path from 'path';
const baseConfigName = './autoapi.config';

afterAll(async () => {
  await restoreConfig();
});
beforeAll(async () => {
  await renameConfig();
});

describe('configLoader tests',() => {
  const extensions: string[] = [
    '.ts',
    '.cjs',
    '.mjs',
    '.json' 
  ];

  test.each(extensions)(`CLI run with missing config, creates default (%s)`,
    async (item) => {
      await copyConfig('./__tests__/configs/autoapi.config', item);
      const config = await loadConfig();

      expect(config).toBeDefined();
      expect(config?.api_folders).toBeDefined();
      expect(config?.api_folders).toHaveLength(1);
      expect(config?.api_folders[0].api_slug).toBe('_api');
      expect(config?.api_folders[0].directory).toBe('stuff');
      expect(config?.endpointFolder).toBe('testEndpoints');
      expect(config?.port).toBe(1234);
    }, 10000);

});

async function deleteOldConfigs () {
  const extensions = ['.ts', '.js', '.json', '.cjs', '.mjs'];

  for (const extension of extensions) {
    const configPath = path.resolve(baseConfigName + extension);
    if (fs.existsSync(configPath)) {
      await fs.promises.rm(configPath);
    }
  }
}

async function restoreConfig () {
  await deleteOldConfigs();
  await renameConfig(true);
}

async function copyConfig (source: string, extension: string) { 
  await deleteOldConfigs();

  const src = path.resolve(source + extension);
  const dest = path.resolve(baseConfigName + extension);
  await fs.promises.copyFile(src, dest);
}

async function renameConfig (reverse: boolean = false) {
  const originalName: string = 'autoapi.config.ts';
  const backupName: string = 'autoApi.config.ts.old';

  if (reverse) {
    await fs.promises.rename(backupName, originalName);
    return;
  }

  await fs.promises.rename(originalName, backupName);
  console.log();
}