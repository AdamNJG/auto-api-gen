import { AutoApiConfig } from './src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: './bff_functions',
    api_slug: '_api'
  },
  {
    directory: './rest_api',
    api_slug: 'api'
  }
  ],
  endpointFolder: './endpoints',
  port: 3000
}; 

