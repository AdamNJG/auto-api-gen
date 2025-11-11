import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { loadConfig } from '../src/configLoader/configLoader';
import * as path from 'path';
import * as fs from 'fs';
import os from 'os';

describe('configLoader tests', async () => {
  let tempDir: string;

  const extensions: string[] = [
    'ts',
    'cjs',
    'mjs',
    'json',
    'js'
  ];

  const configs: Record<string,string> = {
    ts: tsConfig,
    js: jsConfig,
    cjs: cjsConfig,
    mjs: jsConfig,
    json: jsonConfig
  };

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));

    extensions.forEach(e => {
      fs.mkdirSync(path.join(tempDir, e));
      fs.writeFileSync(path.join(tempDir, e, `autoapi.config.${e}`), configs[e]);
    });
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test.each(extensions)(`Config loads for each type of extension: (%s)`,
    async (item) => {
      const configPath = path.join(tempDir, item);

      const config = await loadConfig(configPath);

      expect(config).toBeDefined();
      expect(config?.api_folders).toBeDefined();
      expect(config?.api_folders).toHaveLength(1);
      expect(config?.api_folders[0].api_slug).toBe('_api');
      expect(config?.api_folders[0].directory).toBe('stuff');
      expect(config?.port).toBe(1234);

    }, 10000);

  test(`Config in the base of the directory loads`, async () => {

    const originalCwd = process.cwd();
    try {
      // make ./ to actually be tempdir/ts 
      process.chdir(path.join(tempDir, 'ts')); 
      const config = await loadConfig();
      expect(config).toBeDefined();
    } finally {
      process.chdir(originalCwd);
    }
  });

  test(`No config found, returns undefined`, async () => {
    const config = await loadConfig(path.resolve('./src'));

    expect(config).not.toBeDefined();
  });
});

const tsConfig = `import { AutoApiConfig } from '../../../src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'stuff',
    api_slug: '_api'
  }],
  port: 1234
}; 
`;

const jsConfig = `const config = {
  api_folders: [{
    directory: 'stuff',
    api_slug: '_api'
  }],
  port: 1234
}; 

export default config;`;

const cjsConfig = `module.exports = {
  api_folders: [{
    directory: 'stuff',
    api_slug: '_api'
  }],
  port: 1234
};`;

const jsonConfig = `
{
  "api_folders": [{
    "directory": "stuff",
    "api_slug": "_api"
  }],
  "port": 1234
}
`;