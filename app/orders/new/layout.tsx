'use client';

import { useEffect, type ReactNode } from 'react';

function hideResolvedItemError() {
  const main = document.querySelector('main');
  if (!main) return;

  const descriptionInputs = Array.from(main.querySelectorAll('input')) as HTMLInputElement[];
  const itemInput = descriptionInputs.find((input) => input.placeholder?.startsWith('مثال: ٢ كيلو برتقال'));
  const hasItem = Boolean(itemInput?.value.trim());

  const alerts = Array.from(main.querySelectorAll('div')).filter((element) =>
    element.textContent?.includes('أضف صنفاً واحداً على الأقل لطلبك')
  );

  alerts.forEach((alert) => {
    const isAlert = alert.className.includes('rose-50') && alert.className.includes('border-rose-200');
    if (isAlert) alert.style.display = hasItem ? 'none' : '';
  });
}

export default function NewOrderLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-engz-order-ux', 'true');
    style.textContent = `
      main.max-w-xl { padding-top: .75rem !important; }
      main.max-w-xl .space-y-4 { row-gap: .75rem !important; }
      main.max-w-xl .space-y-3 { row-gap: .625rem !important; }
      main.max-w-xl a:focus-visible,
      main.max-w-xl button:focus-visible,
      main.max-w-xl input:focus-visible,
      main.max-w-xl textarea:focus-visible,
      main.max-w-xl select:focus-visible,
      header button:focus-visible {
        outline: 2px solid rgba(250,56,2,.7) !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(250,56,2,.10) !important;
      }
      main.max-w-xl .bg-white.rounded-3xl { transition: border-color .2s ease, box-shadow .2s ease; }
      @media (max-width: 640px) {
        main.max-w-xl { padding-left: .75rem !important; padding-right: .75rem !important; }
        main.max-w-xl .bg-white.rounded-3xl { padding: 1rem !important; }
      }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => hideResolvedItemError());
    const start = window.setTimeout(() => {
      hideResolvedItemError();
      const main = document.querySelector('main');
      if (main) observer.observe(main, { childList: true, subtree: true });
    }, 0);

    const onInput = () => hideResolvedItemError();
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);

    return () => {
      window.clearTimeout(start);
      observer.disconnect();
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
      style.remove();
    };
  }, []);

  return children;
}
