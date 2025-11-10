import { AutoApiConfig } from './src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'pages/pages',
    api_slug: '/',
    middleware: []
  }],
  port: 4001,
  middleware_folder: 'middleware',
  app_middleware: [],
  rollupExternals: ['jsdom'],
  pre_run_scripts: 'pre-runscripts'
}; 

