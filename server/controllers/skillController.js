const { getSkillContent } = require('../services/skillsService');
const { logStart, logEnd } = require('../utils/logger');

function handleSkill(req, res, { rootName, skillPath, groupPath }) {
  logStart('GET', `/api/skill/${rootName}/${skillPath}`, { rootName, skillPath, groupPath });

  const skill = getSkillContent(rootName, skillPath, groupPath);

  if (skill) {
    logEnd('GET', `/api/skill/${rootName}/${skillPath}`, { rootName, skillPath, groupPath }, '200');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skill));
  } else {
    logEnd('GET', `/api/skill/${rootName}/${skillPath}`, { rootName, skillPath, groupPath }, '404');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Skill not found' }));
  }
}

module.exports = { handleSkill };