
import { describe, test, expect, beforeEach, afterEach, Mock, vi } from 'vitest';
import * as fs from 'fs';
import generateServer from '../src/serverGenerator/serverGenerator';
import path from 'path';
import { cwd } from 'process';
import { spawn } from 'child_process';

describe('serverGenerator tests', () => {
  let errorMock: Mock<(...args: any[]) => void>;
  let warnMock: Mock<(...args: any[]) => void>;
  let logMock: Mock<(...args: any[]) => void>;

  beforeEach(async () => {
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    errorMock.mockRestore();
    warnMock.mockRestore();
    logMock.mockRestore();
  });

  test('generates server.js file, checking file structure', async () => {
    const result = await generateServer('./__tests__/configs/server');
    expect(result.success).toBe(true);

    expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();

    const indexPath = path.resolve('./generated/index.ts');
    const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
    const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

    try {    
    // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(indexContent).toEqual(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, ''));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('no config file, does not continue to generate the server', async () => {
    const result = await generateServer('./src');
    expect(result.success).toBe(false);

    expect(errorMock).toBeCalledWith('No config found, please create an autoapi.config, check the documentation for details');

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();
  });

  test('no config file, does not continue to generate the server', async () => {
    const result = await generateServer('./__tests__/configs/server/no_files');
    expect(result.success).toBe(false);

    expect(errorMock).toBeCalledWith(`No valid api files able to be created from the config and file system, exiting creation`);

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();
  });
});

async function deleteGeneratedFiles () {
  await fs.promises.rm('./generated', { recursive: true, force: true });
}
