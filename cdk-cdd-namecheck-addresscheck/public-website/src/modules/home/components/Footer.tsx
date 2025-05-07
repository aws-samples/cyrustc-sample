import React from 'react';
import styles from './Footer.module.css';

const FOOTER_SECTIONS = [
  {
    title: 'Products',
    items: ['Global Account', 'FX Solutions', 'Payment Processing', 'API Integration']
  },
  {
    title: 'Company',
    items: ['About Us', 'Careers', 'Press', 'Contact']
  },
  {
    title: 'Resources',
    items: ['Blog', 'Help Center', 'API Documentation', 'Status']
  },
  {
    title: 'Legal',
    items: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance']
  }
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <ul className={styles.linkList}>
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className={styles.link}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.copyright}>
          <p>&copy; 2024 PayBanana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 