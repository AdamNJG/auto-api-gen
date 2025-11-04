import middleware_testLogger from './middleware/testLogger.js';
import { handler as middleware_testMiddleware } from './middleware/testMiddleware.js';
  
const middleware = {
  'testLogger': middleware_testLogger,
  'testMiddleware': middleware_testMiddleware
};

export default middleware;
  