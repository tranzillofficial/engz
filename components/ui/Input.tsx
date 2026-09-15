// ============================================================
// Input / FormField Component — Engz Design System
// Arabic-first, mobile-friendly
// ============================================================
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ─── Text Input ──────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelEn?: string;   // English translation shown as small sub-label
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'right' | 'left';
  fullWidth?: boolean;
}

export function Input({
  label,
  labelEn,
  error,
  hint,
  icon,
  iconPosition = 'right',
  fullWidth = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={['form-field', fullWidth ? 'form-field-full' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {labelEn && <span className="form-label-en">{labelEn}</span>}
          {props.required && <span className="form-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className={['form-input-wrapper', icon ? `has-icon icon-${iconPosition}` : ''].filter(Boolean).join(' ')}>
        {icon && iconPosition === 'right' && (
          <span className="form-icon form-icon-right" aria-hidden="true">{icon}</span>
        )}
        <input
          id={inputId}
          className={['form-input', error ? 'form-input-error' : ''].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {icon && iconPosition === 'left' && (
          <span className="form-icon form-icon-left" aria-hidden="true">{icon}</span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="form-hint">{hint}</p>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelEn?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export function Textarea({
  label,
  labelEn,
  error,
  hint,
  fullWidth = true,
  className = '',
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={['form-field', fullWidth ? 'form-field-full' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {labelEn && <span className="form-label-en">{labelEn}</span>}
          {props.required && <span className="form-required" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={['form-textarea', error ? 'form-input-error' : ''].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="form-error" role="alert">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelEn?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  labelEn,
  error,
  hint,
  fullWidth = true,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? `select-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={['form-field', fullWidth ? 'form-field-full' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {labelEn && <span className="form-label-en">{labelEn}</span>}
          {props.required && <span className="form-required" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={['form-select', error ? 'form-input-error' : ''].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error" role="alert">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}

// needed for Select props spread
import React from 'react';
