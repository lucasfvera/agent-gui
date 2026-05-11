const { getGroupsForCursor } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');

function handleGroups(req, res, rootName) {
  logStart('GET', `/api/groups/${rootName}`, { rootName });

  if (rootName !== '.cursor') {
    logEnd('GET', `/api/groups/${rootName}`, { rootName }, '404');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Groups only supported for .cursor' }));
    return;
  }

  const groups = getGroupsForCursor();
  logEnd('GET', `/api/groups/${rootName}`, { rootName }, '200');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(groups));
}

module.exports = { handleGroups };