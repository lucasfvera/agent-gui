const { test, describe } = require('node:test');
const assert = require('node:assert');
const { healthCheck } = require('./healthController');

describe('healthController', () => {
  test('returns 200 with status ok', () => {
    let statusCode = 0;
    let responseBody = '';

    const req = { method: 'GET' };
    const res = {
      writeHead(code) { statusCode = code; return this; },
      end(body) { responseBody = body; }
    };

    healthCheck(req, res);

    assert.strictEqual(statusCode, 200);
    const body = JSON.parse(responseBody);
    assert.strictEqual(body.status, 'ok');
  });

  test('returns uptime', () => {
    const req = { method: 'GET' };
    const res = {
      writeHead() { return this; },
      end(body) {
        const parsed = JSON.parse(body);
        assert.ok(parsed.uptime >= 0);
      }
    };

    healthCheck(req, res);
  });

  test('returns timestamp', () => {
    const req = { method: 'GET' };
    const res = {
      writeHead() { return this; },
      end(body) {
        const parsed = JSON.parse(body);
        assert.ok(typeof parsed.timestamp === 'string');
        assert.ok(parsed.timestamp.includes('T'));
      }
    };

    healthCheck(req, res);
  });
});