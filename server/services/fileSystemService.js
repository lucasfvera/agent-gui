const fs = require('fs');
const path = require('path');

function existsSync(filePath) {
  return fs.existsSync(filePath);
}

function readFileSync(filePath, encoding = 'utf-8') {
  return fs.readFileSync(filePath, encoding);
}

function readdirSync(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true });
}

function mkdirSync(dirPath, options = {}) {
  return fs.mkdirSync(dirPath, options);
}

function renameSync(oldPath, newPath) {
  return fs.renameSync(oldPath, newPath);
}

function isDirectory(entry) {
  return entry.isDirectory();
}

function getBasename(filePath) {
  return path.basename(filePath);
}

function getDirname(filePath) {
  return path.dirname(filePath);
}

function join(...paths) {
  return path.join(...paths);
}

function getExtension(filePath) {
  return path.extname(filePath);
}

module.exports = {
  existsSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  renameSync,
  isDirectory,
  getBasename,
  getDirname,
  join,
  getExtension
};