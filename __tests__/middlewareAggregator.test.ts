import { describe, test, expect, Mock, vi, beforeEach, afterEach } from 'vitest';
import MiddlewareAggregator from '../src/middlewareAggregator/middlewareAggregator';
import * as fs from 'fs';
import * as fileHelpers from '../src/fileHelpers';

describe('middlewareGenerator', () => {
  const middlewareBasePath = './__tests__/middleware';

  let errorMock: Mock<(...args: any[]) => void>;
  let warnMock: Mock<(...args: any[]) => void>;
  let logMock: Mock<(...args: any[]) => void>;

  beforeEach(() => {
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    errorMock.mockRestore();
    warnMock.mockRestore();
    logMock.mockRestore();
  });

  test('points at middleware folder, creates aggregation', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const middlewarePath = `${middlewareBasePath}_${uniqueSuffix}.js`;
    const middlewareSourcePath = '__tests__/middleware';
  
    const middlewareAggregator = new MiddlewareAggregator(`./${middlewareSourcePath}`, middlewarePath);
    const result = await middlewareAggregator.aggregateMiddleware();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(middlewareAggregator.getAvailableMiddleware(['testLogger', 'testMiddleware', 'notTestware'])).toStrictEqual(['testLogger', 'testMiddleware']);
  
    const gennedContent = await fs.promises.readFile(middlewarePath, 'utf-8');
    const expectedGennedContent = await fs.promises.readFile('./__tests__/generatedOutputs/middleware.ts', 'utf-8');
  
    // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
    expect(normalize(gennedContent)).toEqual(normalize(expectedGennedContent).replace(/^\/\/\s*@ts-nocheck\s*\n/, ''));
  
    await deleteFile(middlewarePath);
  });

  test('empty middleware folder, no file created', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const middlewarePath = `${middlewareBasePath}_${uniqueSuffix}.js`;
    const middlewareSourcePath = '__tests__/no_middleware';

    const middlewareAggregator = new MiddlewareAggregator(`./${middlewareSourcePath}`, middlewarePath);
    const result = await middlewareAggregator.aggregateMiddleware();
    expect(result.success).toBe(false);
    expect(errorMock).toBeCalledWith(`No middleware found in folder: ./${middlewareSourcePath}`);
  
    expect(fs.existsSync(middlewarePath)).toBeFalsy();
  });

  test('points at middleware folder, write directory failure', async () => {
    const error: string = 'could not make directory';
    const makeDirMock = vi.spyOn(fileHelpers, 'makeDirectory').mockResolvedValue({ success: false, error: error });

    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const middlewarePath = `${middlewareBasePath}_${uniqueSuffix}.js`;
    const middlewareSourcePath = '__tests__/middleware';
  
    const middlewareAggregator = new MiddlewareAggregator(`./${middlewareSourcePath}`, middlewarePath);
    const result = await middlewareAggregator.aggregateMiddleware();
    expect(result.success).toBe(false);
    expect(fs.existsSync(middlewarePath)).toBe(false);
    expect(errorMock).toBeCalledWith('Failed to make directory: ', error);

    expect(middlewareAggregator.getAvailableMiddleware(['testLogger', 'testMiddleware', 'notTestware'])).toStrictEqual([]);
    makeDirMock.mockRestore();
  });

  test('points at middleware folder, write file failure', async () => {
    const error: string = 'could not write file';
    const makeDirMock = vi.spyOn(fileHelpers, 'writeFile').mockResolvedValue({ success: false, error: error });

    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const middlewarePath = `${middlewareBasePath}_${uniqueSuffix}.js`;
    const middlewareSourcePath = '__tests__/middleware';
  
    const middlewareAggregator = new MiddlewareAggregator(`./${middlewareSourcePath}`, middlewarePath);
    const result = await middlewareAggregator.aggregateMiddleware();
    expect(result.success).toBe(false);
    expect(fs.existsSync(middlewarePath)).toBe(false);
    expect(errorMock).toBeCalledWith('Failed to write middleware file: ', error);

    expect(middlewareAggregator.getAvailableMiddleware(['testLogger', 'testMiddleware', 'notTestware'])).toStrictEqual([]);
    makeDirMock.mockRestore();
  });
}); 

async function deleteFile (file: string) {
  await fs.promises.rm(file);
}

const normalize = str => str.replace(/\r\n/g, '\n').trimEnd();