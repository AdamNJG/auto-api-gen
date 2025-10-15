import { AutoApiConfig } from '../../src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'stuff',
    api_slug: '_api'
  }],
  endpointFolder: 'testEndpoints',
  port: 1234
}; 

