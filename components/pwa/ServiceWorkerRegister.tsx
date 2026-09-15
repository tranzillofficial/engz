'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker so the browser treats Engz as an installable app
 * (required for the "beforeinstallprompt" event behind the "التثبيت الآن" button).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration failures must never break the app */
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
