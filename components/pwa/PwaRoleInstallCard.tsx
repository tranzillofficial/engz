'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import InstallPwaButton from './InstallPwaButton';
import { PWA_ROLES, resolveRoleFromPath, type PwaRole } from '@/lib/pwa/roles';

interface PwaRoleInstallCardProps {
  /** Defaults to the app that owns the current route. */
  role?: PwaRole;
  className?: string;
}

/** Gradient + button skin for each of the four apps, keyed to the manifest colours. */
const SKIN: Record<PwaRole, { bg: string; btn: string }> = {
  customer: {
    bg: 'from-orange-500 via-[#FA3802] to-red-700 border-orange-400/60',
    btn: 'bg-white text-[#FA3802] hover:bg-orange-50',
  },
  driver: {
    bg: 'from-amber-500 via-amber-700 to-[#78350F] border-amber-400/60',
    btn: 'bg-white text-amber-800 hover:bg-amber-50',
  },
  agent: {
    bg: 'from-emerald-500 via-emerald-700 to-[#064E3B] border-emerald-400/60',
    btn: 'bg-white text-emerald-800 hover:bg-emerald-50',
  },
  admin: {
    bg: 'from-slate-600 via-slate-800 to-[#0F172A] border-slate-500/60',
    btn: 'bg-white text-slate-900 hover:bg-slate-100',
  },
};

export function PwaRoleInstallCard({ role: roleProp, className = '' }: PwaRoleInstallCardProps) {
  const pathname = usePathname();
  const role: PwaRole = roleProp ?? resolveRoleFromPath(pathname || '/');
  const cfg = PWA_ROLES[role];
  const skin = SKIN[role];

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    ) {
      setHidden(true);
    }
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 bg-gradient-to-l ${skin.bg} border text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-sans ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${cfg.iconDir}/icon-192.png`}
          alt={cfg.title}
          width={56}
          height={56}
          className="w-14 h-14 rounded-2xl shadow-md shrink-0 border border-white/25"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black tracking-tight">{cfg.title}</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20">
              {cfg.badge}
            </span>
          </div>
          <p className="text-xs text-white/85 mt-0.5 leading-relaxed">{cfg.tagline}</p>
        </div>
      </div>

      <div className="w-full sm:w-auto shrink-0">
        <InstallPwaButton
          role={role}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${skin.btn}`}
        />
      </div>
    </div>
  );
}

export default PwaRoleInstallCard;
