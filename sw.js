// sw.js - Cache First + 后台更新（推荐）
const CACHE_NAME = 'jiaban-v8';
const urlsToCache = [
    './',
    './index.html',
    './lunar.js',
    './tiaoxiu.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 有缓存就返回缓存（秒开）
            if (cachedResponse) {
                // 后台静默更新缓存
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse);
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            // 无缓存才请求网络
            return fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            });
        })
    );
});