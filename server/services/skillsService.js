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

  if (!skillPath || skillPath.includes('..') || (groupPath && groupPath.includes('..'))) {
    return null;
  }

  const fullSkillPath = groupPath
    ? path.join(groupPath, skillPath)
    : skillPath;

  const enabledPath = path.join(rootPath, fullSkillPath, 'SKILL.md');
  const disabledPath = path.join(getDisabledPath(rootName), fullSkillPath, 'SKILL.md');

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

  let relativePath = skillPath;
  if (groupPath && relativePath.startsWith(`${groupPath}/`)) {
    relativePath = relativePath.slice(groupPath.length + 1);
  }

  if (!relativePath || relativePath.includes('..') || (groupPath && groupPath.includes('..'))) {
    return { success: false, error: 'Invalid path' };
  }

  const fullEnabledPath = groupPath
    ? path.join(rootPath, groupPath, relativePath)
    : path.join(rootPath, relativePath);

  const fullDisabledPath = groupPath
    ? path.join(disabledRoot, groupPath, relativePath)
    : path.join(disabledRoot, relativePath);

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
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
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