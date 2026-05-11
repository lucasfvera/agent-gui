const { getRoots } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');

function handleRoots(req, res) {
  logStart('GET', '/api/roots', {});
  const result = getRoots();
  logEnd('GET', '/api/roots', {}, '200');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

module.exports = { handleRoots };