const fs = require('fs');
const path = require('path');
const { shouldSkip } = require('./shouldSkip');

function walkDirs(dir, relativePath, onSkill) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldSkip(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const currentRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.name === 'SKILL.md') {
        onSkill(fullPath, currentRelative);
      } else if (entry.isDirectory()) {
        walkDirs(fullPath, currentRelative, onSkill);
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
}

module.exports = { walkDirs };