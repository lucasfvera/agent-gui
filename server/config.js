const path = require('path');

const HOME = process.env.HOME;
const PORT = 3000;

const ROOTS = ['.claude', '.agents', '.codex', '.gemini', '.cursor', '.opencode', '.warp'];

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const CURSOR_GROUPS = [
  { name: 'skills', searchPath: 'skills' },
  { name: 'skills-cursor', searchPath: 'skills-cursor' },
  { name: 'superpowers', searchPath: 'plugins/cache/cursor-public/superpowers' },
  { name: 'notion-workspace', searchPath: 'plugins/cache/cursor-public/notion-workspace' },
  { name: 'compound-engineering', searchPath: 'plugins/cache/cursor-public/compound-engineering' }
];

function getRootPath(rootName) {
  return path.join(HOME, rootName);
}

function getDisabledPath(rootName, groupPath = '') {
  const rootPath = getRootPath(rootName);
  return groupPath
    ? path.join(rootPath, 'temp_disabled_skills', groupPath)
    : path.join(rootPath, 'temp_disabled_skills');
}

module.exports = {
  HOME,
  PORT,
  ROOTS,
  MIME_TYPES,
  CURSOR_GROUPS,
  getRootPath,
  getDisabledPath
};