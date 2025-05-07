'use client';

import React, { FormEvent } from 'react';
import { Button } from '@/modules/core/components/Button';
import Link from 'next/link';
import styles from './styles.module.css';

interface SignUpFormProps {
  onNext: (email: string) => void;
}

export function SignUpForm({ onNext }: SignUpFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    onNext(email);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          placeholder="Create a password"
          required
        />
      </div>

      <Button style={{ width: '100%' }} type="submit">
        Next
      </Button>

      <p className={styles.terms}>
        By creating an account, you agree to our{' '}
        <Link href="/terms" className={styles.link}>Terms of Service</Link> and{' '}
        <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
      </p>
    </form>
  );
} 