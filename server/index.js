const http = require('http');
const path = require('path');
const fs = require('fs');
const { PORT, MIME_TYPES, isValidRoot, isSafePath } = require('./config');
const { parseUrl, parseApiPath } = require('./utils/urlParser');
const { handleRoots } = require('./controllers/rootsController');
const { handleGroups } = require('./controllers/groupsController');
const { handleSkills } = require('./controllers/skillsController');
const { handleSkill } = require('./controllers/skillController');
const { handleToggle } = require('./controllers/toggleController');
const { healthCheck } = require('./controllers/healthController');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function serveStatic(url, res) {
  const filePath = url === '/' ? '/index.html' : url;
  const fullPath = path.join(PUBLIC_DIR, filePath);
  
  if (!isSafePath(PUBLIC_DIR, fullPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

function handleRequest(req, res) {
  const { pathname, searchParams } = parseUrl(req);
  const segments = parseApiPath(pathname);

  if (pathname === '/api/roots') {
    handleRoots(req, res);
  } else if (pathname.startsWith('/api/groups/') && segments.length === 3) {
    const rootName = segments[2];
    if (!isValidRoot(rootName)) {
      sendError(res, 400, 'Invalid root');
      return;
    }
    handleGroups(req, res, rootName);
  } else if (pathname === '/api/health') {
    healthCheck(req, res);
  } else if (pathname === '/api/skills') {
    const root = searchParams.get('root');
    if (!isValidRoot(root)) {
      sendError(res, 400, 'Invalid root');
      return;
    }
    const group = searchParams.get('group') || '';
    handleSkills(req, res, { root, group });
  } else if (req.method === 'POST' && pathname.startsWith('/api/skill/toggle/')) {
    const pathParts = pathname.slice(18).split('/');
    const rootName = pathParts[0];
    if (!isValidRoot(rootName)) {
      sendError(res, 400, 'Invalid root');
      return;
    }
    const skillPath = pathParts.slice(1).join('/');
    const groupPath = searchParams.get('group') || '';
    handleToggle(req, res, { rootName, skillPath, groupPath });
  } else if (pathname.startsWith('/api/skill/') && segments.length >= 3) {
    const rootName = segments[2];
    if (!isValidRoot(rootName)) {
      sendError(res, 400, 'Invalid root');
      return;
    }
    const skillPath = segments.slice(3).join('/');
    const groupPath = searchParams.get('group') || '';
    handleSkill(req, res, { rootName, skillPath, groupPath });
  } else {
    serveStatic(pathname, res);
  }
}

function createServer() {
  return http.createServer(handleRequest);
}

module.exports = { createServer, handleRequest };