'use client';

import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer id="footer" className="bg-[#0B1120] text-gray-300 py-10 border-t border-gray-800 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-800/80">
          {/* WhatsApp Button (RTL: Right side) */}
          <a
            href="https://wa.me/201000000000?text=مرحباً%20Engz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-white transition-all duration-200 group"
          >
            <span className="text-sm font-semibold text-gray-100 group-hover:text-white">
              تواصل معنا عبر واتساب
            </span>
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm shadow-[#25D366]/40 group-hover:scale-110 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </a>

          {/* Policy Links with orange underline (Center) */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                الشروط والأحكام
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                الخصوصية
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                مركز المساعدة
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-[#FA3802] rounded-full" />
          </div>

          {/* Social Icons & Copyright (RTL: Left side) — Instagram & Facebook only */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-4 text-gray-400">
              {/* Instagram */}
              <a href="#" className="hover:text-[#FA3802] transition-colors" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* Facebook */}
              <a href="#" className="hover:text-[#FA3802] transition-colors" title="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>

            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Engz جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
