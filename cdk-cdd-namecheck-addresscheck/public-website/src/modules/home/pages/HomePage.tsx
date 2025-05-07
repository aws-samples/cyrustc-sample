import React from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.root}>
      {/* Gradient orbs */}
      <div className={styles.gradientOrb1} />
      <div className={styles.gradientOrb2} />

      <Navigation />

      <Footer />
    </div>
  );
} 