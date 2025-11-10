import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { loadConfig } from '../src/configLoader/configLoader';
import * as path from 'path';
import * as fs from 'fs';
import tmp from 'tmp';

describe('configLoader tests', async () => {
  const tempDir = tmp.dirSync({ unsafeCleanup: true });
  tmp.setGracefulCleanup(); 

  const extensions: string[] = [
    'ts',
    'cjs',
    'mjs',
    'json',
    'js'
  ];

  beforeAll(() => {
    extensions.forEach(e => fs.mkdirSync(path.join(tempDir.name, e)));
    fs.writeFileSync(`${tempDir.name}/ts/autoapi.config.ts`, tsConfig);
    fs.writeFileSync(`${tempDir.name}/js/autoapi.config.js`, jsConfig);
    fs.writeFileSync(`${tempDir.name}/cjs/autoapi.config.cjs`, cjsConfig);
    fs.writeFileSync(`${tempDir.name}/mjs/autoapi.config.mjs`, jsConfig);
    fs.writeFileSync(`${tempDir.name}/json/autoapi.config.json`, jsonConfig);
  });

  afterAll(() => {
    tempDir.removeCallback();
  });

  test.each(extensions)(`Config loads for each type of extension: (%s)`,
    async (item) => {
      const configPath = path.join(tempDir.name, item);
      try {
        const config = await loadConfig(configPath);

        expect(config).toBeDefined();
        expect(config?.api_folders).toBeDefined();
        expect(config?.api_folders).toHaveLength(1);
        expect(config?.api_folders[0].api_slug).toBe('_api');
        expect(config?.api_folders[0].directory).toBe('stuff');
        expect(config?.port).toBe(1234);
      } finally {
        fs.rmSync(path.join(configPath, `autoapi.config.${item}`));
      }
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