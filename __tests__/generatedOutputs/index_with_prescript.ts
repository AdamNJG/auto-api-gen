import '../__tests__/preRunScripts/doStuff.js';
import express from 'express';
import test_bff from './__tests__/test_bff.ts';

const app = express();

app.use('/_api', test_bff);

app.listen(1234, () => {
  console.log('Example app listening on port 1234'); 
}); 
  