const { getRoots, findSkillsInGroup, findSkillsRecursively } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');

function handleSkills(req, res, { root, group }) {
  logStart('GET', '/api/skills', { root, group: group || '' });

  if (!root) {
    logEnd('GET', '/api/skills', { root, group: group || '' }, '400');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing root parameter' }));
    return;
  }

  const roots = getRoots();
  const selectedRoot = roots.find(r => r.name === root);

  if (!selectedRoot || !selectedRoot.exists) {
    logEnd('GET', '/api/skills', { root, group: group || '' }, '404');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Root not found' }));
    return;
  }

  let skills;
  if (root === '.cursor' && group) {
    skills = findSkillsInGroup(root, group);
  } else {
    skills = findSkillsRecursively(root);
  }

  logEnd('GET', '/api/skills', { root, group: group || '' }, `200 | Count: ${skills.length}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(skills));
}

module.exports = { handleSkills };