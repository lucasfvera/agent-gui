const { ROOTS, CURSOR_GROUPS, getRootPath, getDisabledPath, isSafePath } = require('../config');
const { countSkillsInDir } = require('./helpers/countSkills');
const { collectSkillsInDir } = require('./helpers/collectSkills');
const fs = require('fs');
const path = require('path');

function getRoots() {
  return ROOTS.map(rootName => {
    const rootPath = getRootPath(rootName);
    const exists = fs.existsSync(rootPath);
    const disabledPath = getDisabledPath(rootName);

    const enabledCount = exists ? countSkillsInDir(rootPath) : 0;
    const disabledCount = exists ? countSkillsInDir(disabledPath) : 0;

    return {
      name: rootName,
      exists,
      skillCount: enabledCount + disabledCount,
      enabledCount,
      disabledCount,
      hasGroups: rootName === '.cursor'
    };
  });
}

function getGroupsForCursor() {
  const rootPath = getRootPath('.cursor');
  const groups = [];

  for (const dir of CURSOR_GROUPS) {
    const groupPath = path.join(rootPath, dir.searchPath);
    const disabledPath = getDisabledPath('.cursor', dir.searchPath);
    const enabledCount = countSkillsInDir(groupPath);
    const disabledCount = countSkillsInDir(disabledPath);
    if (enabledCount + disabledCount > 0) {
      groups.push({
        name: dir.name,
        path: dir.searchPath,
        skillCount: enabledCount + disabledCount,
        enabledCount,
        disabledCount
      });
    }
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

function findSkillsInGroup(rootName, groupPathName) {
  const rootPath = getRootPath(rootName);
  const groupFullPath = path.join(rootPath, groupPathName);
  const disabledRoot = getDisabledPath(rootName, groupPathName);

  const skills = [
    ...collectSkillsInDir(groupFullPath, true),
    ...collectSkillsInDir(disabledRoot, false)
  ];

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function findSkillsRecursively(rootName) {
  const rootPath = getRootPath(rootName);
  const disabledRoot = getDisabledPath(rootName);

  const skills = [
    ...collectSkillsInDir(rootPath, true),
    ...collectSkillsInDir(disabledRoot, false)
  ];

  return skills.sort((a, b) => a.name.localeCompare(b.path));
}

function getSkillContent(rootName, skillPath, groupPath = '') {
  const rootPath = getRootPath(rootName);
  
  const skillName = skillPath.split('/').pop();

  if (skillName.includes('..') || (groupPath && groupPath.includes('..'))) {
    return null;
  }
  
  const fullSkillPath = groupPath 
    ? path.join(groupPath, skillName)
    : skillPath;

  const enabledPath = path.join(rootPath, fullSkillPath, 'SKILL.md');
  const disabledPath = groupPath
    ? path.join(rootPath, 'temp_disabled_skills', groupPath, skillName, 'SKILL.md')
    : path.join(rootPath, 'temp_disabled_skills', skillName, 'SKILL.md');

  if (!isSafePath(rootPath, enabledPath) || !isSafePath(rootPath, disabledPath)) {
    return null;
  }

  let skillFullPath;
  if (fs.existsSync(enabledPath)) {
    skillFullPath = enabledPath;
  } else if (fs.existsSync(disabledPath)) {
    skillFullPath = disabledPath;
  } else {
    return null;
  }

  const content = fs.readFileSync(skillFullPath, 'utf-8');

  const refsDir = path.dirname(skillFullPath);
  let references = [];

  if (fs.existsSync(refsDir)) {
    try {
      const refFiles = fs.readdirSync(refsDir);
      references = refFiles
        .filter(f => f.endsWith('.md') && f.startsWith('reference'))
        .map(file => ({
          name: file.replace('.md', ''),
          content: fs.readFileSync(path.join(refsDir, file), 'utf-8')
        }));
    } catch (e) {
      // Ignore permission errors
    }
  }

  return { content, references };
}

function toggleSkill(rootName, skillPath, groupPath = '') {
  const rootPath = getRootPath(rootName);
  const disabledRoot = getDisabledPath(rootName);
  
  const skillName = skillPath.split('/').pop();

  if (skillName.includes('..') || (groupPath && groupPath.includes('..'))) {
    return { success: false, error: 'Invalid path' };
  }

  const fullEnabledPath = groupPath
    ? path.join(rootPath, groupPath, skillName)
    : path.join(rootPath, skillPath);

  const fullDisabledPath = groupPath
    ? path.join(disabledRoot, groupPath, skillName)
    : path.join(disabledRoot, skillName);

  if (!isSafePath(rootPath, fullEnabledPath) || !isSafePath(rootPath, fullDisabledPath)) {
    return { success: false, error: 'Invalid path' };
  }

  const isCurrentlyEnabled = fs.existsSync(fullEnabledPath);

  let currentPath, newPath;
  if (isCurrentlyEnabled) {
    currentPath = fullEnabledPath;
    newPath = fullDisabledPath;
  } else if (fs.existsSync(fullDisabledPath)) {
    currentPath = fullDisabledPath;
    newPath = fullEnabledPath;
  } else {
    return { success: false, error: 'Skill folder not found' };
  }

  const newEnabled = !isCurrentlyEnabled;

  try {
    if (!fs.existsSync(disabledRoot)) {
      fs.mkdirSync(disabledRoot, { recursive: true });
    }
    if (groupPath) {
      const groupDisabledDir = path.join(disabledRoot, groupPath);
      if (!fs.existsSync(groupDisabledDir)) {
        fs.mkdirSync(groupDisabledDir, { recursive: true });
      }
    }
    fs.renameSync(currentPath, newPath);
    return { success: true, enabled: newEnabled };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  getRoots,
  getGroupsForCursor,
  findSkillsInGroup,
  findSkillsRecursively,
  getSkillContent,
  toggleSkill
};