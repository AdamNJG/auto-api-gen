import express from 'express';
import test_bff from './__tests__/test_bff.ts';
import middleware from './middleware.ts';

const app = express();
const appMiddleware = ['testLogger', 'testMiddleware'];

app.use('/_api', appMiddleware.map(k => middleware[k]), test_bff);

app.listen(1234, () => {
  console.log('Example app listening on port 1234'); 
}); 