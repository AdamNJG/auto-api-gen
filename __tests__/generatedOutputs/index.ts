import express from 'express';
import test_bff from './__tests__/test_bff.js';

const app = express();

app.use('/_api', test_bff);

app.listen(1234, () => {
  console.log('Example app listening on port 1234'); 
}); 
  