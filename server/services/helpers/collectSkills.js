const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../parserService');
const { walkDirs } = require('./walkDirs');

function collectSkillsInDir(dir, isEnabled) {
  const skills = [];
  walkDirs(dir, '', (fullPath, relativePath) => {
    const skillDir = path.dirname(fullPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    skills.push({
      name: path.basename(skillDir),
      path: relativePath.replace('/SKILL.md', ''),
      fullPath,
      enabled: isEnabled,
      description: frontmatter.description || 'No description'
    });
  });
  return skills;
}

module.exports = { collectSkillsInDir };