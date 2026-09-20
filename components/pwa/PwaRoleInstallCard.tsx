'use client';

import { useEffect, useState } from 'react';
import InstallPwaButton from './InstallPwaButton';

interface PwaRoleInstallCardProps {
  role?: 'admin' | 'agent' | 'driver' | 'customer';
  className?: string;
}

export function PwaRoleInstallCard({ role: propRole, className = '' }: PwaRoleInstallCardProps) {
  const [role, setRole] = useState<'admin' | 'agent' | 'driver' | 'customer'>(propRole || 'customer');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsStandalone(true);
      }

      if (!propRole) {
        const path = window.location.pathname;
        if (path.startsWith('/driver')) setRole('driver');
        else if (path.startsWith('/agent')) setRole('agent');
        else if (path.startsWith('/admin')) setRole('admin');
        else setRole('customer');
      }
    }
  }, [propRole]);

  if (isStandalone) return null;

  const roleConfig = {
    admin: {
      title: 'تطبيق إدارة إنجز (Admin App)',
      desc: 'ثبّت لوحة الإدارة كتطبيق منفصل على هاتفك للوصول السريع والإشعارات الفورية.',
      bg: 'from-slate-900 via-slate-800 to-slate-950 text-white border-slate-700',
      btnClass: 'bg-white text-slate-900 hover:bg-slate-100 shadow-md',
      badge: 'إدارة مركزية',
      icon: '🛡️',
    },
    agent: {
      title: 'تطبيق وكيل المنطقة (Agent App)',
      desc: 'ثبّت لوحة الوكالة كتطبيق مستقل لمتابعة طياري وطلبات منطقتك لحظياً.',
      bg: 'from-emerald-900 via-emerald-800 to-emerald-950 text-white border-emerald-700',
      btnClass: 'bg-white text-emerald-900 hover:bg-emerald-50 shadow-md',
      badge: 'وكالة معتمدة',
      icon: '🗺️',
    },
    driver: {
      title: 'تطبيق كابتن إنجز (Driver App)',
      desc: 'ثبّت تطبيق الطيار على الشاشة الرئيسية لاستقبال تنبيهات الطلبات الجديدة أولاً بأول.',
      bg: 'from-amber-900 via-amber-800 to-amber-950 text-white border-amber-700',
      btnClass: 'bg-white text-amber-900 hover:bg-amber-50 shadow-md',
      badge: 'كابتن توصيل',
      icon: '🛵',
    },
    customer: {
      title: 'تطبيق إنجز للطلبات (Customer App)',
      desc: 'ثبّت تطبيق إنجز على هاتفك واطلب أي حاجة بنقرة واحدة في أي وقت.',
      bg: 'from-orange-600 via-[#FA3802] to-red-700 text-white border-orange-500',
      btnClass: 'bg-white text-[#FA3802] hover:bg-orange-50 shadow-md',
      badge: 'توصيل فوري',
      icon: '⚡',
    },
  };

  const config = roleConfig[role];

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 bg-gradient-to-l ${config.bg} border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-sans ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/pwa-icon/${role}`}
          alt={config.title}
          className="w-12 h-12 rounded-2xl shadow-md shrink-0 border border-white/20"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black tracking-tight">{config.title}</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
              {config.badge}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{config.desc}</p>
        </div>
      </div>

      <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
        <InstallPwaButton
          className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${config.btnClass}`}
        />
      </div>
    </div>
  );
}
