import { AutoApiConfig } from '../../../../src/configLoader/types.ts';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: '__tests__/test_bff',
    api_slug: '/_api'
  }],
  port: 1234,
  middleware_folder: '__tests__/middleware',
  app_middleware: ['testLogger', 'testMiddleware']
}; 

