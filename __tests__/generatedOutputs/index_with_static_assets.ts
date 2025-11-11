import express from 'express';
import test_bff from './__tests__/test_bff.ts';
import * as path from 'path';

const app = express();

app.use('/assets', express.static(path.join(process.cwd(), 'public')));
app.use('/_api', test_bff);

app.listen(1234, () => {
  console.log('Example app listening on port 1234'); 
}); 
  