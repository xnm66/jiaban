// sw.js - Stale-While-Revalidate（秒开 + 后台更新）
const CACHE_NAME = 'jiaban-v7';

// 缓存所有核心资源
const urlsToCache = [
    './',
    './index.html',
    './lunar.js',
    './tiaoxiu.json'
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
    // 只拦截同源的核心资源请求
    const url = event.request.url;
    
    // 判断是否是需要缓存的核心资源
    const isCoreResource = 
        url.endsWith('/') ||
        url.endsWith('index.html') ||
        url.endsWith('lunar.js') ||
        url.endsWith('tiaoxiu.json');
    
    if (!isCoreResource) {
        // 非核心资源（如图标、API等）直接走网络
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
            
            // 关键：有缓存立即返回（毫秒级），无缓存才等待网络
            return cachedResponse || fetchPromise;
        })
    );
});