import express from 'express';
import test_bff from './__tests__/test_bff.ts';
import test_bff_config from './__tests__/test_bff_config.ts';

const app = express();

app.use('/_api', test_bff);
app.use('/_api2', test_bff_config);

app.listen(1234, () => {
  console.log('Example app listening on port 1234'); 
}); 
  