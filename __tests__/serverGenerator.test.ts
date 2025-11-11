
import { describe, test, expect, beforeEach, afterEach, Mock, vi } from 'vitest';
import * as fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import * as fileHelpers from '../src/fileHelpers';
import ServerGenerator from '../src/serverGenerator/serverGenerator';

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
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);
      expect(errorMock).not.toBeCalledWith('No middleware found in folder: ');

      const indexPath = path.resolve(cwd(), './generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, app middleware included, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      middleware_folder: '__tests__/middleware',
      app_middleware: ['testLogger', 'testMiddleware']
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);
      expect(logMock).toBeCalledWith('middleware aggregation created at ./generated/middleware.ts');

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index_with_middleware.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, middelware not found, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      middleware_folder: '__tests__/middleware',
      app_middleware: ['stuff']
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, middelware not found, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      middleware_folder: '__tests__/no_middleware',
      app_middleware: ['stuff']
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, middelware not found, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      pre_run_scripts: '__tests__/preRunScripts'
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index_with_prescript.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, prescripts found, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      pre_run_scripts: '__tests__/preRunScripts'
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index_with_prescript.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, prescripts directory not found, checking file structure', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      pre_run_scripts: '__tests__/no_preRunScripts'
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);
      expect(logMock).toBeCalledWith('The directory for prescripts does not exist: ', '__tests__/no_preRunScripts');

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('generates server.js file, prescripts directory is empty, checking file structure', async () => {
    await fs.promises.mkdir('__tests__/preRunScripts_empty', { recursive: true });
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234,
      pre_run_scripts: '__tests__/preRunScripts_empty'
    });
    const result = await serverGenerator.generateServer();
    try {    
      expect(result.success).toBe(true);

      expect(fs.existsSync(path.resolve(cwd(), './generated/index.ts'))).toBeTruthy();
      expect(logMock).toBeCalledWith(`generated endpoints: ./generated/__tests__/test_bff.ts`);
      expect(logMock).toBeCalledWith(`generated server entrypoint: ./generated/index.ts`);
      expect(logMock).toBeCalledWith('No pre-run scripts found in: ', '__tests__/preRunScripts_empty');

      const indexPath = path.resolve('./generated/index.ts');
      const indexContent = await fs.promises.readFile(indexPath, 'utf-8');
      const expectedIndexContent = await fs.promises.readFile('./__tests__/generatedOutputs/index.ts', 'utf-8');

      // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
      expect(normalize(indexContent)).toEqual(normalize(expectedIndexContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, '')));
    } finally {
      await deleteGeneratedFiles();
    }
  });

  test('config file, no handler files, does not continue to generate the server', async () => {
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/no_files',
        api_slug: '/_api'
      }],
      port: 1234
    });
    const result = await serverGenerator.generateServer();
    expect(result.success).toBe(false);

    expect(errorMock).toBeCalledWith(`No valid api files able to be created from the config and file system, exiting creation`);

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();
  });

  test('config file, error making generated directory', async () => {
    const error: string = 'could not make directory';
    const makeDirMock = vi.spyOn(fileHelpers, 'makeDirectory').mockResolvedValue({ success: false, error: error });
        
    const serverGenerator = new ServerGenerator({
      api_folders: [{
        directory: '__tests__/test_bff',
        api_slug: '/_api'
      }],
      port: 1234
    });
    const result = await serverGenerator.generateServer();
    expect(result.success).toBe(false);

    expect(errorMock).toBeCalledWith(`Error creating the directory: ./generated: `, error);

    expect(fs.existsSync(path.resolve(cwd(), './generated'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/__tests__/test_bff.js'))).toBeFalsy();
    expect(fs.existsSync(path.resolve(cwd(), './generated/index.js'))).toBeFalsy();

    makeDirMock.mockRestore();
  });
});

test(' failing as a reminder', () => {
  // use serverGenerator to sort through the middleware required for each
});

async function deleteGeneratedFiles () {
  await fs.promises.rm('./generated', { recursive: true, force: true });
}

const normalize = str => str.replace(/\r\n/g, '\n').trimEnd();