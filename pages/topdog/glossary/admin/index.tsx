/**
 * Glossary Admin Dashboard
 *
 * Central hub for managing the screenshot capture and element extraction workflow.
 *
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

import {
  Camera,
  Scissors,
  Layers,
  Play,
  ArrowRight,
  Smartphone,
  Monitor,
  FileImage,
  Settings,
  Database,
} from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { DRAFT_STATES } from '@/lib/glossary/screenshots/types';

import styles from './admin-index.module.css';

export default function GlossaryAdmin() {
  return (
    <>
      <Head>
        <title>Glossary Admin | TopDog</title>
        <meta name="description" content="Screenshot and element management dashboard" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/topdog/glossary" className={styles.backLink}>
              ← Back to Glossary
            </Link>
            <h1 className={styles.title}>
              <Database size={32} />
              Glossary Admin
            </h1>
            <p className={styles.subtitle}>
              Screenshot capture, element extraction, and asset management
            </p>
          </div>
        </header>

        {/* Workflow Overview */}
        <section className={styles.workflowSection}>
          <h2 className={styles.sectionTitle}>Workflow Pipeline</h2>
          <div className={styles.workflow}>
            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>1</div>
              <Camera size={24} />
              <span>Capture</span>
            </div>
            <ArrowRight className={styles.workflowArrow} />
            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>2</div>
              <Scissors size={24} />
              <span>Extract</span>
            </div>
            <ArrowRight className={styles.workflowArrow} />
            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>3</div>
              <Layers size={24} />
              <span>Clean & Store</span>
            </div>
            <ArrowRight className={styles.workflowArrow} />
            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>4</div>
              <FileImage size={24} />
              <span>Use in Glossary</span>
            </div>
          </div>
        </section>

        {/* Main Cards */}
        <main className={styles.main}>
          <div className={styles.cardGrid}>
            {/* Screenshot Depot Card */}
            <Link href="/topdog/glossary/admin/screenshot-depot" className={styles.card}>
              <div className={styles.cardIcon} style={{ backgroundColor: '#3B82F620' }}>
                <Camera size={32} style={{ color: '#3B82F6' }} />
              </div>
              <div className={styles.cardContent}>
                <h3>Screenshot Depot</h3>
                <p>
                  Raw screenshot storage. Capture screenshots from localhost:3000
                  automatically or upload manually.
                </p>
                <div className={styles.cardFeatures}>
 <span> Automated capture</span>
 <span> Multi-platform</span>
 <span> Organized storage</span>
                </div>
              </div>
              <ArrowRight className={styles.cardArrow} />
            </Link>

            {/* Element Extractor Card */}
            <Link href="/topdog/glossary/admin/element-extractor" className={styles.card}>
              <div className={styles.cardIcon} style={{ backgroundColor: '#10B98120' }}>
                <Scissors size={32} style={{ color: '#10B981' }} />
              </div>
              <div className={styles.cardContent}>
                <h3>Element Extractor</h3>
                <p>
                  Visual cropping sandbox. Select and extract individual UI elements
                  from screenshots with precision.
                </p>
                <div className={styles.cardFeatures}>
 <span> Precise cropping</span>
 <span> Element labeling</span>
 <span> Auto-padding</span>
                </div>
              </div>
              <ArrowRight className={styles.cardArrow} />
            </Link>

            {/* Cleaned Elements Card */}
            <Link href="/topdog/glossary/admin/cleaned-elements" className={styles.card}>
              <div className={styles.cardIcon} style={{ backgroundColor: '#8B5CF620' }}>
                <Layers size={32} style={{ color: '#8B5CF6' }} />
              </div>
              <div className={styles.cardContent}>
                <h3>Cleaned Elements Library</h3>
                <p>
                  Production-ready assets. Review, approve, and manage cleaned
                  elements for use in the glossary.
                </p>
                <div className={styles.cardFeatures}>
 <span> Quality control</span>
 <span> State carousel</span>
 <span> Usage tracking</span>
                </div>
              </div>
              <ArrowRight className={styles.cardArrow} />
            </Link>
          </div>
        </main>

        {/* Quick Stats */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>System Overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Smartphone size={24} />
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{DRAFT_STATES.length}</span>
                <span className={styles.statLabel}>Draft UI States</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <Monitor size={24} />
              <div className={styles.statInfo}>
                <span className={styles.statValue}>4</span>
                <span className={styles.statLabel}>Platforms</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <FileImage size={24} />
              <div className={styles.statInfo}>
                <span className={styles.statValue}>18</span>
                <span className={styles.statLabel}>Glossary Elements</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <Camera size={24} />
              <div className={styles.statInfo}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Raw Screenshots</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.actionsSection}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button className={styles.actionButton}>
              <Play size={18} />
              Start Capture Job
            </button>
            <button className={styles.actionButton}>
              <Settings size={18} />
              Configure Routes
            </button>
            <Link href="/topdog/glossary" className={styles.actionButtonLink}>
              View Live Glossary →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>
 Part of the world&apos;s first enterprise-grade app with zero human-written code 
          </p>
        </footer>
      </div>
    </>
  );
}
