const { test, describe } = require('node:test');
const assert = require('node:assert');
const { parseFrontmatter } = require('./parserService');

describe('parserService', () => {
  test('parses frontmatter with description', () => {
    const content = `---
name: Test Skill
description: A test skill
---

# Content here`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.name, 'Test Skill');
    assert.strictEqual(result.description, 'A test skill');
  });

  test('returns empty object when no frontmatter', () => {
    const content = `# Just content`;
    const result = parseFrontmatter(content);
    assert.deepStrictEqual(result, {});
  });

  test('handles quoted values', () => {
    const content = `---
name: "Quoted Name"
description: 'Single quoted'
---`;
    const result = parseFrontmatter(content);
    assert.strictEqual(result.name, 'Quoted Name');
    assert.strictEqual(result.description, 'Single quoted');
  });
});