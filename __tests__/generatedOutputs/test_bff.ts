import express from 'express';
import default_patch from './test_bff_config/default/patch.js';
import { handler as test_bff_config_index } from './test_bff_config/index.js';
import { handler as test_index } from './test_bff_config/test/index.js';
import { handler as test_test } from './test_bff_config/test/test.js';

const router = express.Router();

router.patch('/default/patch', default_patch);
router.post('/', test_bff_config_index);
router.put('/test/', test_index);
router.patch('/test/test', test_test);

export default router;
    