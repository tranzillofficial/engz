'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PWA_ROLES, resolveRoleFromPath, type PwaRole } from '@/lib/pwa/roles';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __engzInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean;
    getInstalledRelatedApps?: () => Promise<unknown[]>;
  }
}

interface Props {
  /** Which of the four apps this button installs. Defaults to the current route's app. */
  role?: PwaRole;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  /** Rendered instead of the button once the app is installed. */
  installedFallback?: React.ReactNode;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports itself as a Mac
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  );
}

/** Chrome/Firefox/Edge on iOS cannot add to the home screen — only Safari can. */
function isNonSafariIos(): boolean {
  return isIos() && /CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    navigator.standalone === true
  );
}

export default function InstallPwaButton({
  role: roleProp,
  className = 'btn btn-primary',
  style,
  label,
  installedFallback = null,
}: Props) {
  const pathname = usePathname();
  const role: PwaRole = roleProp ?? resolveRoleFromPath(pathname || '/');
  const cfg = PWA_ROLES[role];

  const [installed, setInstalled] = useState(false);
  /** True once the browser has handed us a usable install event. */
  const [promptReady, setPromptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (isRunningStandalone()) {
      setInstalled(true);
      return;
    }

    // The event normally fires before React hydrates, so the inline script in the
    // root layout captures it and we pick it up from there on mount.
    if (window.__engzInstallPrompt) setPromptReady(true);

    const onReady = () => setPromptReady(true);
    const onNative = (e: Event) => {
      e.preventDefault();
      window.__engzInstallPrompt = e as BeforeInstallPromptEvent;
      setPromptReady(true);
    };
    const onInstalled = () => {
      window.__engzInstallPrompt = null;
      setInstalled(true);
      setGuideOpen(false);
    };

    window.addEventListener('engz:installprompt', onReady);
    window.addEventListener('beforeinstallprompt', onNative);
    window.addEventListener('appinstalled', onInstalled);

    navigator.getInstalledRelatedApps?.()
      .then((apps) => {
        if (apps.length > 0) setInstalled(true);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('engz:installprompt', onReady);
      window.removeEventListener('beforeinstallprompt', onNative);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleClick = useCallback(async () => {
    const evt = window.__engzInstallPrompt;

    if (!evt) {
      setGuideOpen(true);
      return;
    }

    setBusy(true);
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      // A prompt can only be used once; the browser fires a fresh one if the
      // user dismisses this one.
      window.__engzInstallPrompt = null;
      setPromptReady(false);
      if (outcome === 'accepted') setInstalled(true);
    } catch {
      window.__engzInstallPrompt = null;
      setGuideOpen(true);
    } finally {
      setBusy(false);
    }
  }, []);

  if (installed) return <>{installedFallback}</>;

  const text = busy ? 'جاري التثبيت...' : label || cfg.buttonLabel;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={cfg.buttonLabel}
        data-install-ready={promptReady ? 'true' : 'false'}
        className={className}
        style={style}
      >
        <span aria-hidden>⬇</span>
        <span>{text}</span>
      </button>

      {guideOpen && (
        <ManualInstallSheet role={role} onClose={() => setGuideOpen(false)} />
      )}
    </>
  );
}

/**
 * Last-resort sheet, shown only when the browser refuses to expose a
 * programmatic install (iOS Safari and friends).
 */
function ManualInstallSheet({ role, onClose }: { role: PwaRole; onClose: () => void }) {
  const cfg = PWA_ROLES[role];
  const ios = isIos();
  const iosWrongBrowser = isNonSafariIos();

  const steps = iosWrongBrowser
    ? [
        'افتح نفس الصفحة في متصفح Safari.',
        'اضغط زر المشاركة ⬆️ في الشريط السفلي.',
        'اختر «إضافة إلى الشاشة الرئيسية».',
      ]
    : ios
    ? [
        'اضغط زر المشاركة ⬆️ في الشريط السفلي.',
        'انزل لتحت واختر «إضافة إلى الشاشة الرئيسية».',
        'اضغط «إضافة» وهيظهر التطبيق على شاشتك.',
      ]
    : [
        'افتح قائمة المتصفح ⋮ من أعلى اليمين.',
        'اختر «تثبيت التطبيق» أو «Add to Home screen».',
        'أكّد التثبيت وهيظهر التطبيق على شاشتك.',
      ];

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${cfg.iconDir}/icon-192.png`}
              alt=""
              className="w-12 h-12 rounded-2xl shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">
                {cfg.title}
              </h3>
              <p className="text-[11px] text-slate-400">تثبيت على الشاشة الرئيسية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
          >
            ✕
          </button>
        </div>

        <ol className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
              <span
                className="w-6 h-6 shrink-0 rounded-lg text-white font-black text-[11px] flex items-center justify-center"
                style={{ backgroundColor: cfg.themeColor }}
              >
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl text-white font-black text-xs transition-opacity hover:opacity-90"
          style={{ backgroundColor: cfg.themeColor }}
        >
          تمام
        </button>
      </div>
    </div>
  );
}
