import { describe, expect, test, beforeEach, afterEach, vi, Mock } from 'vitest';
import { createManifest } from '../src/endpointGenerator/manifestGenerator';
import { File, HttpMethod } from '../src/endpointGenerator/types';

describe('Manifest Generator', () => {
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
  test('create manifest using config', async () => {
    const manifest = await createManifest('./__tests__/test_bff_config');

    expect(manifest.endpoints).toStrictEqual(bff_test_endpoints);
  });

  test('create manifest', async () => {
    const manifest = await createManifest('./__tests__/test_bff_invalid_config');

    expect(manifest.endpoints).toStrictEqual(bff_invalid_config_endpoints);
    expect(errorMock.mock.calls[0][0]).toContain(`Failed to parse `);
  });

  test('create manifest', async () => {
    const babelMock = vi.spyOn(global as any, 'eval').mockImplementation(() => {
      throw new Error('eval failed!');
    });
    await createManifest('./__tests__/test_bff_invalid_config');

    expect(errorMock.mock.calls[0][0]).toContain(`eval failed!`);
    babelMock.mockRestore();
  });
});

const bff_test_endpoints: File[] = [            
  {
    name: 'patch.js',
    route: '/default/patch',
    path: '__tests__/test_bff_config/default/patch.js',
    handler: 'function default_patch_js(req, res) {\n  res.send("this is /default/patch");\n}',                                                                     
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: [],
      handlerName: 'default_patch_js',
      isHandlerDefaultExport: true
    }            
  },                                                           
  {                                                                                                              
    name: 'index.js',                                                                                            
    route: '/',                                                                                                  
    path: '__tests__/test_bff_config/index.js',    
    handler: 'async function test_bff_config_index_js(req, res) {\n' +
      '  await res.send("this is the base route");\n' +
      '}',                                                                     
    config: {
      httpMethod: HttpMethod.POST,
      middleware: [],
      handlerName: 'test_bff_config_index_js',
      isHandlerDefaultExport: false
    }                                                                                           
  },                                                                                                             
  {
    name: 'index.js',
    route: '/test/',
    path: '__tests__/test_bff_config/test/index.js',
    handler: 'function test_index_js(req, res) {\n  res.send("this is /test/");\n}',                                                                     
    config: {
      httpMethod: HttpMethod.PUT,
      middleware: [],
      handlerName: 'test_index_js',
      isHandlerDefaultExport: false
    }            
  },
  {
    name: 'test.js',
    route: '/test/test',
    path: '__tests__/test_bff_config/test/test.js',
    handler: 'function test_test_js(req, res) {\n  res.send("this is /test/test");\n}',                                                                     
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: [],
      handlerName: 'test_test_js',
      isHandlerDefaultExport: false
    }            
  }
];

const bff_invalid_config_endpoints: File[] = [
  {
    name: 'index.js',
    path: '__tests__/test_bff_invalid_config/index.js',
    route: '/',
    handler: 'async function test_bff_invalid_config_index_js(req, res) {\n' +
      '  await res.send("this is the base route");\n' +
      '}',
    config: {
      httpMethod: HttpMethod.GET,
      middleware: [],
      handlerName: 'test_bff_invalid_config_index_js',
      isHandlerDefaultExport: false
    }
  }
];