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
    await generateServer('./__tests__/configs/server');

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
    await generateServer('./__tests__/configs/server');

    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeTruthy();

    const indexPath = path.resolve('./generated/index.js');
    const indexContent = await fs.promises.readFile(indexPath, 'utf-8');

    expect(indexContent).toContain(`import express from 'express';`);

    expect(indexContent).toContain(`import test_bff from './__tests__/test_bff.js';`);

    expect(indexContent).toContain(`app.use('/_api', test_bff);`);

    expect(indexContent).toContain(`app.listen(1234, () => {`);
    await deleteGeneratedFiles();
  });

  test('no config file, does not continue to generate the server', async () => {
    await generateServer('./src');

    expect(errorMock).toBeCalledWith('No config found, please create an autoapi.config, check the documentation for details');

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();
  });

  test('no config file, does not continue to generate the server', async () => {
    await generateServer('./__tests__/configs/server/no_files');

    expect(errorMock).toBeCalledWith(`No valid api files able to be created from the config and file system, exiting creation`);

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();
  });
});

async function deleteGeneratedFiles () {
  await fs.promises.rm('./generated', { recursive: true, force: true });
}