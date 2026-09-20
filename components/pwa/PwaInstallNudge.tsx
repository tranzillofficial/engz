'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import InstallPwaButton from './InstallPwaButton';
import { createClient } from '@/lib/supabase/client';
import { PWA_ROLES, resolveRoleFromPath } from '@/lib/pwa/roles';

/**
 * Small floating prompt that offers the signed-in user the app matching the
 * interface they are currently using.
 */
export default function PwaInstallNudge() {
  const pathname = usePathname();
  const role = resolveRoleFromPath(pathname || '/');
  const cfg = PWA_ROLES[role];
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (
          window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches
        ) {
          return;
        }
        if (sessionStorage.getItem('engz-install-nudge')) return;
        const { data } = await createClient().auth.getUser();
        if (!data.user || cancelled) return;
        setTimeout(() => !cancelled && setShow(true), 1200);
      } catch {
        /* never block the page on this */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-[2000] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${cfg.iconDir}/icon-192.png`}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <b className="text-sm text-slate-900 dark:text-slate-100">{cfg.title}</b>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{cfg.tagline}</p>
          <div className="flex gap-2 mt-3">
            <InstallPwaButton
              role={role}
              label="تثبيت الآن"
              style={{ backgroundColor: cfg.themeColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('engz-install-nudge', '1');
                setShow(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-500"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
