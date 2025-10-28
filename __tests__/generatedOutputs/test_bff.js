import express from 'express';
import default_patch_js from './test_bff_config/default/patch.js'
import {handler as test_bff_config_index_js} from './test_bff_config/index.js'
import {handler as test_index_js} from './test_bff_config/test/index.js'
import {handler as test_test_js} from './test_bff_config/test/test.js'

const router = express.Router();

router.patch('/default/patch', default_patch_js);
router.post('/', test_bff_config_index_js);
router.put('/test/', test_index_js);
router.patch('/test/test', test_test_js);

export default router;
    