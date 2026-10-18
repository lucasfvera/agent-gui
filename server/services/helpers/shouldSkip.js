const { isSkippedDir } = require('../../config');

function shouldSkip(name) {
  return name.startsWith('.') || isSkippedDir(name);
}

module.exports = { shouldSkip };