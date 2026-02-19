/**
 * TopDog Master Glossary - Module Overview Page
 */

import { ArrowLeft, Layers, AlertTriangle, Zap } from 'lucide-react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { elements, screens } from '@/lib/glossary/elements';
import {
  GlossaryElement,
  ModuleId,
  MODULE_NAMES,
  ELEMENT_TYPE_LABELS,
  generateSlug,
} from '@/lib/glossary/types';

import styles from '../glossary.module.css';

const MODULE_DESCRIPTIONS: Record<ModuleId, string> = {
  'draft-room': 'The core drafting experience where users participate in live fantasy football drafts. Features real-time picks, player search, queue management, and draft board visualization.',
  'lobby': 'Tournament discovery hub where users browse and join available contests. Includes featured tournaments, filtering options, and entry flow.',
  'my-teams': 'Dashboard for managing drafted teams. View standings, check scores, review past drafts, and track winnings.',
  'live-slow-drafts': 'Active draft management for both fast (real-time) and slow (multi-day) drafts. Quick access to ongoing drafts and turn notifications.',
  'auth': 'User authentication flows including login, registration, password recovery, phone verification, and biometric authentication.',
  'settings': 'User preferences and account management. Includes notification settings, autodraft limits, profile customization, and payment methods.',
  'payments': 'Financial transaction hub for deposits, withdrawals, and transaction history. Supports multiple payment providers and currencies.',
  'onboarding': 'First-time user experience introducing the app, explaining best ball format, and guiding through initial setup.',
  'navigation-shell': 'Global navigation structure including tab bar, headers, loading states, and system-level UI patterns.',
};

interface ModuleOverviewProps {
  moduleId: ModuleId;
  moduleName: string;
  moduleDescription: string;
  elements: GlossaryElement[];
  stats: {
    total: number;
    interactive: number;
    withTechDebt: number;
    byType: Record<string, number>;
  };
}

export default function ModuleOverview({
  moduleId,
  moduleName,
  moduleDescription,
  elements: moduleElements,
  stats,
}: ModuleOverviewProps) {
  // Group elements by parent/component
  const elementsByParent = moduleElements.reduce((acc, el) => {
    const parent = el.parent || 'Other';
    if (!acc[parent]) acc[parent] = [];
    acc[parent].push(el);
    return acc;
  }, {} as Record<string, GlossaryElement[]>);

  return (
    <>
      <Head>
        <title>{moduleName} | TopDog Glossary</title>
        <meta name="description" content={moduleDescription} />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/topdog/glossary" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Glossary
            </Link>
          </div>
        </header>

        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Module Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}>
              {moduleName}
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              maxWidth: '800px',
            }}>
              {moduleDescription}
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Layers size={18} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Elements</span>
              </div>
              <span style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {stats.total}
              </span>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={18} style={{ color: 'var(--accent-green)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Interactive</span>
              </div>
              <span style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {stats.interactive}
              </span>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--accent-orange)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>With Tech Debt</span>
              </div>
              <span style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {stats.withTechDebt}
              </span>
            </div>
          </div>

          {/* Element Type Breakdown */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: 'var(--text-primary)',
            }}>
              Elements by Type
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              {Object.entries(stats.byType).map(([type, count]) => (
                <span
                  key={type}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {ELEMENT_TYPE_LABELS[type as keyof typeof ELEMENT_TYPE_LABELS] || type}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Elements by Component */}
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}>
            Elements by Component
          </h2>

          {Object.entries(elementsByParent).map(([parent, els]) => (
            <div
              key={parent}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                marginBottom: '16px',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{parent}</span>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {els.length} elements
                </span>
              </div>

              <div style={{ padding: '12px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '12px',
                }}>
                  {els.map((el) => (
                    <Link
                      key={el.id}
                      href={`/topdog/glossary/${generateSlug(el.name)}`}
                      style={{
                        display: 'block',
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                      }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: 'var(--accent-purple)',
                          background: 'rgba(163, 113, 247, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}>
                          {el.id}
                        </span>
                        {el.isInteractive && (
                          <span style={{
                            fontSize: '10px',
                            color: 'var(--accent-green)',
                            background: 'rgba(63, 185, 80, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                          }}>
                            Interactive
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                      }}>
                        {el.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const moduleIds: ModuleId[] = [
    'draft-room',
    'lobby',
    'my-teams',
    'live-slow-drafts',
    'auth',
    'settings',
    'payments',
    'onboarding',
    'navigation-shell',
  ];

  const paths = moduleIds.map((id) => ({
    params: { moduleId: id },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ModuleOverviewProps> = async ({ params }) => {
  const moduleId = params?.moduleId as ModuleId;
  const moduleName = MODULE_NAMES[moduleId] || moduleId;
  const moduleDescription = MODULE_DESCRIPTIONS[moduleId];

  const moduleElements = elements.filter((el) => el.module === moduleId);

  // Calculate stats
  const stats = {
    total: moduleElements.length,
    interactive: moduleElements.filter((el) => el.isInteractive).length,
    withTechDebt: moduleElements.filter((el) => el.techDebt && el.techDebt.length > 0).length,
    byType: moduleElements.reduce((acc, el) => {
      acc[el.elementType] = (acc[el.elementType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    props: {
      moduleId,
      moduleName,
      moduleDescription,
      elements: moduleElements,
      stats,
    },
  };
};
