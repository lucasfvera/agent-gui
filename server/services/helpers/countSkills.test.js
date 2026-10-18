const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { countSkillsInDir, countSkillsRecursively } = require('./countSkills');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('countSkillsInDir', () => {
  test('counts SKILL.md files recursively', () => {
    const tmp = makeTempDir('countSkills-');
    try {
      fs.mkdirSync(path.join(tmp, 'a', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'a', 'SKILL.md'), '# a');
      fs.writeFileSync(path.join(tmp, 'a', 'nested', 'SKILL.md'), '# nested');

      assert.strictEqual(countSkillsInDir(tmp), 2);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('ignores hidden and configured cache directories', () => {
    const tmp = makeTempDir('countSkills-');
    try {
      fs.mkdirSync(path.join(tmp, 'real'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'node_modules'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.hidden'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'real', 'SKILL.md'), '# real');
      fs.writeFileSync(path.join(tmp, 'node_modules', 'SKILL.md'), '# dep');
      fs.writeFileSync(path.join(tmp, '.hidden', 'SKILL.md'), '# hidden');

      assert.strictEqual(countSkillsInDir(tmp), 1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('returns 0 when directory does not exist', () => {
    assert.strictEqual(countSkillsInDir(path.join(os.tmpdir(), 'does-not-exist-count')), 0);
  });
});

describe('countSkillsRecursively', () => {
  test('sums skills across the enabled and disabled roots', () => {
    const root = makeTempDir('countSkills-root-');
    const disabled = makeTempDir('countSkills-disabled-');
    try {
      fs.mkdirSync(path.join(root, 'skill-a'), { recursive: true });
      fs.mkdirSync(path.join(root, 'skill-b'), { recursive: true });
      fs.mkdirSync(path.join(disabled, 'skill-c'), { recursive: true });
      fs.writeFileSync(path.join(root, 'skill-a', 'SKILL.md'), '# a');
      fs.writeFileSync(path.join(root, 'skill-b', 'SKILL.md'), '# b');
      fs.writeFileSync(path.join(disabled, 'skill-c', 'SKILL.md'), '# c');

      assert.strictEqual(countSkillsRecursively(root, disabled), 3);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(disabled, { recursive: true, force: true });
    }
  });

  test('returns 0 when both roots are missing', () => {
    assert.strictEqual(
      countSkillsRecursively(
        path.join(os.tmpdir(), 'missing-root'),
        path.join(os.tmpdir(), 'missing-disabled')
      ),
      0
    );
  });
});