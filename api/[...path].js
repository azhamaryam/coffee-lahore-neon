const createApp = require('../app');

const app = createApp();

module.exports = (req, res) => {
  return app(req, res);
};