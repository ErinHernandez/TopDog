/**
 * TopDog Master Glossary - Element Detail Page
 *
 * Enterprise-grade documentation with platform-specific content.
 * Wireframes act as platform selectors in a horizontal carousel.
 */

import {
  ArrowLeft,
  Zap,
  Layers,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { Platform } from '@/components/glossary/DeviceFrame';
import { PlatformContentPanel } from '@/components/glossary/PlatformContentPanel';
import { WireframeCarousel } from '@/components/glossary/WireframeCarousel';
import { elements } from '@/lib/glossary/elements';
import {
  GlossaryElement,
  MODULE_NAMES,
  ELEMENT_TYPE_LABELS,
  generateSlug,
  findElementBySlug,
} from '@/lib/glossary/types';

import styles from './element.module.css';

interface ElementDetailProps {
  element: GlossaryElement;
  relatedElements: GlossaryElement[];
}

export default function ElementDetail({ element, relatedElements }: ElementDetailProps) {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('ios');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (router.isFallback) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Handle platform selection with transition
  const handlePlatformSelect = (platform: Platform) => {
    if (platform === selectedPlatform) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPlatform(platform);
      setIsTransitioning(false);
    }, 150);
  };

  // Copy element ID to clipboard
  const copyElementId = async () => {
    await navigator.clipboard.writeText(element.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Prepare wireframe context
  const wireframeContext = element.wireframeContext ? {
    boundingBox: element.wireframeContext.boundingBox ? {
      x: Number(element.wireframeContext.boundingBox.x || 0),
      y: Number(element.wireframeContext.boundingBox.y || 0),
      width: Number(element.wireframeContext.boundingBox.width),
      height: Number(element.wireframeContext.boundingBox.height),
    } : undefined,
    highlightColor: element.wireframeContext.highlightColor,
    annotationPosition: element.wireframeContext.annotationPosition as 'top' | 'right' | 'bottom' | 'left' | undefined,
  } : undefined;

  // Filter tech debt by selected platform
  const platformTechDebt = element.techDebt?.filter(item =>
    !item.affectedPlatforms ||
    item.affectedPlatforms.length === 0 ||
    item.affectedPlatforms.includes(selectedPlatform === 'ipad' ? 'ios' : selectedPlatform)
  ) || [];

  // Generate platform-specific content from element data
  const getPlatformContent = (platform: Platform) => {
    const platformDocs = element.platformDocs?.[platform];
    const codeRef = element.codeReferences.find(
      ref => ref.platform === (platform === 'ipad' ? 'ios' : platform)
    );

    // Map PlatformDocumentation to PlatformContent interface
    return {
      implementation: {
        code: codeRef && codeRef.componentPath ? {
          language: platform === 'web' ? 'typescript' : 'swift',
          code: `// ${codeRef.componentPath}\n// Lines ${codeRef.lineStart}-${codeRef.lineEnd}`,
          filename: codeRef.componentPath.split('/').pop(),
        } : undefined,
        // No direct props mapping - bestPractices.codeExample provides usage
        usage: platformDocs?.bestPractices?.codeExample,
      },
      architecture: platformDocs?.architecture ? {
        stateManagement: platformDocs.architecture.stateManagement,
        dataFlow: platformDocs.architecture.dataFlow,
        dependencies: platformDocs.architecture.dependencies,
      } : undefined,
      bestPractices: platformDocs?.bestPractices ?
        platformDocs.bestPractices.doList.map((doItem, idx) => ({
          do: doItem,
          dont: platformDocs.bestPractices.dontList[idx],
        })) : undefined,
      improvements: platformDocs?.improvements?.map(imp => ({
        description: imp.summary,
        priority: imp.impact,
      })),
    };
  };

  return (
    <>
      <Head>
        <title>{element.name} | TopDog Glossary</title>
        <meta name="description" content={element.description} />
      </Head>

      <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        {/* Navigation Bar - Card */}
        <div className={styles.navCard}>
          <nav className={styles.navBar}>
            <Link href="/topdog/glossary" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Glossary</span>
            </Link>
            <Link
              href={`/topdog/glossary/module/${element.module}`}
              className={styles.moduleLink}
            >
              {MODULE_NAMES[element.module]}
            </Link>
          </nav>
        </div>

        {/* Header Section - Modal Card */}
        <div className={styles.headerCard}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.titleRow}>
                <h1 className={styles.elementName}>{element.name}</h1>
                <button
                  className={styles.idBadge}
                  onClick={copyElementId}
                  title="Copy ID"
                >
                  <span>{element.id}</span>
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <span className={`${styles.typeBadge} ${styles[element.elementType]}`}>
                  {ELEMENT_TYPE_LABELS[element.elementType]}
                </span>
              </div>

              <p className={styles.description}>{element.description}</p>

              <div className={styles.metaTags}>
                {element.isInteractive && (
                  <span className={styles.metaTag}>
                    <Zap size={12} /> Interactive
                  </span>
                )}
                <span className={styles.metaTag}>
                  <Layers size={12} /> {element.states.length} States
                </span>
                {platformTechDebt.length > 0 && (
                  <span className={`${styles.metaTag} ${styles.warning}`}>
                    <AlertTriangle size={12} /> {platformTechDebt.length} Issues
                  </span>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Wireframe Carousel - Platform Selector */}
        <section className={styles.carouselSection}>
          <WireframeCarousel
            selectedPlatform={selectedPlatform}
            onPlatformSelect={handlePlatformSelect}
            elementId={element.id}
            elementName={element.name}
            wireframeContext={wireframeContext}
            parentRegion={element.parent}
            availablePlatforms={['ios', 'ipad', 'web', 'android']}
          />
        </section>

        {/* Platform Content Panel */}
        <section className={styles.contentSection}>
          <PlatformContentPanel
            platform={selectedPlatform}
            content={getPlatformContent(selectedPlatform)}
            isTransitioning={isTransitioning}
          />
        </section>

        {/* Tech Debt Section - Platform Filtered */}
        {platformTechDebt.length > 0 && (
          <section className={`${styles.techDebtSection} ${isTransitioning ? styles.transitioning : ''}`}>
            <h3 className={styles.sectionTitle}>
              <AlertTriangle size={16} />
              Tech Debt
              <span className={styles.platformIndicator}>{selectedPlatform.toUpperCase()}</span>
            </h3>
            <div className={styles.techDebtList}>
              {platformTechDebt.map((item, idx) => (
                <div
                  key={item.id || `debt-${idx}`}
                  className={`${styles.techDebtItem} ${styles[item.priority]}`}
                >
                  <span className={styles.priorityBadge}>{item.priority}</span>
                  <div className={styles.techDebtContent}>
                    <p>{item.description || item.item}</p>
                    {(item.remediation || item.suggestedFix) && (
                      <span className={styles.remediation}>{item.remediation || item.suggestedFix}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Elements - Card */}
        {relatedElements.length > 0 && (
          <div className={styles.relatedCard}>
            <section className={styles.relatedSection}>
              <h3 className={styles.sectionTitle}>Related Elements</h3>
              <div className={styles.relatedGrid}>
                {relatedElements.slice(0, 6).map((el) => (
                  <Link
                    key={el.id}
                    href={`/topdog/glossary/${generateSlug(el.name)}`}
                    className={styles.relatedLink}
                  >
                    <span className={styles.relatedId}>{el.id}</span>
                    <span className={styles.relatedName}>{el.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Footer Meta - Card */}
        <div className={styles.footerCard}>
          <footer className={styles.footer}>
            <span>Last updated: {element.lastUpdated}</span>
            <span>by {element.updatedBy}</span>
          </footer>
        </div>
      </div>

      {/* Static iPhone Device Frame - Right Side */}
      <div className={styles.deviceFramePanel}>
        <div className={styles.iphoneFrame}>
          {/* Notch / Dynamic Island */}
          <div className={styles.iphoneNotch}>
            <div className={styles.notchCamera} />
          </div>

          {/* Screen Area */}
          <div className={styles.iphoneScreen}>
            {/* Screen content will go here */}
          </div>

          {/* Home Indicator */}
          <div className={styles.iphoneHomeIndicator} />

          {/* Side Buttons */}
          <div className={styles.iphoneSideButton} data-button="power" />
          <div className={styles.iphoneSideButton} data-button="volume-up" />
          <div className={styles.iphoneSideButton} data-button="volume-down" />
          <div className={styles.iphoneSideButton} data-button="silent" />
        </div>
      </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = elements.map((el) => ({
    params: { slug: generateSlug(el.name) },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<ElementDetailProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const element = findElementBySlug(elements, slug);

  if (!element) {
    return {
      notFound: true,
    };
  }

  const relatedElements = elements
    .filter((el) => el.module === element.module && el.id !== element.id)
    .slice(0, 10);

  return {
    props: {
      element,
      relatedElements,
    },
  };
};
