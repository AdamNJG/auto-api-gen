import { describe, expect, test, beforeEach, afterEach, vi, Mock } from 'vitest';
import ManifestGenerator from '../src/manifestGenerator/manifestGenerator';
import { File, HttpMethod } from '../src/manifestGenerator/types';

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
    logMock.mockRestore();
    const manifestGenerator = new ManifestGenerator('./__tests__/test_bff_config');
    const manifest = await manifestGenerator.createManifest();

    expect(manifest.endpoints).toStrictEqual(bff_test_endpoints);
  });

  test('create manifest, invalid config, parse failure', async () => {
    const manifestGenerator = new ManifestGenerator('./__tests__/test_bff_invalid_config');
    const manifest = await manifestGenerator.createManifest();

    expect(manifest.endpoints).toStrictEqual(bff_invalid_config_endpoints);
    expect(errorMock.mock.calls[0][0]).toContain(`Failed to parse `);
  });

  test('create manifest, invalid config, eval failure', async () => {
    const babelMock = vi.spyOn(global as any, 'eval').mockImplementation(() => {
      throw new Error('eval failed!');
    });
    const manifestGenerator = new ManifestGenerator('./__tests__/test_bff_invalid_config');
    await manifestGenerator.createManifest();

    expect(errorMock.mock.calls[0][0]).toContain(`eval failed!`);
    babelMock.mockRestore();
  });

  test('create manifest using config - Typescript', async () => {
    const manifestGenerator = new ManifestGenerator('./__tests__/test_bff_config_typescript');
    const manifest = await manifestGenerator.createManifest();

    for (const expected of bff_test_endpoints_ts) {
      expect(manifest.endpoints).toContainEqual(expected);
    }

    expect(manifest.endpoints.length).toBe(bff_test_endpoints_ts.length);
  });
});

const bff_test_endpoints: File[] = [            
  {
    name: 'patch.ts',
    route: '/default/patch',
    path: '__tests__/test_bff_config/default/patch.ts',                                                                   
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: ['testLogger', 'testMiddleware'],
      handlerName: 'default_patch',
      isHandlerDefaultExport: true
    }            
  },                                                           
  {                                                                                                              
    name: 'index.js',                                                                                            
    route: '/',                                                                                                  
    path: '__tests__/test_bff_config/index.js',                                                              
    config: {
      httpMethod: HttpMethod.POST,
      middleware: [],
      handlerName: 'index',
      isHandlerDefaultExport: false
    }                                                                                           
  },                                                                                                             
  {
    name: 'index.js',
    route: '/test',
    path: '__tests__/test_bff_config/test/index.js',                                                                  
    config: {
      httpMethod: HttpMethod.PUT,
      middleware: [],
      handlerName: 'test_index',
      isHandlerDefaultExport: false
    }            
  },
  {
    name: 'test.js',
    route: '/test/test',
    path: '__tests__/test_bff_config/test/test.js',                                                                 
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: [],
      handlerName: 'test_test',
      isHandlerDefaultExport: false
    }            
  }
];

const bff_invalid_config_endpoints: File[] = [
  {
    name: 'index.js',
    path: '__tests__/test_bff_invalid_config/index.js',
    route: '/',
    config: {
      httpMethod: HttpMethod.GET,
      middleware: [],
      handlerName: 'index',
      isHandlerDefaultExport: false
    }
  }
];

const bff_test_endpoints_ts: File[] = [            
  {
    name: 'patch.ts',
    route: '/default/patch',
    path: '__tests__/test_bff_config_typescript/default/patch.ts',                                                                   
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: [],
      handlerName: 'default_patch',
      isHandlerDefaultExport: true
    }            
  },                    
  {
    name: '[id].ts',
    route: '/default/:post/comments/:id',
    path: '__tests__/test_bff_config_typescript/default/[post]/comments/[id].ts',                                                                   
    config: {
      httpMethod: HttpMethod.GET,
      middleware: [],
      handlerName: 'default_post_comments_id',
      isHandlerDefaultExport: true
    }            
  },                                                           
  {                                                                                                              
    name: 'index.ts',                                                                                            
    route: '/',                                                                                                  
    path: '__tests__/test_bff_config_typescript/index.ts',                                                              
    config: {
      httpMethod: HttpMethod.POST,
      middleware: [],
      handlerName: 'index',
      isHandlerDefaultExport: false
    }                                                                                           
  },                                                                                                             
  {
    name: 'index.ts',
    route: '/test',
    path: '__tests__/test_bff_config_typescript/test/index.ts',                                                                  
    config: {
      httpMethod: HttpMethod.PUT,
      middleware: [],
      handlerName: 'test_index',
      isHandlerDefaultExport: false
    }            
  },
  {
    name: 'test.ts',
    route: '/test/test',
    path: '__tests__/test_bff_config_typescript/test/test.ts',                                                                 
    config: {
      httpMethod: HttpMethod.PATCH,
      middleware: [],
      handlerName: 'test_test',
      isHandlerDefaultExport: false
    }            
  },
  {
    name: '[id].ts',
    route: '/test/:id',
    path: '__tests__/test_bff_config_typescript/test/[id].ts',                                                                 
    config: {
      httpMethod: HttpMethod.GET,
      middleware: [],
      handlerName: 'test_id',
      isHandlerDefaultExport: false
    }     
  }
];