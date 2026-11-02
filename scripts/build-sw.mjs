import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve('dist');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(directory, e.name)) : [path.join(directory, e.name)]));
  return lists.flat();
}
const files = (await walk(root)).filter(file => !file.endsWith(`${path.sep}sw.js`)).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const version = hash.digest('hex').slice(0, 16);
const urls = files.map(file => './' + path.relative(root, file).replaceAll('\\', '/'));
const sw = `// Generated from the production build. Personal records are never stored here.
const CACHE = 'prayer-shell-${version}';
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('prayer-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try {
        const fresh = await fetch(event.request, {cache:'no-store'});
        if (fresh.ok) return fresh;
      } catch { /* The precached shell remains available offline. */ }
      const shell = await cache.match(new URL('./index.html', self.registration.scope).href);
      if (shell) return shell;
    }
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    return fetch(event.request);
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => client.url.startsWith(self.registration.scope));
    return existing ? existing.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
`;
await writeFile(path.join(root, 'sw.js'), sw);
console.log(`Offline shell ${version}: ${urls.length} local assets precached.`);
