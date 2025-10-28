import { AutoApiConfig } from './src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'bff_functions',
    api_slug: '/_api'
  }],
  port: 4000
}; 

