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

  test('generates server.js file, checking endpoints', async () => {
    const result = await generateServer('./__tests__/configs/server');
    expect(result.success).toBe(true);

    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeTruthy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeTruthy();

    expect(logMock).toHaveBeenCalledWith('generated server entrypoint: ./generated/index.js');

    const serverProcess = spawn('node', ['./generated/index.js'], {
      stdio: 'inherit'
    });

    await new Promise(res => setTimeout(res, 500));

    try {
      const resRoot = await fetch('http://localhost:1234/_api/');
      expect(resRoot.status).toBe(200);
      expect(await resRoot.text()).toBe('this is the base route');

      const resTest = await fetch('http://localhost:1234/_api/test');
      expect(resTest.status).toBe(200);
      expect(await resTest.text()).toBe('this is /test/');

      const resTestTest = await fetch('http://localhost:1234/_api/test/test');
      expect(resTestTest.status).toBe(200);
      expect(await resTestTest.text()).toBe('this is /test/test');
    } finally {
      serverProcess.kill();
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, checking file structure', async () => {
    const result = await generateServer('./__tests__/configs/server');
    expect(result.success).toBe(true);

    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeTruthy();

    const indexPath = path.resolve('./generated/index.js');
    const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
    const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.js', 'utf-8');

    // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
    expect(indexContent).toEqual(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, ''));

    await deleteGeneratedFiles();
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