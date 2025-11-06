import middleware_testLogger from './middleware/testLogger.js';
import { middleware as middleware_testMiddleware } from './middleware/testMiddleware.ts';
  
const middleware = {
  'testLogger': middleware_testLogger,
  'testMiddleware': middleware_testMiddleware
};

export default middleware;
  