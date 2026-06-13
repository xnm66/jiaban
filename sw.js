// sw.js - Stale-While-Revalidate（秒开 + 后台更新）
const CACHE_NAME = 'jiaban-v6';

// 只缓存核心资源，避免缓存过大
const urlsToCache = [
    './',
    './index.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
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

// 核心：先读缓存（秒开），再后台更新
self.addEventListener('fetch', event => {
    // 只拦截同源请求，避免缓存外部资源
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 后台发起网络请求更新缓存
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // 网络失败时，如果有缓存就返回缓存
                return cachedResponse;
            });
            
            // 关键：有缓存立即返回，无缓存才等待网络
            return cachedResponse || fetchPromise;
        })
    );
});