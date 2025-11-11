import { describe, test, expect, afterEach, beforeEach, vi, Mock } from 'vitest';
import { IRoute, NextFunction, Request, Response, Router } from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import * as fs from 'fs';
import os from 'os';
import * as fileHelpers from '../src/fileHelpers';
import EndpointGenerator from '../src/endpointGenerator/endpointGenerator';
import MiddlewareAggregator from '../src/middlewareAggregator/middlewareAggregator';
import { TaggedMiddleware } from '../src/middlewareAggregator/types';

const endpointBasePath = './endpoints';
describe('endpoint generator', () => {
  let tempDir: string;

  let errorMock: Mock<(...args: any[]) => void>;
  let warnMock: Mock<(...args: any[]) => void>;
  let logMock: Mock<(...args: any[]) => void>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-test-'));
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    errorMock.mockRestore();
    warnMock.mockRestore();
    logMock.mockRestore();
  });

  test('js handlers present no configs, creates router with all get methods', async () => {
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff');

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(true);
  
    const router = await getRouter(endpointPath);
    if (!router) {
      throw Error('router undefined');
    }

    await expectRoute(router, '/', 'get', 'this is the base route');

    await expectRoute(router, '/test', 'get', 'this is /test/');

    await expectRoute(router, '/test/test', 'get', 'this is /test/test');
  });
  
  test('js handlers present with configs, creates valid router with different methods', async () => {
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_config');
    const middlewarePath = await setupFolders('./__tests__/middleware');
    const middlewareToAdd = ['testLogger', 'testMiddleware'];

    errorMock.mockRestore();
    warnMock.mockRestore();
    logMock.mockRestore();
    const middlewareOutputPath = path.join(tempDir, './generated/middleware.ts');
    const middlewareAggregator = new MiddlewareAggregator(middlewarePath, middlewareOutputPath);
    await middlewareAggregator.aggregateMiddleware();
    expect(fs.existsSync(middlewareOutputPath)).toBeTruthy();

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, middlewareToAdd, middlewareAggregator);
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(true);

    const router = await getRouter(endpointPath);
    if (!router) {
      throw Error(`router undefined from: ${endpointPath}`);
    }

    await expectRoute(router, '/default/patch', 'patch', 'this is /default/patch', {} ,middlewareToAdd);

    await expectRoute(router, '/', 'post', 'this is the base route');

    await expectRoute(router, '/test', 'put', 'this is /test/');

    await expectRoute(router, '/test/test', 'patch', 'this is /test/test');
  });

  test('js handlers present with configs, creates valid router with different methods including slug params', async () => {
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_config_typescript');

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(true);

    const router = await getRouter(endpointPath);
    if (!router) {
      throw Error('router undefined');
    }

    await expectRoute(router, '/default/patch', 'patch', 'this is /default/patch');

    await expectRoute(router, '/default/:post/comments/:id', 'get', `post: post, commentId: 1`, { post: 'post', id: '1' });

    await expectRoute(router, '/', 'post', 'this is the base route');

    await expectRoute(router, '/test', 'put', 'this is /test/');

    await expectRoute(router, '/test/test', 'patch', 'this is /test/test');

    await expectRoute(router, '/test/:id', 'get', '1', { id: '1' });
  });
  
  test('js handlers present, invalid js file, other endpoints present', async () => {
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_invalid_config');

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(true);

    const router = await getRouter(endpointPath);
    if (!router) {
      throw Error('router undefined');
    }

    expect(errorMock.mock.calls[0][0]).toContain('Failed to parse');

    await expectRoute(router, '/', 'get', 'this is the base route');
  });
  
  test('no js handlers present, no router created', async () => {
    const endpointPath = getUniqueEndpointPath();
    
    const endpointGenerator = new EndpointGenerator(`./_no_files`, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(false);

    const router = await getRouter(endpointPath);

    expect(router).toBeUndefined();
    expect(errorMock).toHaveBeenCalledWith('No endpoints found to map for ./_no_files');
  });

  test('js handlers present with configs, error creating directory, error logged', async () => {
    const error = 'failed to write directory';
    const makeDirectoryMock = vi.spyOn(fileHelpers, 'makeDirectory').mockResolvedValue({ success: false, error: error });
    
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_config');
    
    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(false);

    expect(fs.existsSync(endpointPath)).toBeFalsy();

    makeDirectoryMock.mockRestore();
  });
  
  test('js handlers present with configs, error creating directory, error logged', async () => {
    const error = 'failed to write file';
    const writeFileMock = vi.spyOn(fileHelpers, 'writeFile').mockResolvedValue({ success: false, error: error });
    
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_config');

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(false);

    expect(fs.existsSync(endpointPath)).toBeFalsy();

    writeFileMock.mockRestore();
  });

  test('js handlers present with configs, generates matching router', async () => {
    const endpointPath = getUniqueEndpointPath();
    const testBffPath = await setupFolders('__tests__/test_bff_config');
    const gennedContentPath = await setupFolders('__tests__/generatedOutputs');

    const endpointGenerator = new EndpointGenerator(testBffPath, endpointPath, [], new MiddlewareAggregator('', ''));
    const result = await endpointGenerator.generateEndpoints();
    expect(result.success).toBe(true);

    const gennedContent = await fs.promises.readFile(endpointPath, 'utf-8');
    const expectedGennedContent = await fs.promises.readFile(path.join(gennedContentPath, 'test_bff.ts'), 'utf-8');

    // styker adds @ts-nocheck to generated output, the replace is to bypass equality issues!
    expect(gennedContent).toEqual(expectedGennedContent.replace(/^\/\/\s*@ts-nocheck\s*\n/, ''));
  });

  async function setupFolders (sourceDir: string) : Promise<string> {
    const newPath = path.join(tempDir, path.basename(sourceDir));

    await fs.promises.cp(path.join(process.cwd(), sourceDir), newPath, { recursive: true });
    return newPath;
  }

  let counter = 0;
  const getUniqueEndpointPath = () => path.join(tempDir, endpointBasePath + '_' + (counter++) + '.ts');
});

async function expectRoute (router: Router, path: string, method: string, expectedBody: any, urlParameters?: Record<string, string>, endpointMiddleware?: string[]) {
  const layer = router.stack.find((l: any) => l.route && l.route.path === path);
  
  expect(layer, `Route with path "${path}" not found`).toBeDefined();

  const route = layer!.route as IRoute;

  const methodStack = route.stack.filter((s) => s.method === method.toLowerCase());

  expect(methodStack.length > 0,`Route "${path}" does not use method "${method}"`).toBe(true);

  const middlewareNames = methodStack
    .filter(layer => (layer.handle as TaggedMiddleware).mwName !== undefined)
    .map(layer => (layer.handle as TaggedMiddleware).mwName);

  const handler = methodStack
    .filter(m => m.name === 'handler')[0].handle;

  if (endpointMiddleware && endpointMiddleware.length > 0) {
    endpointMiddleware.forEach((name) => {
      expect(middlewareNames.includes(name),
        `Expected middleware "${name}" not found on route "${path}"`).toBe(true);
    });
  }

  await checkHandlerFunction(handler, expectedBody, urlParameters);
}

async function checkHandlerFunction<T> (fun: (req: Request, res: Response, next: NextFunction) => any, expected: T, urlParameters?: Record<string, string>) {
  let body: T | undefined;

  const req = {} as Request;

  if (urlParameters) {
    req.params = urlParameters;
  }
  const res = {
    send: (data: any) => {
      body = data;
    }
  } as any;
  const next = ({} as any);

  await fun(req, res, next);

  expect(body).toBeDefined();
  expect(body).toBe(expected);
}

async function getRouter (outputPath: string): Promise<Router | undefined> {
  const absPath = path.resolve(process.cwd(), outputPath);

  const fileUrl = pathToFileURL(absPath).href;
  try {
    const router = await import(fileUrl);
    if (router.default instanceof Router) {
      return router.default;
    }
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

