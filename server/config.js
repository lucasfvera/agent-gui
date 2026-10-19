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
  { name: 'skills-cursor', searchPath: 'skills-cursor' }
];

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'cache',
  '.cache',
  'tmp',
  '.tmp',
  'plugins',
  'extensions',
  'vendor_imports',
  'logs',
  'sessions',
  'snapshots',
  'memories',
  'history',
  'state',
  'sqlite',
  'temp_disabled_skills'
]);

function isSkippedDir(name) {
  return SKIP_DIRS.has(name);
}

function getRootPath(rootName) {
  if (!ROOTS.includes(rootName)) {
    throw new Error('Invalid root');
  }
  return path.join(HOME, rootName);
}

function isValidRoot(rootName) {
  return ROOTS.includes(rootName);
}

function getDisabledPath(rootName, groupPath = '') {
  const rootPath = getRootPath(rootName);
  return groupPath
    ? path.join(rootPath, 'temp_disabled_skills', groupPath)
    : path.join(rootPath, 'temp_disabled_skills');
}

function isSafePath(basePath, targetPath) {
  const resolved = path.resolve(targetPath);
  const baseResolved = path.resolve(basePath);
  return resolved === baseResolved || resolved.startsWith(baseResolved + path.sep);
}

module.exports = {
  HOME,
  PORT,
  ROOTS,
  MIME_TYPES,
  CURSOR_GROUPS,
  getRootPath,
  getDisabledPath,
  isValidRoot,
  isSafePath,
  isSkippedDir
};