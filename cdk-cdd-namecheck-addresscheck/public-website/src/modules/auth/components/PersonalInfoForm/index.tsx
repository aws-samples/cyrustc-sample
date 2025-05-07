'use client';

import React, { FormEvent } from 'react';
import { Button } from '@/modules/core/components/Button';
import styles from './styles.module.css';

interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  country: string;
}

interface PersonalInfoFormProps {
  onPrevious: () => void;
  onNext: (data: PersonalInfo) => void;
}

export function PersonalInfoForm({ onPrevious, onNext }: PersonalInfoFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    const data: PersonalInfo = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      middleName: (form.elements.namedItem('middleName') as HTMLInputElement).value || undefined,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      dateOfBirth: (form.elements.namedItem('dateOfBirth') as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem('phoneNumber') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLTextAreaElement).value,
      country: (form.elements.namedItem('country') as HTMLSelectElement).value,
    };

    onNext(data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName" className={styles.label}>First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className={styles.input}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="middleName" className={styles.label}>Middle Name</label>
          <input
            id="middleName"
            name="middleName"
            type="text"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName" className={styles.label}>Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="dateOfBirth" className={styles.label}>Date of Birth</label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="phoneNumber" className={styles.label}>Phone Number</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="address" className={styles.label}>Contact Address</label>
        <textarea
          id="address"
          name="address"
          className={styles.textarea}
          rows={3}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="country" className={styles.label}>Country</label>
        <select id="country" name="country" className={styles.select} required>
          <option value="">Select a country</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
          {/* Add more countries */}
        </select>
      </div>

      <div className={styles.buttons}>
        <Button variant="ghost" type="button" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="submit">
          Next
        </Button>
      </div>
    </form>
  );
} 