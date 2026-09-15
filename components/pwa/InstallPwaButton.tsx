'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __engzInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface InstallPwaButtonProps {
  className?: string;
  variant?: 'navbar' | 'hero' | 'floating' | 'cta';
  /** Button label. Defaults to "تثبيت التطبيق" */
  label?: string;
  /** Rendered instead of the button when the app is already installed */
  installedFallback?: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<InstallPwaButtonProps['variant']>, string> = {
  navbar:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#FA3802] border border-orange-200 text-xs font-bold transition-all hover:scale-105 shadow-2xs',
  hero:
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all shadow-md',
  floating:
    'inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-sm font-bold shadow-lg shadow-orange-500/30',
  cta:
    'inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0',
};

export default function InstallPwaButton({
  className = '',
  variant = 'navbar',
  label = 'تثبيت التطبيق',
  installedFallback,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already running as an installed app?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsInstalled(true);
    }

    // iOS has no install prompt API — it needs the manual guide.
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    // The browser may fire "beforeinstallprompt" before React mounts, so the
    // inline script in the root layout stores it on window for us.
    if (window.__engzInstallPrompt) {
      setDeferredPrompt(window.__engzInstallPrompt);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__engzInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleStoredPrompt = () => {
      setDeferredPrompt(window.__engzInstallPrompt ?? null);
    };

    const handleAppInstalled = () => {
      window.__engzInstallPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('engz:installprompt', handleStoredPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('engz:installprompt', handleStoredPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      setShowIosModal(true);
      return;
    }

    const promptEvent = deferredPrompt ?? window.__engzInstallPrompt ?? null;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch {
        // The prompt can only be used once — fall back to the manual guide.
        setShowIosModal(true);
      }
      window.__engzInstallPrompt = null;
      setDeferredPrompt(null);
    } else {
      // iOS, or a browser that does not expose the install prompt
      setShowIosModal(true);
    }
  };

  // Already installed: show the alternative action instead of a useless install button
  if (isInstalled && installedFallback) {
    return <>{installedFallback}</>;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
        title="تثبيت إنجز كتطبيق على هاتفك"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
          <path d="M12 7v5" />
          <path d="m9 10 3 3 3-3" />
        </svg>
        <span>{label}</span>
      </button>

      {/* iOS & Manual Installation Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-right shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FA3802] mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>

            {isInstalled ? (
              <>
                <h3 className="text-xl font-bold text-slate-900">تطبيق إنجز مثبت بالفعل ✅</h3>
                <p className="mt-2 text-sm text-slate-500">
                  افتح تطبيق إنجز من شاشة هاتفك الرئيسية مباشرة.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900">
                  تثبيت إنجز على هاتفك 📱
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  استمتع بتجربة تطبيق فوري وسريع بدون تحميل من المتجر:
                </p>

                <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                  {isIos ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FA3802] text-white flex items-center justify-center font-bold shrink-0">1</span>
                        <span>اضغط على زر المشاركة <strong className="text-blue-600">📤</strong> في شريط Safari بالأسفل.</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FA3802] text-white flex items-center justify-center font-bold shrink-0">2</span>
                        <span>انزل في الخيارات واختر <strong className="text-slate-900">إضافة إلى الشاشة الرئيسية ➕</strong>.</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FA3802] text-white flex items-center justify-center font-bold shrink-0">3</span>
                        <span>اضغط على <strong>إضافة (Add)</strong> في أعلى اليمين.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FA3802] text-white flex items-center justify-center font-bold shrink-0">1</span>
                        <span>اضغط على قائمة المتصفح (نقاط القائمة الثلاث <strong>⋮</strong>).</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FA3802] text-white flex items-center justify-center font-bold shrink-0">2</span>
                        <span>اختر <strong className="text-slate-900">تثبيت التطبيق (Install App)</strong> أو إضافة للشاشة الرئيسية.</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="mt-6 w-full py-3 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-sm font-bold shadow-md shadow-orange-500/25"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
}
