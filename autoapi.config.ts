import { AutoApiConfig } from './src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'pages',
    api_slug: '/'
  }],
  port: 4000,
  bootstrapDom: true
}; 

