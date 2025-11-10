import testLogger from './middleware/testLogger.js';
import { middleware as testMiddleware } from './middleware/testMiddleware.ts';

const middleware = {
  'testLogger': testLogger,
  'testMiddleware': testMiddleware
};

export default middleware;
  