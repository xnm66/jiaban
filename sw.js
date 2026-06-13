// sw.js - 恢复秒开 + 后台更新
const CACHE_NAME = 'jiaban-v9';
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
    // 不做任何过滤，全部拦截
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 有缓存：立即返回（秒开）
            if (cachedResponse) {
                // 后台静默更新
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse);
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            // 无缓存：请求网络
            return fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            });
        })
    );
});