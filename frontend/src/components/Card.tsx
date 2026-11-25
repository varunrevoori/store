import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'ai' | 'plain';
  padding?: boolean;
};

export function Card({ children, className = '', variant = 'default', padding = true }: Props) {
  const base = variant === 'ai' ? 'card card-ai' : variant === 'plain' ? '' : 'card';
  const pad = padding ? 'p-5' : '';
  return <div className={`${base} ${pad} ${className}`.trim()}>{children}</div>;
}