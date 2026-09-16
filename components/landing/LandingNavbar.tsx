'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InstallPwaButton from '@/components/pwa/InstallPwaButton';

interface LandingNavbarProps {
  user?: { id: string; role: string; full_name?: string } | null;
}

export default function LandingNavbar({ user }: LandingNavbarProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'how-it-works' | 'features'>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const scrollPos = window.scrollY + 200;
      const featuresEl = document.getElementById('features');
      const howEl = document.getElementById('how-it-works');
      if (featuresEl && scrollPos >= featuresEl.offsetTop) setActiveSection('features');
      else if (howEl && scrollPos >= howEl.offsetTop) setActiveSection('how-it-works');
      else setActiveSection('home');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDashboardLink = (role?: string) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'agent': return '/agent';
      case 'driver': return '/driver';
      default: return '/orders';
    }
  };

  const loginHref = user ? getDashboardLink(user.role) : '/login';
  const loginLabel = user ? 'لوحة التحكم' : 'تسجيل الدخول';
  const ctaClasses = 'inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/50 focus-visible:ring-offset-2';
  const loginClasses = 'inline-flex items-center justify-center px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-[#FA3802] border border-orange-200 text-xs sm:text-sm font-extrabold hover:bg-orange-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/50 focus-visible:ring-offset-2';

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2.5 sm:py-3' : 'bg-white/85 backdrop-blur-sm py-3 sm:py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 sm:h-12">
          <Link href="/" className="flex items-center shrink-0 group transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded-lg">
            <div className="flex items-center gap-2">
              <img src="/assets/images/logo-name-dark.svg" alt="ENgz" className="h-7 sm:h-8 md:h-9 w-auto object-contain" />
              <span className="hidden sm:inline-block border-r border-gray-200 pr-2 text-[10px] font-semibold text-slate-500 leading-tight">وصل أي حاجة في أي وقت</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-base font-medium">
            <a href="#top" onClick={(e) => scrollToSection(e, 'top')} className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded ${activeSection === 'home' ? 'text-[#FA3802] font-bold' : 'text-gray-600 hover:text-[#FA3802]'}`}>الرئيسية</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded ${activeSection === 'how-it-works' ? 'text-[#FA3802] font-bold' : 'text-gray-600 hover:text-[#FA3802]'}`}>كيف يعمل ؟</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded ${activeSection === 'features' ? 'text-[#FA3802] font-bold' : 'text-gray-600 hover:text-[#FA3802]'}`}>المميزات</a>
            <a href="#footer" onClick={(e) => scrollToSection(e, 'footer')} className="relative py-1 text-gray-600 hover:text-[#FA3802] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded">تواصل معنا</a>
            <Link href="/join-driver" className="relative py-1 text-[#FA3802] font-bold hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded">انضم الينا</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button type="button" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">
              <span>{lang === 'ar' ? 'عربي' : 'English'}</span><span className="text-gray-300">|</span><span className="text-gray-400 font-normal">{lang === 'ar' ? 'EN' : 'عر'}</span>
            </button>
            <div className="hidden lg:block"><InstallPwaButton variant="navbar" label="ثبت التطبيق" /></div>
            <div className="hidden md:block"><Link href={loginHref} className={loginClasses}>{loginLabel}</Link></div>
            <div className="md:hidden"><InstallPwaButton variant="cta" label="ثبت التطبيق" installedFallback={null} /></div>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50/80 border border-gray-100 text-slate-700 hover:text-[#FA3802] hover:bg-orange-50 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40" aria-label="القائمة">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-gray-100 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-base font-black text-slate-900">ENgz</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">وصل أي حاجة في أي وقت</div>
          </div>
          <div className="space-y-1">
            <a href="#top" onClick={(e) => scrollToSection(e, 'top')} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">الرئيسية<span>›</span></a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">كيف يعمل؟<span>›</span></a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">المميزات<span>›</span></a>
            <a href="#footer" onClick={(e) => scrollToSection(e, 'footer')} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">تواصل معنا<span>›</span></a>
            <Link href="/join-driver" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-black text-[#FA3802] bg-orange-50/70 border border-orange-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">انضم كطيار في إنجز<span>›</span></Link>
          </div>
          <div className="pt-2 border-t border-gray-100"><InstallPwaButton variant="hero" label="ثبت التطبيق" className="w-full justify-center py-2.5 shadow-xs" /></div>
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
            <Link href={loginHref} onClick={() => setMobileMenuOpen(false)} className={loginClasses + ' w-full'}>{loginLabel}</Link>
            <Link href="/orders/new" onClick={() => setMobileMenuOpen(false)} className={ctaClasses + ' w-full'}>اطلب الآن</Link>
          </div>
        </div>
      )}
    </header>
  );
}
