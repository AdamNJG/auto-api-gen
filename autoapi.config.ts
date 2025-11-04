import { AutoApiConfig } from './src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: 'pages/pages',
    api_slug: '/'
  }],
  port: 4001,
  middleware_folder: 'middleware',
  app_middleware: ['appLogger'],
  rollupExternals: ['jsdom'],
  pre_run_scripts: 'pre-runscripts'
}; 

