'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/modules/core/components/Button';
import styles from './Navigation.module.css';

export function Navigation() {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logo}>
              PayBanana
            </Link>
          </div>
          <div className={styles.actionButtons}>
            <Link href="/sign-up" className={styles.applyButton}>
              <Button variant="outline">
                Apply now
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 