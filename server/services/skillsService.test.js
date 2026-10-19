const { test, describe, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'skillsService-home-'));
process.env.HOME = tmpHome;

const {
  toggleSkill,
  getSkillContent,
  findSkillsInGroup,
  findSkillsRecursively
} = require('./skillsService');
const { isSafePath, HOME } = require('../config');

assert.strictEqual(HOME, tmpHome);

after(() => {
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

function writeSkill(...segments) {
  const dir = path.join(tmpHome, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    '---\ndescription: test skill\n---\n# hello'
  );
  return dir;
}

function skillExists(...segments) {
  return fs.existsSync(path.join(tmpHome, ...segments));
}

describe('toggleSkill — flat skills', () => {
  test('disables and re-enables a top-level skill, preserving content', () => {
    writeSkill('.claude', 'flat-a');

    const before = getSkillContent('.claude', 'flat-a');

    let result = toggleSkill('.claude', 'flat-a');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.enabled, false);
    assert.ok(skillExists('.claude', 'temp_disabled_skills', 'flat-a'));
    assert.strictEqual(skillExists('.claude', 'flat-a'), false);

    const disabledContent = getSkillContent('.claude', 'flat-a');
    assert.ok(disabledContent, 'content readable while disabled');
    assert.strictEqual(disabledContent.content, before.content);

    result = toggleSkill('.claude', 'flat-a');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.enabled, true);
    assert.ok(skillExists('.claude', 'flat-a'));
    assert.strictEqual(skillExists('.claude', 'temp_disabled_skills', 'flat-a'), false);
    assert.strictEqual(getSkillContent('.claude', 'flat-a').content, before.content);
  });

  test('disables and re-enables a nested skill at its full relative path', () => {
    writeSkill('.claude', 'parent', 'child-b');

    let result = toggleSkill('.claude', 'parent/child-b');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, false);
    assert.ok(skillExists('.claude', 'temp_disabled_skills', 'parent', 'child-b'));
    assert.strictEqual(skillExists('.claude', 'parent', 'child-b'), false);

    const disabledContent = getSkillContent('.claude', 'parent/child-b');
    assert.ok(disabledContent, 'content readable while disabled');

    result = toggleSkill('.claude', 'parent/child-b');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, true);
    assert.ok(skillExists('.claude', 'parent', 'child-b'));
  });

  test('reports an error for a missing skill', () => {
    const result = toggleSkill('.claude', 'does-not-exist');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Skill folder not found');
  });

  test('rejects paths containing ..', () => {
    const result = toggleSkill('.claude', 'foo/../../evil');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid path');
    assert.strictEqual(getSkillContent('.claude', '../evil'), null);
  });

  test('rejects in-root paths containing ..', () => {
    writeSkill('.claude', 'guard-skill');

    const result = toggleSkill('.claude', 'foo/../guard-skill');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid path');
    assert.strictEqual(getSkillContent('.claude', 'foo/../guard-skill'), null);
    assert.strictEqual(skillExists('.claude', 'guard-skill'), true);
  });

  test('rejects an empty skill path', () => {
    const result = toggleSkill('.claude', '');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid path');
  });
});

describe('toggleSkill — .cursor group skills', () => {
  test('disables and re-enables a top-level group skill (group-relative path)', () => {
    writeSkill('.cursor', 'skills', 'group-top');

    let result = toggleSkill('.cursor', 'group-top', 'skills');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, false);
    assert.ok(skillExists('.cursor', 'temp_disabled_skills', 'skills', 'group-top'));
    assert.strictEqual(skillExists('.cursor', 'skills', 'group-top'), false);

    result = toggleSkill('.cursor', 'group-top', 'skills');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, true);
    assert.ok(skillExists('.cursor', 'skills', 'group-top'));
  });

  test('disables and re-enables a nested group skill (group-relative path)', () => {
    writeSkill('.cursor', 'skills', 'nested', 'group-nested');

    let result = toggleSkill('.cursor', 'nested/group-nested', 'skills');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, false);
    assert.ok(skillExists('.cursor', 'temp_disabled_skills', 'skills', 'nested', 'group-nested'));
    assert.strictEqual(skillExists('.cursor', 'skills', 'nested', 'group-nested'), false);

    const disabledContent = getSkillContent('.cursor', 'nested/group-nested', 'skills');
    assert.ok(disabledContent, 'content readable while disabled');

    result = toggleSkill('.cursor', 'nested/group-nested', 'skills');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.strictEqual(result.enabled, true);
    assert.ok(skillExists('.cursor', 'skills', 'nested', 'group-nested'));
  });

  test('resolves skill names that collide with the group name', () => {
    writeSkill('.cursor', 'skills', 'skills', 'colliding');

    const result = toggleSkill('.cursor', 'skills/colliding', 'skills');
    assert.strictEqual(result.success, true, JSON.stringify(result));
    assert.ok(skillExists('.cursor', 'temp_disabled_skills', 'skills', 'skills', 'colliding'));

    const restore = toggleSkill('.cursor', 'skills/colliding', 'skills');
    assert.strictEqual(restore.success, true, JSON.stringify(restore));
  });
});

describe('listing reflects enabled state', () => {
  test('findSkillsInGroup marks disabled skills enabled: false', () => {
    writeSkill('.cursor', 'skills', 'listed-skill');
    toggleSkill('.cursor', 'listed-skill', 'skills');

    const listed = findSkillsInGroup('.cursor', 'skills');
    const skill = listed.find(s => s.name === 'listed-skill');
    assert.ok(skill);
    assert.strictEqual(skill.enabled, false);

    toggleSkill('.cursor', 'listed-skill', 'skills');
  });

  test('findSkillsRecursively marks disabled nested skills enabled: false', () => {
    writeSkill('.agents', 'parent', 'listed-nested');
    toggleSkill('.agents', 'parent/listed-nested');

    const listed = findSkillsRecursively('.agents');
    const skill = listed.find(s => s.name === 'listed-nested');
    assert.ok(skill);
    assert.strictEqual(skill.enabled, false);

    toggleSkill('.agents', 'parent/listed-nested');
  });
});

describe('isSafePath', () => {
  test('accepts paths strictly inside the base or the base itself', () => {
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/base'), true);
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/base/child'), true);
  });

  test('rejects sibling directories sharing a name prefix and escapes', () => {
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/base-evil'), false);
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/base-evil/child'), false);
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/other'), false);
    assert.strictEqual(isSafePath('/tmp/base', '/tmp/base/../escape'), false);
  });
});
