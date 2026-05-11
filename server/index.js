const http = require('http');
const path = require('path');
const fs = require('fs');
const { PORT, MIME_TYPES } = require('./config');
const { parseUrl, parseApiPath } = require('./utils/urlParser');
const { handleRoots } = require('./controllers/rootsController');
const { handleGroups } = require('./controllers/groupsController');
const { handleSkills } = require('./controllers/skillsController');
const { handleSkill } = require('./controllers/skillController');
const { handleToggle } = require('./controllers/toggleController');
const { healthCheck } = require('./controllers/healthController');

function serveStatic(url, res) {
  const filePath = url === '/' ? '/index.html' : url;
  const fullPath = path.join(__dirname, '..', 'public', filePath);
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

function handleRequest(req, res) {
  const { pathname, searchParams } = parseUrl(req);
  const segments = parseApiPath(pathname);

  if (pathname === '/api/roots') {
    handleRoots(req, res);
  } else if (pathname.startsWith('/api/groups/') && segments.length === 3) {
    const rootName = segments[2];
    handleGroups(req, res, rootName);
  } else if (pathname === '/api/health') {
    healthCheck(req, res);
  } else if (pathname === '/api/skills') {
    const root = searchParams.get('root');
    const group = searchParams.get('group') || '';
    handleSkills(req, res, { root, group });
  } else if (req.method === 'POST' && pathname.startsWith('/api/skill/toggle/')) {
    const pathParts = pathname.slice(18).split('/');
    const rootName = pathParts[0];
    const skillPath = pathParts.slice(1).join('/');
    const groupPath = searchParams.get('group') || '';
    handleToggle(req, res, { rootName, skillPath, groupPath });
  } else if (pathname.startsWith('/api/skill/') && segments.length >= 3) {
    const rootName = segments[2];
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