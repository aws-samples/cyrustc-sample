'use client';

import React from 'react';
import styles from './styles.module.css';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className={styles.container}>
      {steps.map((step, index) => (
        <div key={step} className={styles.stepWrapper}>
          <div className={`${styles.step} ${index + 1 <= currentStep ? styles.active : ''}`}>
            <div className={styles.number}>{index + 1}</div>
            <div className={styles.label}>{step}</div>
          </div>
          {index < steps.length - 1 && (
            <div className={`${styles.line} ${index + 1 < currentStep ? styles.active : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
} 