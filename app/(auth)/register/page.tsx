'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/lib/actions/auth';

const initialState = { error: undefined, success: false, message: undefined };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [role, setRole] = useState<'customer' | 'driver'>('customer');

  // If registration was successful, show success message
  if (state?.success) {
    return (
      <div className="auth-card animate-fade-in">
        <div className="success-state">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h2 className="success-title">تم إنشاء حسابك! 🎉</h2>
          <p className="success-msg">{state.message}</p>
          <Link href="/login" className="btn-primary btn-full" id="go-to-login-after-register">
            تسجيل الدخول الآن
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
          }
          .success-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
            padding: 1rem 0;
          }
          .success-icon {
            width: 64px;
            height: 64px;
            background: var(--color-success-light);
            color: var(--color-success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            font-weight: 700;
          }
          .success-title {
            font-size: 1.375rem;
            font-weight: 700;
            color: var(--color-text);
            margin: 0;
          }
          .success-msg {
            font-size: 0.9rem;
            color: var(--color-text-secondary);
            margin: 0;
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
            text-decoration: none;
            width: 100%;
            margin-top: 0.5rem;
          }
          .btn-full { width: 100%; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-card-header">
        <h1 className="auth-title">إنشاء حساب جديد</h1>
        <p className="auth-subtitle">انضم لآلاف المستخدمين وابدأ رحلتك</p>
      </div>

      {state?.error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Role selector */}
      <div className="role-selector">
        <button
          type="button"
          id="role-customer-btn"
          className={`role-btn ${role === 'customer' ? 'role-btn-active' : ''}`}
          onClick={() => setRole('customer')}
        >
          <span className="role-icon" aria-hidden="true">🛍️</span>
          <div>
            <div className="role-label">عميل</div>
            <div className="role-desc">أطلب وسلّم</div>
          </div>
        </button>
        <button
          type="button"
          id="role-driver-btn"
          className={`role-btn ${role === 'driver' ? 'role-btn-active' : ''}`}
          onClick={() => setRole('driver')}
        >
          <span className="role-icon" aria-hidden="true">🛵</span>
          <div>
            <div className="role-label">مندوب توصيل</div>
            <div className="role-desc">اكسب من التوصيل</div>
          </div>
        </button>
      </div>

      <form action={formAction} className="auth-form" noValidate>
        {/* Hidden role field */}
        <input type="hidden" name="role" value={role} />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">الاسم الكامل</label>
            <input
              id="reg-name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="محمد أحمد"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone" className="form-label">رقم الجوال <span className="optional">(اختياري)</span></label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="05xxxxxxxx"
              className="form-input"
              dir="ltr"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">البريد الإلكتروني</label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="form-label">كلمة المرور</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••  (6 أحرف على الأقل)"
            className="form-input"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary btn-full"
          id="register-submit-btn"
        >
          {isPending ? (
            <span className="btn-loading">
              <span className="spinner" aria-hidden="true" />
              جاري إنشاء الحساب...
            </span>
          ) : (
            `إنشاء حساب ${role === 'driver' ? 'مندوب' : 'عميل'}`
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>لديك حساب بالفعل؟</span>
      </div>

      <Link href="/login" className="btn-outline btn-full" id="go-to-login-link">
        تسجيل الدخول
      </Link>

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

        /* Role selector */
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .role-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-family);
          text-align: right;
        }

        .role-btn:hover {
          border-color: var(--color-primary-light);
          background: var(--color-primary-50);
        }

        .role-btn-active {
          border-color: var(--color-primary);
          background: var(--color-primary-50);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
        }

        .role-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .role-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .role-desc {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 400px) {
          .form-row { grid-template-columns: 1fr; }
          .role-selector { grid-template-columns: 1fr; }
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

        .optional {
          font-weight: 400;
          color: var(--color-text-muted);
          font-size: 0.75rem;
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

        .form-input::placeholder { color: var(--color-text-muted); }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
        }

        /* Buttons */
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

        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

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

        .btn-full { width: 100%; }

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

        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
          color: var(--color-text-muted);
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
