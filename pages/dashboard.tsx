/**
 * Idesaign — Dashboard Page
 *
 * Protected route showing user's projects with:
 * - Header with logo, nav, user menu
 * - Welcome message & new project button
 * - Project grid with hover actions (open, rename, duplicate, delete)
 * - Right sidebar with stats and recent projects
 *
 * Thin composition layer — logic lives in useProjects hook,
 * card UI lives in ProjectCard component.
 *
 * @module pages/dashboard
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard, toDate, formatDate } from '@/components/dashboard/ProjectCard';
import { DashboardErrorBoundary } from '@/components/errors/FeatureErrorBoundary';
import { getServerSideProps as _getServerSideProps } from '@/lib/auth/withServerAuth';
import styles from '@/styles/dashboard.module.css';

// Server-side auth guard — redirects to /login if token is invalid
export const getServerSideProps = _getServerSideProps;

/* ================================================================
   Types
   ================================================================ */

interface MenuItem {
  label: string;
  href: string;
  active?: boolean;
}

/* ================================================================
   Dashboard Page
   ================================================================ */

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardErrorBoundary>
        <DashboardContent />
      </DashboardErrorBoundary>
    </ProtectedRoute>
  );
}

/* ================================================================
   Dashboard Content (protected)
   ================================================================ */

function DashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const {
    projects,
    recentProjects,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    setError,
    loadMore,
    createProject,
    renameProject,
    duplicateProject,
    deleteProject,
  } = useProjects(user?.uid);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Create new project and redirect to editor
  const handleCreateProject = useCallback(async () => {
    if (!user?.uid) return;
    setIsCreatingProject(true);
    const newId = await createProject(user.uid);
    if (newId) {
      await router.push(`/editor/${newId}`);
    }
    setIsCreatingProject(false);
  }, [user?.uid, router, createProject]);

  const handleOpenProject = useCallback(
    (projectId: string) => router.push(`/editor/${projectId}`),
    [router]
  );

  const handleRenameStart = useCallback((project: { id: string; name: string }) => {
    setRenamingId(project.id);
    setNewName(project.name);
  }, []);

  const handleRenameSave = useCallback(
    async (projectId: string) => {
      if (!newName.trim()) {
        setRenamingId(null);
        return;
      }
      await renameProject(projectId, newName);
      setRenamingId(null);
    },
    [newName, renameProject]
  );

  const handleDuplicate = useCallback(
    async (project: Parameters<typeof duplicateProject>[0]) => {
      if (!user?.uid) return;
      await duplicateProject(project, user.uid);
    },
    [user?.uid, duplicateProject]
  );

  const handleDelete = useCallback(
    async (projectId: string) => {
      if (!confirm('Are you sure you want to delete this project?')) return;
      await deleteProject(projectId);
    },
    [deleteProject]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      await router.push('/login');
    } catch {
      setError('Failed to sign out.');
    }
  }, [signOut, router, setError]);

  const navigationItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', active: true },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Profile', href: '/profile' },
  ];

  const displayName = user?.displayName || 'there';

  return (
    <>
      <Head>
        <title>Dashboard — Idesaign</title>
        <meta name="description" content="Manage your Idesaign projects" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <span className={styles.logoText}>Idesaign</span>
            </div>
            <nav className={styles.nav}>
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${item.active ? styles.navLinkActive : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userMenuContainer} ref={menuRef}>
              <button
                className={styles.userButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                title={displayName}
              >
                <div className={styles.userAvatar}>{displayName.charAt(0).toUpperCase()}</div>
              </button>

              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.userEmail}>{user?.email}</span>
                  </div>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleSignOut();
                      setUserMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className={styles.mainContainer}>
          <main className={styles.main}>
            {/* Welcome section */}
            <section className={styles.welcomeSection}>
              <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeHeading}>Welcome back, {displayName}!</h1>
                <p className={styles.welcomeSubtitle}>
                  {projects.length === 0
                    ? 'Create your first project to get started'
                    : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                className={styles.newProjectButton}
                onClick={handleCreateProject}
                disabled={isCreatingProject}
              >
                <span className={styles.buttonIcon}>+</span>
                <span>New Project</span>
              </button>
            </section>

            {/* Error message */}
            {error && (
              <div className={styles.errorBanner} role="alert">
                <span className={styles.errorMessage}>{error}</span>
                <button className={styles.errorClose} onClick={() => setError(null)} aria-label="Close">
                  ✕
                </button>
              </div>
            )}

            {/* Loading state */}
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Loading your projects...</p>
              </div>
            ) : projects.length === 0 ? (
              /* Empty state */
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h2 className={styles.emptyHeading}>No projects yet</h2>
                <p className={styles.emptyText}>
                  Create your first project to get started with Idesaign
                </p>
                <button
                  className={styles.emptyButton}
                  onClick={handleCreateProject}
                  disabled={isCreatingProject}
                >
                  Create First Project
                </button>
              </div>
            ) : (
              /* Projects grid */
              <div className={styles.projectsSection}>
                <div className={styles.projectsGrid}>
                  {projects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isRenaming={renamingId === project.id}
                      newName={newName}
                      onNameChange={setNewName}
                      onOpen={() => handleOpenProject(project.id)}
                      onRenameStart={() => handleRenameStart(project)}
                      onRenameSave={() => handleRenameSave(project.id)}
                      onRenameCancel={() => setRenamingId(null)}
                      onDuplicate={() => handleDuplicate(project)}
                      onDelete={() => handleDelete(project.id)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className={styles.loadMoreContainer}>
                    <button
                      className={styles.loadMoreButton}
                      onClick={loadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Stats */}
            <div className={styles.statsCard}>
              <h3 className={styles.statsTitle}>Statistics</h3>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Projects</span>
                <span className={styles.statValue}>{projects.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Storage Used</span>
                <span className={styles.statValue}>—</span>
                <span className={styles.statSubtext}>Coming soon</span>
              </div>
            </div>

            {/* Recent projects */}
            {recentProjects.length > 0 && (
              <div className={styles.recentCard}>
                <h3 className={styles.recentTitle}>Recent</h3>
                <div className={styles.recentList}>
                  {recentProjects.map(project => (
                    <button
                      key={project.id}
                      className={styles.recentItem}
                      onClick={() => handleOpenProject(project.id)}
                      title={project.name}
                    >
                      <span className={styles.recentName}>{project.name}</span>
                      <span className={styles.recentDate}>
                        {formatDate(toDate(project.updatedAt))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className={styles.linksCard}>
              <h3 className={styles.linksTitle}>Quick Links</h3>
              <div className={styles.linksList}>
                <Link href="/gallery" className={styles.link}>Gallery</Link>
                <Link href="/profile" className={styles.link}>Settings</Link>
                <a href="#help" className={styles.link}>Help</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
