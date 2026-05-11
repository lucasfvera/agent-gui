const { test, describe } = require('node:test');
const assert = require('node:assert');
const { parseUrl, parseApiPath } = require('./urlParser');

describe('urlParser', () => {
  describe('parseUrl', () => {
    test('parses simple path', () => {
      const req = { url: '/api/roots' };
      const result = parseUrl(req);
      assert.strictEqual(result.pathname, '/api/roots');
    });

    test('parses path with query params', () => {
      const req = { url: '/api/skills?root=.cursor&group=skills' };
      const result = parseUrl(req);
      assert.strictEqual(result.pathname, '/api/skills');
      assert.strictEqual(result.searchParams.get('root'), '.cursor');
      assert.strictEqual(result.searchParams.get('group'), 'skills');
    });

    test('handles malformed URL gracefully', () => {
      const req = { url: '/api/skill toggle/bad' };
      const result = parseUrl(req);
      assert.ok(result.pathname);
    });
  });

  describe('parseApiPath', () => {
    test('splits path into segments', () => {
      const result = parseApiPath('/api/roots');
      assert.deepStrictEqual(result, ['api', 'roots']);
    });

    test('handles encoded characters', () => {
      const result = parseApiPath('/api/skill/.cursor/skill-name');
      assert.deepStrictEqual(result, ['api', 'skill', '.cursor', 'skill-name']);
    });
  });
});