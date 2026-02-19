import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer(): React.ReactElement {
  return (
    <footer className={styles.footer}>
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            &copy; 2026 Idesaign
          </p>
          <nav className={styles.footerNav}>
            <Link href="/dashboard" className={styles.footerLink}>
              Dashboard
            </Link>
            <Link href="/gallery" className={styles.footerLink}>
              Gallery
            </Link>
            <Link href="/api-docs" className={styles.footerLink}>
              API
            </Link>
            <Link href="/health" className={styles.footerLink}>
              Status
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
