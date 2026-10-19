const { getGroupsForRoot } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');
const { hasGroups } = require('../config');

function handleGroups(req, res, rootName) {
  logStart('GET', `/api/groups/${rootName}`, { rootName });

  if (!hasGroups(rootName)) {
    logEnd('GET', `/api/groups/${rootName}`, { rootName }, '404');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Groups not supported for this root' }));
    return;
  }

  const groups = getGroupsForRoot(rootName);
  logEnd('GET', `/api/groups/${rootName}`, { rootName }, '200');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(groups));
}

module.exports = { handleGroups };