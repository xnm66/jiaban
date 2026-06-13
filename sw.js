// sw.js - Stale-While-Revalidate（缓存优先，后台静默更新）
const CACHE_NAME = 'jiaban-v5';

// 需要缓存的资源列表
const urlsToCache = [
    './',
    './index.html',
    './lunar.js',
    './tiaoxiu.json'
];

// 安装时缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    // 立即激活，不等待旧版本关闭
    self.skipWaiting();
});

// 激活时清理旧版本缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    // 立即控制所有页面
    self.clients.claim();
});

// 拦截请求 - Stale-While-Revalidate 策略
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 先从缓存返回（快速响应）
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // 后台静默更新缓存
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // 网络请求失败时，返回缓存（如果有的话）
                return cachedResponse;
            });
            
            // 有缓存就返回缓存，同时后台更新；无缓存就等待网络
            return cachedResponse || fetchPromise;
        })
    );
});