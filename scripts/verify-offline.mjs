import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = await readFile('dist/sw.js', 'utf8');
const handlers = {};
const cached = new Map();
let precached = [];
const deleted = [];
let fetches = 0;
const cache = {
  async addAll(urls) {
    precached = urls;
    for (const url of urls) {
      const bytes = await readFile(resolve('dist', url));
      assert(bytes.length > 0, `${url} must not be empty`);
      cached.set(new URL(url, 'https://example.test/prayer/').href, new Response(bytes));
    }
  },
  async match(request) {
    const url = new URL(typeof request === 'string' ? request : request.url);
    url.search = '';
    return cached.get(url.href)?.clone();
  },
};
vm.runInNewContext(source, {
  self: {
    location: { origin: 'https://example.test' },
    registration: { scope: 'https://example.test/prayer/' },
    clients: { claim: async () => {} },
    addEventListener(type, handler) { handlers[type] = handler; },
  },
  caches: {
    open: async () => cache,
    keys: async () => ['prayer-shell-old', 'another-app-cache'],
    delete: async name => { deleted.push(name); },
  },
  URL,
  fetch: async () => { fetches++; throw new Error('Offline'); },
});
let pending;
handlers.install({ waitUntil(promise) { pending = promise; } });
await pending;
assert(precached.includes('./index.html'));
assert(precached.includes('./manifest.webmanifest'));
assert(precached.includes('./icon-192.png'));
assert(precached.some(url => url.endsWith('.woff2')), 'Fonts must work offline');
handlers.activate({ waitUntil(promise) { pending = promise; } });
await pending;
assert.deepEqual(deleted, ['prayer-shell-old'], 'Do not remove other applications’ caches');
handlers.fetch({ request: { method: 'GET', url: 'https://example.test/prayer/', mode: 'navigate' }, respondWith(promise) { pending = promise; } });
assert((await (await pending).text()).includes('<div id="root">'), 'Return the shell offline at repository subpaths');
const asset = precached.find(url => url.endsWith('.js'));
handlers.fetch({ request: { method: 'GET', url: new URL(asset, 'https://example.test/prayer/').href }, respondWith(promise) { pending = promise; } });
assert.equal((await pending).status, 200);
assert.equal(fetches, 0, 'The app shell must not require the network');
let intercepted = false;
handlers.fetch({ request: { method: 'POST', url: 'https://example.test/prayer/private' }, respondWith() { intercepted = true; } });
handlers.fetch({ request: { method: 'GET', url: 'https://other.example/private' }, respondWith() { intercepted = true; } });
assert.equal(intercepted, false, 'Never intercept private writes or third-party requests');
for (const [filename, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const bytes = await readFile(`dist/${filename}`);
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
}
console.log(`Verified ${precached.length} offline assets, cached navigation, repository subpaths, font availability, cache isolation, and installation icon dimensions.`);
