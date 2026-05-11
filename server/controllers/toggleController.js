const { toggleSkill } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');

function handleToggle(req, res, { rootName, skillPath, groupPath }) {
  const skillName = skillPath.split('/').pop();
  logStart('POST', `/api/skill/toggle/${rootName}/${skillPath}`, { rootName, skillPath, groupPath, skillName });

  const result = toggleSkill(rootName, skillPath, groupPath);

  if (result.success) {
    logEnd('POST', `/api/skill/toggle/${rootName}/${skillPath}`, { rootName, skillPath }, `200 | Enabled: ${result.enabled}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, enabled: result.enabled }));
  } else {
    logEnd('POST', `/api/skill/toggle/${rootName}/${skillPath}`, { rootName, skillPath }, `404 | Error: ${result.error}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: result.error }));
  }
}

module.exports = { handleToggle };