'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('جاري البحث عن أقرب طيار')) router.refresh();
    }, 4500);
    return () => window.clearInterval(timer);
  }, [router]);

  return children;
}
