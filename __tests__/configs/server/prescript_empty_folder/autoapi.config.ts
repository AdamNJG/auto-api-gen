import { AutoApiConfig } from '../../../../src/configLoader/types';

export const config: AutoApiConfig = {
  api_folders: [{
    directory: '__tests__/test_bff',
    api_slug: '/_api'
  }],
  port: 1234,
  pre_run_scripts: '__tests__/preRunScripts_empty'
}; 

