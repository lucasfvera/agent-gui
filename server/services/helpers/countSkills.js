const { walkDirs } = require('./walkDirs');

function countSkillsInDir(dir) {
  let count = 0;
  walkDirs(dir, '', () => count++);
  return count;
}

function countSkillsRecursively(rootPath, disabledRoot) {
  return countSkillsInDir(rootPath) + countSkillsInDir(disabledRoot);
}

module.exports = { countSkillsInDir, countSkillsRecursively };