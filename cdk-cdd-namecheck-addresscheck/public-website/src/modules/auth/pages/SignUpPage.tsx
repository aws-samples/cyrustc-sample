'use client';

import React, { useState } from 'react';
import { SignUpForm } from '../components/SignUpForm';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { DocumentUploadForm } from '../components/DocumentUploadForm';
import { StepIndicator } from '../components/StepIndicator';
import { createOnboarding, OnboardingData } from '../services/onboarding';
import styles from './SignUpPage.module.css';

const STEPS = ['Account', 'Personal Info', 'Documents'];

interface FormDataWithAnalysis extends Partial<OnboardingData> {
  analysisId?: string;
}

export function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataWithAnalysis>({});
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNext = (data: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (documents: string[], analysisId: string) => {
    try {
      setIsSubmitting(true);
      setError('');

      const completeData: OnboardingData = {
        ...formData as Omit<OnboardingData, 'documents' | 'analysisId'>,
        documents,
        analysisId
      };

      const response = await createOnboarding(completeData);
      console.log('Onboarding successful:', response);
      
      setIsSuccess(true);
      
    } catch (err) {
      console.error('Onboarding failed:', err);
      setError('Failed to complete sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SignUpForm onNext={(email) => handleNext({ email })} />;
      case 2:
        return (
          <PersonalInfoForm 
            onPrevious={handlePrevious} 
            onNext={(data) => handleNext(data)} 
          />
        );
      case 3:
        return (
          <DocumentUploadForm 
            onPrevious={handlePrevious} 
            onSubmit={(documents, analysisId) => handleSubmit(documents, analysisId)}
            isSubmitting={isSubmitting}
            email={formData.email || ''}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.gradientOrb1} />
      <div className={styles.gradientOrb2} />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            <a href="/" className={styles.logo}>
              PayBanana
            </a>
            
            {!isSuccess && (
              <>
                <h1 className={styles.title}>Create your account</h1>
                <p className={styles.description}>
                  Get started with PayBanana and simplify your global payments
                </p>
                <StepIndicator currentStep={currentStep} steps={STEPS} />
                {error && <div className={styles.error}>{error}</div>}
              </>
            )}
            
            {currentStep === 3 ? (
              <DocumentUploadForm 
                onPrevious={handlePrevious} 
                onSubmit={(documents, analysisId) => handleSubmit(documents, analysisId)}
                isSubmitting={isSubmitting}
                email={formData.email || ''}
              />
            ) : !isSuccess && renderStep()}
          </div>
        </div>
      </main>
    </div>
  );
} 