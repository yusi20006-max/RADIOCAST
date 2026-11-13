import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import {
  isBlockedIp,
  isProviderUrlError,
  parseProviderBaseUrl,
  providerPostJson,
} from '../server/providerUrlGuard.ts';

describe('isBlockedIp', () => {
  const blocked = [
    '0.0.0.0', '127.0.0.1', '127.255.255.254', '10.0.0.5', '172.16.0.1', '172.31.255.255',
    '192.168.1.1', '169.254.169.254', '100.64.0.1', '224.0.0.1', '240.0.0.1', '255.255.255.255',
    '192.0.2.10', '198.18.0.1',
    '::', '::1', 'fe80::1', 'fc00::1', 'fd12:3456::1', 'ff02::1', '2001:db8::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '::ffff:10.0.0.1',
    '64:ff9b::7f00:1', '::127.0.0.1', '2002:7f00:1::1',
    'not-an-ip', '',
  ];
  const allowed = [
    '8.8.8.8', '1.1.1.1', '172.15.255.255', '172.32.0.1', '100.63.255.255', '100.128.0.1',
    '2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8',
  ];

  for (const ip of blocked) test(`blocks ${JSON.stringify(ip)}`, () => assert.equal(isBlockedIp(ip), true));
  for (const ip of allowed) test(`allows ${ip}`, () => assert.equal(isBlockedIp(ip), false));
});

describe('parseProviderBaseUrl', () => {
  const rejected = [
    'http://api.openai.com/v1',
    'ftp://example.com',
    'file:///etc/passwd',
    'https://user:pass@api.openai.com/v1',
    'https://127.0.0.1/v1',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/v1',
    'https://[::ffff:7f00:1]/v1',
    'https://2130706433/v1', // decimal form of 127.0.0.1
    'https://0x7f.1/v1', // hex/short form of 127.0.0.1
    'not a url',
    '',
    undefined,
    42,
  ];

  for (const raw of rejected) {
    test(`rejects ${JSON.stringify(raw)}`, () => {
      assert.throws(() => parseProviderBaseUrl(raw, false), (e) => isProviderUrlError(e));
    });
  }

  test('legacy numeric host forms are normalized before the IP check', () => {
    // WHATWG URL turns 010.0.0.1 into 8.0.0.1 (a public address), so it is judged as such.
    assert.equal(parseProviderBaseUrl('https://010.0.0.1/v1', false).hostname, '8.0.0.1');
  });

  test('accepts a public https URL and keeps the path', () => {
    const url = parseProviderBaseUrl('https://api.openai.com/v1/', false);
    assert.equal(url.hostname, 'api.openai.com');
    assert.equal(url.pathname, '/v1/');
  });

  test('allowPrivate permits http and loopback for local development', () => {
    assert.doesNotThrow(() => parseProviderBaseUrl('http://127.0.0.1:11434/v1', true));
    assert.doesNotThrow(() => parseProviderBaseUrl('http://localhost:11434/v1', true));
  });

  test('credentials are rejected even with allowPrivate', () => {
    assert.throws(() => parseProviderBaseUrl('http://u:p@localhost:11434/v1', true), (e) => isProviderUrlError(e));
  });
});

describe('providerPostJson against a local server', () => {
  let server: http.Server;
  let base = '';
  let hits: string[] = [];

  before(async () => {
    server = http.createServer((req, res) => {
      hits.push(`${req.method} ${req.url}`);
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (req.url === '/redirect/chat/completions') {
          res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data' });
          return res.end();
        }
        if (req.url === '/big/chat/completions') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end('x'.repeat(100_000));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ echo: JSON.parse(body), auth: req.headers.authorization }));
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => new Promise<void>((r) => server.close(() => r())));

  const common = { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer k' }, timeoutMs: 5000, maxResponseBytes: 1_000_000 };

  test('default policy refuses to connect to loopback (no request reaches the server)', async () => {
    hits = [];
    await assert.rejects(() => providerPostJson(base, '/chat/completions', { ...common, body: '{}', allowPrivate: false }), (e) => isProviderUrlError(e));
    assert.deepEqual(hits, []);
  });

  test('hostname that resolves to loopback is refused at connect time', async () => {
    hits = [];
    const port = new URL(base).port;
    await assert.rejects(
      () => providerPostJson(`https://localhost:${port}`, '/chat/completions', { ...common, body: '{}', allowPrivate: false }),
      (e) => isProviderUrlError(e),
    );
    assert.deepEqual(hits, []);
  });

  test('allowPrivate lets local development reach the server and forwards headers/body', async () => {
    const res = await providerPostJson(base, '/chat/completions', { ...common, body: JSON.stringify({ a: 1 }), allowPrivate: true });
    assert.equal(res.ok, true);
    assert.deepEqual(JSON.parse(res.text), { echo: { a: 1 }, auth: 'Bearer k' });
  });

  test('redirects are not followed', async () => {
    hits = [];
    const res = await providerPostJson(`${base}/redirect`, '/chat/completions', { ...common, body: '{}', allowPrivate: true });
    assert.equal(res.status, 302);
    assert.equal(res.ok, false);
    assert.deepEqual(hits, ['POST /redirect/chat/completions']);
  });

  test('oversized responses are rejected', async () => {
    await assert.rejects(
      () => providerPostJson(`${base}/big`, '/chat/completions', { ...common, body: '{}', allowPrivate: true, maxResponseBytes: 1000 }),
      /بیش از حد بزرگ/,
    );
  });

  test('total timeout is enforced', async () => {
    const slow = http.createServer(() => {});
    await new Promise<void>((r) => slow.listen(0, '127.0.0.1', r));
    const slowBase = `http://127.0.0.1:${(slow.address() as AddressInfo).port}`;
    try {
      await assert.rejects(
        () => providerPostJson(slowBase, '/chat/completions', { ...common, body: '{}', allowPrivate: true, timeoutMs: 300 }),
        /زمان پاسخ/,
      );
    } finally {
      slow.closeAllConnections();
      await new Promise<void>((r) => slow.close(() => r()));
    }
  });
});
