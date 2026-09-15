import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />

      <div className="auth-card-wrapper">
        {/* Logo / Brand */}
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/engz-logo.svg"
            alt="Engz"
            className="h-16 w-auto drop-shadow-md"
          />
        </div>

        {children}
      </div>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: var(--color-bg);
          position: relative;
          overflow: hidden;
        }

        .auth-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .auth-blob-1 {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(108, 92, 231, 0.18) 0%, transparent 70%);
          top: -120px;
          right: -120px;
          animation: blobFloat1 8s ease-in-out infinite;
        }

        .auth-blob-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 206, 201, 0.14) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          animation: blobFloat2 10s ease-in-out infinite;
        }

        .auth-blob-3 {
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(162, 155, 254, 0.12) 0%, transparent 70%);
          top: 40%;
          left: 30%;
          animation: blobFloat3 12s ease-in-out infinite;
        }

        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 30px) scale(1.08); }
        }

        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -25px) scale(1.06); }
        }

        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.05); }
          66% { transform: translate(-15px, 20px) scale(0.97); }
        }

        .auth-card-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: var(--color-primary);
          text-decoration: none;
        }

        .auth-brand-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.35);
        }

        .auth-brand-name {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
      `}</style>
    </div>
  );
}
