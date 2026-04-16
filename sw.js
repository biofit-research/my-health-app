/* =====================================================
   Service Worker — 건강 관리 앱
   https://biofit-research.github.io/my-health-app/
   ===================================================== */

const CACHE_NAME = 'health-app-v1';
const BASE = '/my-health-app';

// 오프라인에서도 작동할 파일 목록
const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 오래된 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 네트워크 요청: 캐시 우선, 실패 시 네트워크
self.addEventListener('fetch', e => {
  // POST 등 캐시 불가 요청은 그냥 통과
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          // 유효한 응답만 캐시에 추가
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          // 오프라인 + 캐시 없음: index.html로 폴백
          if (e.request.destination === 'document') {
            return caches.match(BASE + '/index.html');
          }
        });
    })
  );
});
