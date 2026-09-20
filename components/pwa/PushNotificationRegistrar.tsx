'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { savePushSubscription } from '@/lib/actions/notifications';

const FALLBACK_VAPID_KEY =
  'BIM9wRsEdWA_Bomq2tkv4qql7tYqKYj4PzjRp1JBpqSrog56rpnC4cJ3W2pbec1ipWGdhAjhVgYkBT-wGYb66qM';

export default function PushNotificationRegistrar() {
  useEffect(() => {
    let cancelled = false;

    async function registerPush() {
      try {
        if (
          typeof window === 'undefined' ||
          !('serviceWorker' in navigator) ||
          !('PushManager' in window) ||
          !('Notification' in window)
        ) {
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // If not logged in, we still register for guest if available
        const registration = await navigator.serviceWorker.ready;

        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (cancelled || permission !== 'granted') return;

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_KEY;
        if (!publicKey) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKeyToUint8Array(publicKey),
          });
        }

        if (subscription && !cancelled) {
          const p256dh = subscription.getKey('p256dh');
          const auth = subscription.getKey('auth');

          if (p256dh && auth) {
            await savePushSubscription({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: base64(p256dh),
                auth: base64(auth),
              },
              userId: user?.id,
            });
          }
        }
      } catch (err) {
        console.warn('[PushRegistrar] Failed to register push subscription:', err);
      }
    }

    // Delay slightly to not block initial page load
    const timer = setTimeout(() => {
      registerPush();
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}

function base64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function publicKeyToUint8Array(key: string) {
  const padding = '='.repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
