const { test, describe } = require('node:test');
const assert = require('node:assert');
const { shouldSkip } = require('./shouldSkip');

describe('shouldSkip', () => {
  test('skips hidden entries', () => {
    assert.strictEqual(shouldSkip('.git'), true);
    assert.strictEqual(shouldSkip('.DS_Store'), true);
    assert.strictEqual(shouldSkip('.cursor'), true);
  });

  test('skips configured cache and state directories', () => {
    assert.strictEqual(shouldSkip('node_modules'), true);
    assert.strictEqual(shouldSkip('plugins'), true);
    assert.strictEqual(shouldSkip('cache'), true);
    assert.strictEqual(shouldSkip('.cache'), true);
    assert.strictEqual(shouldSkip('tmp'), true);
    assert.strictEqual(shouldSkip('vendor_imports'), true);
    assert.strictEqual(shouldSkip('extensions'), true);
    assert.strictEqual(shouldSkip('sessions'), true);
    assert.strictEqual(shouldSkip('temp_disabled_skills'), true);
  });

  test('keeps skill directories and files', () => {
    assert.strictEqual(shouldSkip('skills'), false);
    assert.strictEqual(shouldSkip('skills-cursor'), false);
    assert.strictEqual(shouldSkip('SKILL.md'), false);
    assert.strictEqual(shouldSkip('frontend-design'), false);
  });
});