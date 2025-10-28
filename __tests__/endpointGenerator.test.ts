import { describe, test, expect, afterEach, beforeEach, vi, Mock } from 'vitest';
import { IRoute, NextFunction, Request, Response, Router } from 'express';
import { rm } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import generateEndpoints from '../src/endpointGenerator/endpointGenerator';

describe('endpoint generator', () => {
  const endpointBasePath = './__tests__/endpoints';
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

  test('js handlers present no configs, creates router with all get methods', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const endpointPath = `${endpointBasePath}_${uniqueSuffix}.js`;
    const testBffPath = '__tests__/test_bff';

    await generateEndpoints(`./${testBffPath}`, endpointPath);
   
    const router = await getRouter(endpointPath);
    if (!router) {
      await deleteFile(endpointPath);
      throw Error('router undefined');
    }

    await expectRoute(router.stack[0], '/', 'get', 'this is the base route');

    await expectRoute(router.stack[1], '/test/', 'get', 'this is /test/');

    await expectRoute(router.stack[2], '/test/test', 'get', 'this is /test/test');

    expect(logMock).toBeCalledWith(`generated endpoints: ${endpointPath}`);

    await deleteFile(endpointPath);
  });

  test('js handlers present with configs, creates valid router with different methods', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const endpointPath = `${endpointBasePath}_${uniqueSuffix}.js`;
    const testBffPath = '__tests__/test_bff_config';

    await generateEndpoints(`./${testBffPath}`, endpointPath);

    const router = await getRouter(endpointPath);
    if (!router) {
      await deleteFile(endpointPath);
      throw Error('router undefined');
    }

    await expectRoute(router.stack[0], '/default/patch', 'patch', 'this is /default/patch');

    await expectRoute(router.stack[1], '/', 'post', 'this is the base route');

    await expectRoute(router.stack[2], '/test/', 'put', 'this is /test/');

    await expectRoute(router.stack[3], '/test/test', 'patch', 'this is /test/test');

    await deleteFile(endpointPath);
  });

  test('js handlers present, invalid js file, other endpoints present', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const endpointPath = `${endpointBasePath}_${uniqueSuffix}.js`;
    const testBffPath = '__tests__/test_bff_invalid_config';

    await generateEndpoints(`./${testBffPath}`, endpointPath);

    const router = await getRouter(endpointPath);
    if (!router) {
      await deleteFile(endpointPath);
      throw Error('router undefined');
    }

    expect(errorMock.mock.calls[0][0]).toContain('Failed to parse');

    await expectRoute(router.stack[0], '/', 'get', 'this is the base route');

    await deleteFile(endpointPath);
  });

  test('no js handlers present, creates empty manifest', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2);
    const endpointPath = `${endpointBasePath}_${uniqueSuffix}.js`;
    await generateEndpoints(`./_no_files`, endpointPath);

    const router = await getRouter(endpointPath);

    expect(router).toBeUndefined();
    expect(errorMock).toHaveBeenCalledWith('No endpoints found to map for ./_no_files');
  });
});

async function deleteFile (file: string) {
  await rm(file);
}

async function expectRoute (layer: any, path: string, method: string, expectedBody: any) {
  const route = layer.route as IRoute;
  expect(route.path).toBe(path);
  expect(route.stack[0].method).toBe(method);
  await checkHandlerFunction(route.stack[0].handle, expectedBody);
}

async function checkHandlerFunction<T> (fun: (req: Request, res: Response, next: NextFunction) => any, expected: T) {
  let body: T | undefined;

  const req = {} as Request;
  const res = {
    send: (data: any) => {
      body = data;
    }
  } as any;
  const next = {} as any;

  await fun(req, res, next);

  expect(body).toBeDefined();
  expect(body).toBe(expected);
}

async function getRouter (outputPath: string): Promise<Router | undefined> {
  const absPath = path.resolve(outputPath);

  const fileUrl = pathToFileURL(absPath).href;
  try {
    const router = await import(fileUrl);
    if (router.default instanceof Router) {
      return router.default;
    }
  } catch {
    return undefined;
  }
}