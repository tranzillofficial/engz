'use client';

import { useEffect, useState } from 'react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __engzInstallPrompt?: InstallEvent | null;
  }
}

interface Props {
  className?: string;
  variant?: string;
  label?: string;
  installedFallback?: React.ReactNode;
}

export default function InstallPwaButton({
  className = 'btn btn-primary',
  label,
  installedFallback,
}: Props) {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [role, setRole] = useState<'admin' | 'agent' | 'driver' | 'customer'>('customer');

  useEffect(() => {
    const path = window.location.pathname;
    const currentRole = path.startsWith('/driver')
      ? 'driver'
      : path.startsWith('/agent')
      ? 'agent'
      : path.startsWith('/admin')
      ? 'admin'
      : 'customer';

    setRole(currentRole);

    let link = document.querySelector<HTMLLinkElement>('link#engz-role-manifest');
    if (!link) {
      link = document.createElement('link');
      link.id = 'engz-role-manifest';
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = `/manifest-${currentRole}.webmanifest`;

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      window.__engzInstallPrompt = e as InstallEvent;
      setPromptEvent(e as InstallEvent);
    };

    const handleInstalled = () => {
      window.__engzInstallPrompt = null;
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    if (window.__engzInstallPrompt) {
      setPromptEvent(window.__engzInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const roleTitles = {
    admin: 'تطبيق الأدمن المركزي',
    agent: 'تطبيق وكيل المنطقة',
    driver: 'تطبيق كابتن التوصيل',
    customer: 'تطبيق إنجز للطلبات',
  };

  const defaultButtonLabels = {
    admin: 'تثبيت تطبيق الأدمن 📱',
    agent: 'تثبيت تطبيق الوكيل 📱',
    driver: 'تثبيت تطبيق الكابتن 📱',
    customer: 'تثبيت تطبيق إنجز 📱',
  };

  const handleInstallClick = async () => {
    const e = promptEvent || window.__engzInstallPrompt;
    if (e) {
      try {
        await e.prompt();
        await e.userChoice;
        window.__engzInstallPrompt = null;
        setPromptEvent(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else {
      // Show smooth iOS / Safari instruction modal
      setShowIosGuide(true);
    }
  };

  if (installed) return <>{installedFallback}</>;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={className}
      >
        {label || defaultButtonLabels[role]}
      </button>

      {/* iOS / Manual Install Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/pwa-icon/${role}`}
                  alt="App Icon"
                  className="w-10 h-10 rounded-xl shadow-xs"
                />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {roleTitles[role]}
                  </h3>
                  <p className="text-[10px] text-slate-400">تثبيت على الشاشة الرئيسية</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
              <p className="font-bold">لتثبيت التطبيق على هاتفك مباشرة:</p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#FA3802] font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  اضغط على زر المشاركة <b>(Share / ⎋)</b> في المتصفح.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#FA3802] font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  اختر <b>«إضافة إلى الصفحة الرئيسية / Add to Home Screen ⊞»</b>.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full h-11 rounded-2xl bg-[#FA3802] text-white font-black text-xs hover:bg-[#e03102] transition-colors"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
}