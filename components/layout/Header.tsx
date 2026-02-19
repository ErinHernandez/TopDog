import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { NotificationBell } from '@/components/notifications';
import styles from './Header.module.css';

interface HeaderProps {
  variant?: 'default' | 'transparent';
}

export function Header({ variant = 'default' }: HeaderProps): React.ReactElement {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/auth/AuthProvider').then(
        (m) => ({ signOut: m.useAuth().signOut })
      );
    } catch {
      // Handle error silently for now
    }
  };

  const getUserInitial = (): string => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className={`${styles.header} ${styles[variant]}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          Idesaign
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/gallery" className={styles.navLink}>
            Gallery
          </Link>
        </nav>

        {/* Auth Section - Desktop */}
        <div className={`${styles.authSection} ${styles.desktop}`}>
          {loading ? (
            <div className={styles.skeleton} />
          ) : user ? (
            <div className={styles.userSection}>
              <Link href="/dashboard" className={styles.dashboardLink}>
                Dashboard
              </Link>
              <NotificationBell />
              <div className={styles.dropdown}>
                <button
                  className={styles.avatarButton}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <span className={styles.avatar}>{getUserInitial()}</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link href="/profile" className={styles.dropdownItem}>
                      Profile
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem}>
                      Settings
                    </Link>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.signInLink}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={`${styles.mobileToggle} ${styles.mobile}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={styles.hamburgerIcon} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className={styles.mobileMenu}>
          <Link href="/dashboard" className={styles.mobileNavLink}>
            Dashboard
          </Link>
          <Link href="/gallery" className={styles.mobileNavLink}>
            Gallery
          </Link>
          <div className={styles.mobileAuthSection}>
            {loading ? (
              <div className={styles.skeleton} />
            ) : user ? (
              <>
                <Link href="/dashboard" className={styles.mobileNavLink}>
                  Dashboard
                </Link>
                <Link href="/profile" className={styles.mobileNavLink}>
                  Profile
                </Link>
                <Link href="/settings" className={styles.mobileNavLink}>
                  Settings
                </Link>
                <button
                  className={styles.mobileNavLink}
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.mobileNavLink}>
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
