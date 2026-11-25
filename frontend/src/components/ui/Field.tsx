import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label className="lbl" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`inp ${className ?? ''}`.trim()} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`inp ${className ?? ''}`.trim()} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`inp ${className ?? ''}`.trim()} {...props} />;
}

export function FormAlert({ children, tone = 'error' }: { children: React.ReactNode; tone?: 'error' | 'success' }) {
  return (
    <p className={`form-alert form-alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}