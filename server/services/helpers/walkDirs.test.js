const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { walkDirs } = require('./walkDirs');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'walkDirs-'));
}

describe('walkDirs', () => {
  test('visits every SKILL.md with full path and relative path', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'skills', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'SKILL.md'), '# root');
      fs.writeFileSync(path.join(tmp, 'skills', 'SKILL.md'), '# skills');
      fs.writeFileSync(path.join(tmp, 'skills', 'nested', 'SKILL.md'), '# nested');

      const found = [];
      walkDirs(tmp, '', (fullPath, relativePath) => {
        found.push({ fullPath, relativePath });
      });

      assert.strictEqual(found.length, 3);
      const relatives = found.map(f => f.relativePath).sort();
      assert.deepStrictEqual(relatives, ['SKILL.md', 'skills/SKILL.md', 'skills/nested/SKILL.md']);
      found.forEach(f => assert.ok(fs.existsSync(f.fullPath)));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('skips hidden and configured cache directories', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'real-skill'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.hidden'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'plugins'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'node_modules', 'pkg'), { recursive: true });

      fs.writeFileSync(path.join(tmp, 'real-skill', 'SKILL.md'), '# real');
      fs.writeFileSync(path.join(tmp, '.hidden', 'SKILL.md'), '# hidden');
      fs.writeFileSync(path.join(tmp, 'plugins', 'SKILL.md'), '# plugin');
      fs.writeFileSync(path.join(tmp, 'node_modules', 'pkg', 'SKILL.md'), '# dep');

      const found = [];
      walkDirs(tmp, '', (fullPath, relativePath) => found.push(relativePath));

      assert.deepStrictEqual(found, ['real-skill/SKILL.md']);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('honors a starting relative path prefix', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'group', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'group', 'SKILL.md'), '# group');
      fs.writeFileSync(path.join(tmp, 'group', 'nested', 'SKILL.md'), '# nested');

      const found = [];
      walkDirs(path.join(tmp, 'group'), 'group', (fullPath, relativePath) => {
        found.push(relativePath);
      });

      assert.deepStrictEqual(found.sort(), ['group/SKILL.md', 'group/nested/SKILL.md']);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('does not throw when directory does not exist', () => {
    const found = [];
    walkDirs(path.join(os.tmpdir(), 'does-not-exist-walkdirs'), '', () => found.push(1));
    assert.strictEqual(found.length, 0);
  });
});