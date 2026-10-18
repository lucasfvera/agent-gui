const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { collectSkillsInDir } = require('./collectSkills');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'collectSkills-'));
}

describe('collectSkillsInDir', () => {
  test('builds skill objects with name, path, enabled and parsed description', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'frontend-design'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'no-frontmatter'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, 'frontend-design', 'SKILL.md'),
        '---\ndescription: Design great UIs\n---\n# Content'
      );
      fs.writeFileSync(path.join(tmp, 'no-frontmatter', 'SKILL.md'), '# Just content');

      const skills = collectSkillsInDir(tmp, true);

      assert.strictEqual(skills.length, 2);

      const design = skills.find(s => s.name === 'frontend-design');
      assert.strictEqual(design.path, 'frontend-design');
      assert.strictEqual(design.enabled, true);
      assert.strictEqual(design.description, 'Design great UIs');
      assert.strictEqual(design.fullPath, path.join(tmp, 'frontend-design', 'SKILL.md'));

      const plain = skills.find(s => s.name === 'no-frontmatter');
      assert.strictEqual(plain.description, 'No description');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('applies the provided enabled state to every skill', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'disabled-skill'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'disabled-skill', 'SKILL.md'), '# content');

      const skills = collectSkillsInDir(tmp, false);

      assert.strictEqual(skills.length, 1);
      assert.strictEqual(skills[0].enabled, false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('builds relative paths for nested skills', () => {
    const tmp = makeTempDir();
    try {
      fs.mkdirSync(path.join(tmp, 'parent', 'child'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'parent', 'child', 'SKILL.md'), '# nested');

      const skills = collectSkillsInDir(tmp, true);

      assert.strictEqual(skills.length, 1);
      assert.strictEqual(skills[0].path, 'parent/child');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('returns empty array when directory does not exist', () => {
    const skills = collectSkillsInDir(path.join(os.tmpdir(), 'does-not-exist-collect'), true);
    assert.deepStrictEqual(skills, []);
  });
});