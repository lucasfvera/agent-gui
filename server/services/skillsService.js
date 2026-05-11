const { ROOTS, CURSOR_GROUPS, getRootPath, getDisabledPath } = require('../config');
const { parseFrontmatter } = require('./parserService');
const fs = require('fs');
const path = require('path');

function getRoots() {
  return ROOTS.map(rootName => {
    const rootPath = getRootPath(rootName);
    const exists = fs.existsSync(rootPath);

    let skillCount = 0;
    if (exists) {
      skillCount = countSkillsRecursively(rootPath);
    }

    return {
      name: rootName,
      exists,
      skillCount,
      hasGroups: rootName === '.cursor'
    };
  });
}

function countSkillsRecursively(rootPath) {
  let count = 0;

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.name === 'SKILL.md') {
          count++;
        } else if (entry.isDirectory()) {
          walk(fullPath);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }

  walk(rootPath);
  return count;
}

function getGroupsForCursor() {
  const rootPath = getRootPath('.cursor');
  const groups = [];

  function findSkillsInDir(dir) {
    let count = 0;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.name === 'SKILL.md') {
          count++;
        } else if (entry.isDirectory()) {
          count += findSkillsInDir(fullPath);
        }
      }
    } catch (e) {}
    return count;
  }

  for (const dir of CURSOR_GROUPS) {
    const fullPath = path.join(rootPath, dir.searchPath);
    if (fs.existsSync(fullPath)) {
      const count = findSkillsInDir(fullPath);
      if (count > 0) {
        groups.push({
          name: dir.name,
          path: dir.searchPath,
          skillCount: count
        });
      }
    }
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

function findSkillsInGroup(rootName, groupPath) {
  const rootPath = getRootPath(rootName);
  const groupFullPath = path.join(rootPath, groupPath);
  const disabledRoot = getDisabledPath(rootName, groupPath);
  const skills = [];

  function walk(dir, relativePath = '', isEnabled = true) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);
        const currentRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.name === 'SKILL.md') {
          const skillDir = path.dirname(fullPath);
          const folderName = path.basename(skillDir);

          const content = fs.readFileSync(fullPath, 'utf-8');
          const frontmatter = parseFrontmatter(content);

          skills.push({
            name: folderName,
            path: currentRelative.replace('/SKILL.md', ''),
            fullPath: fullPath,
            enabled: isEnabled,
            description: frontmatter.description || 'No description'
          });
        } else if (entry.isDirectory()) {
          walk(fullPath, currentRelative, isEnabled);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }

  if (fs.existsSync(groupFullPath)) {
    walk(groupFullPath, '', true);
  }

  if (fs.existsSync(disabledRoot)) {
    walk(disabledRoot, '', false);
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function findSkillsRecursively(rootName) {
  const rootPath = getRootPath(rootName);
  const disabledRoot = getDisabledPath(rootName);
  const skills = [];

  function walk(dir, relativePath = '', isEnabled = true) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);
        const currentRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.name === 'SKILL.md') {
          const skillDir = path.dirname(fullPath);
          const folderName = path.basename(skillDir);

          const content = fs.readFileSync(fullPath, 'utf-8');
          const frontmatter = parseFrontmatter(content);

          skills.push({
            name: folderName,
            path: currentRelative.replace('/SKILL.md', ''),
            fullPath: fullPath,
            enabled: isEnabled,
            description: frontmatter.description || 'No description'
          });
        } else if (entry.isDirectory()) {
          walk(fullPath, currentRelative, isEnabled);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }

  walk(rootPath, '', true);
  if (fs.existsSync(disabledRoot)) {
    walk(disabledRoot, '', false);
  }

  return skills.sort((a, b) => a.name.localeCompare(b.path));
}

function getSkillContent(rootName, skillPath, groupPath = '') {
  const rootPath = getRootPath(rootName);
  
  const skillName = skillPath.split('/').pop();
  
  const fullSkillPath = groupPath 
    ? path.join(groupPath, skillName)
    : skillPath;

  const enabledPath = path.join(rootPath, fullSkillPath, 'SKILL.md');
  const disabledPath = groupPath
    ? path.join(rootPath, 'temp_disabled_skills', groupPath, skillName, 'SKILL.md')
    : path.join(rootPath, 'temp_disabled_skills', skillName, 'SKILL.md');

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

  const fullEnabledPath = groupPath
    ? path.join(rootPath, groupPath, skillName)
    : path.join(rootPath, skillPath);

  const fullDisabledPath = groupPath
    ? path.join(disabledRoot, groupPath, skillName)
    : path.join(disabledRoot, skillName);

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