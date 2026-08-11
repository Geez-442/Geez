'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // eslint-disable-next-line no-console
        console.log('ZETS service worker registered:', registration.scope);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('ZETS service worker registration failed:', error);
      });
  }, []);

  return null;
}
