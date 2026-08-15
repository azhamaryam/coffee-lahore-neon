const createApp = require('../app');

// A single Express app instance handles every request under /api/*, matched
// by this file's catch-all name. Vercel calls this the same way for every
// invocation, and Express does its own internal routing from there.
module.exports = createApp();
