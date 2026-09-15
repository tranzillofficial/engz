'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/auth';

const initialState = { error: undefined, success: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-card-header">
        <h1 className="auth-title">أهلاً بعودتك 👋</h1>
        <p className="auth-subtitle">سجّل دخولك وابدأ التوصيل الآن</p>
      </div>

      {state?.error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">البريد الإلكتروني</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            className="form-input"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password" className="form-label">كلمة المرور</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="form-input"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary btn-full"
          id="login-submit-btn"
        >
          {isPending ? (
            <span className="btn-loading">
              <span className="spinner" aria-hidden="true" />
              جاري تسجيل الدخول...
            </span>
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>أو استخدم المنظومة مباشرة</span>
      </div>

      <div className="flex flex-col gap-2">
        <Link href="/orders/new" className="btn-outline btn-full text-center" id="go-to-new-order-link">
          🚀 طلب توصيل فوري كزائر (بدون تسجيل)
        </Link>
        <Link href="/join-driver" className="text-center text-xs text-[#FA3802] font-bold hover:underline py-1" id="go-to-join-driver-link">
          🛵 تريد العمل معنا كطيار؟ قدّم طلب انضمام الآن ›
        </Link>
      </div>

      <style>{`
        .auth-card {
          width: 100%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .auth-card-header {
          text-align: center;
          margin-bottom: 0.25rem;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.375rem 0;
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .auth-alert-error {
          background: var(--color-danger-light);
          color: var(--color-danger);
          border: 1px solid rgba(225, 112, 85, 0.2);
        }

        .auth-alert-success {
          background: var(--color-success-light);
          color: var(--color-success);
          border: 1px solid rgba(0, 184, 148, 0.2);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.95rem;
          font-family: var(--font-family);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input::placeholder {
          color: var(--color-text-muted);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
        }

        .form-input:invalid:not(:placeholder-shown) {
          border-color: var(--color-danger);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.8125rem 1.5rem;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-family);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 14px rgba(108, 92, 231, 0.35);
          text-decoration: none;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(108, 92, 231, 0.45);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.8125rem 1.5rem;
          background: transparent;
          color: var(--color-primary);
          border: 1.5px solid var(--color-primary);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-family);
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          text-decoration: none;
        }

        .btn-outline:hover {
          background: var(--color-primary-50);
          transform: translateY(-1px);
        }

        .btn-full {
          width: 100%;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          text-align: center;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
      `}</style>
    </div>
  );
}
