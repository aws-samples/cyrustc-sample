import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './Features.module.css';

const FEATURES = [
  {
    title: 'Global Account',
    description: 'One account, global reach. Receive payments in multiple currencies and manage your international finances with ease.'
  },
  {
    title: 'Competitive FX rates',
    description: 'Get the best exchange rates for your international transactions, saving you money on every transfer.'
  },
  {
    title: 'Fast and secure transfers',
    description: 'Send money across borders quickly and securely, with real-time tracking and competitive fees.'
  }
];

export function Features() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          The financial network for businesses to collect, exchange and send money across borders.
        </h2>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
              <a href="#" className={styles.learnMore}>
                Learn more <ArrowRight className={styles.icon} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 