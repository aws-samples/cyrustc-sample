'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ 
  className = '', 
  children, 
  variant = 'default', 
  ...props 
}: ButtonProps) {
  return (
    <button 
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '500',
        transition: 'background-color 0.2s, color 0.2s',
        ...variant === 'outline' && { border: '1px solid #10b981' },
        backgroundColor: variant === 'default' ? '#10b981' : variant === 'outline' ? 'transparent' : 'transparent',
        color: variant === 'default' ? 'black' : '#10b981',
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
} 