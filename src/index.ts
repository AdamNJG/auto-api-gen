import express from 'express';
import EndpointGenerator from './endpointGenerator/endpointGenerator.js';
import * as path from 'path';
import { loadConfig } from './configLoader/configLoader.js';

export const app = express();

(async () => {
  const config = await loadConfig();

  if (config == undefined || config.api_folders.length === 0) {
    console.error('autoapi.config not present or has no api_folders present');
    return 1;
  }

  for (const apiFolder of config.api_folders) {
    const endpointGenerator = await EndpointGenerator.create(apiFolder.directory, path.resolve(config.endpointFolder, apiFolder.directory.replace('./', '') + '.js'));

    const router = await endpointGenerator.getRouter();

    if (router === undefined) {
      console.warn('router not valid, skipping', `/${apiFolder.api_slug}`);
      continue;
    }

    app.use(`/${apiFolder.api_slug}`, router); 
  }

  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`); 
  });  
})();