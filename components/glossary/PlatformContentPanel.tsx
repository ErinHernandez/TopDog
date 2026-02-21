/**
 * PlatformContentPanel Component
 *
 * Displays platform-specific implementation details with animated transitions.
 * Content sections include: Implementation, Architecture, Best Practices, Improvements.
 */

import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Platform } from './DeviceFrame';
import styles from './PlatformContentPanel.module.css';

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

interface PlatformContent {
  implementation?: {
    code?: CodeBlock;
    props?: Array<{ name: string; type: string; description: string; required?: boolean }>;
    usage?: string;
  };
  architecture?: {
    stateManagement?: string;
    dataFlow?: string;
    dependencies?: string[];
  };
  bestPractices?: Array<{ do: string; dont?: string }>;
  improvements?: Array<{ description: string; priority: 'low' | 'medium' | 'high' }>;
}

interface PlatformContentPanelProps {
  platform: Platform;
  content?: PlatformContent;
  isTransitioning?: boolean;
}

const PLATFORM_LABELS: Record<Platform, { name: string; language: string }> = {
  web: { name: 'Web', language: 'TypeScript / React' },
  ios: { name: 'iOS', language: 'Swift / SwiftUI' },
  ipad: { name: 'iPadOS', language: 'Swift / SwiftUI' },
  android: { name: 'Android', language: 'Kotlin / Compose' },
};

export function PlatformContentPanel({
  platform,
  content,
  isTransitioning = false,
}: PlatformContentPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['implementation']),
  );

  const platformInfo = PLATFORM_LABELS[platform];

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Reset expanded sections when platform changes - valid use case for derived state reset
  useEffect(() => {
    setExpandedSections(new Set(['implementation']));
  }, [platform]);

  return (
    <div className={`${styles.panel} ${isTransitioning ? styles.transitioning : ''}`}>
      {/* Platform Header */}
      <div className={styles.platformHeader}>
        <div className={styles.platformBadge} data-platform={platform}>
          {platformInfo.name}
        </div>
        <span className={styles.languageLabel}>{platformInfo.language}</span>
      </div>

      {/* Implementation Section */}
      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggleSection('implementation')}>
          {expandedSections.has('implementation') ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span>Implementation</span>
        </button>

        {expandedSections.has('implementation') && (
          <div className={styles.sectionContent}>
            {content?.implementation?.code ? (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <span className={styles.codeLanguage}>
                    {content.implementation.code.language}
                  </span>
                  {content.implementation.code.filename && (
                    <span className={styles.codeFilename}>
                      {content.implementation.code.filename}
                    </span>
                  )}
                  <button
                    className={styles.copyButton}
                    onClick={() => {
                      const impl = content.implementation?.code?.code;
                      if (impl) {
                        copyToClipboard(impl, 'code');
                      }
                    }}
                  >
                    {copiedField === 'code' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <pre className={styles.codeContent}>
                  <code>{content.implementation.code.code}</code>
                </pre>
              </div>
            ) : (
              <div className={styles.emptyState}>
                No implementation details available for {platformInfo.name}
              </div>
            )}

            {content?.implementation?.props && content.implementation.props.length > 0 && (
              <div className={styles.propsTable}>
                <h4>Props / Parameters</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.implementation.props.map((prop, idx) => (
                      <tr key={idx}>
                        <td>
                          <code>{prop.name}</code>
                          {prop.required && <span className={styles.required}>*</span>}
                        </td>
                        <td>
                          <code>{prop.type}</code>
                        </td>
                        <td>{prop.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Architecture Section */}
      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggleSection('architecture')}>
          {expandedSections.has('architecture') ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span>Architecture</span>
        </button>

        {expandedSections.has('architecture') && (
          <div className={styles.sectionContent}>
            {content?.architecture ? (
              <div className={styles.architectureGrid}>
                {content.architecture.stateManagement && (
                  <div className={styles.archItem}>
                    <label>State Management</label>
                    <p>{content.architecture.stateManagement}</p>
                  </div>
                )}
                {content.architecture.dataFlow && (
                  <div className={styles.archItem}>
                    <label>Data Flow</label>
                    <p>{content.architecture.dataFlow}</p>
                  </div>
                )}
                {content.architecture.dependencies &&
                  content.architecture.dependencies.length > 0 && (
                    <div className={styles.archItem}>
                      <label>Dependencies</label>
                      <ul>
                        {content.architecture.dependencies.map((dep, idx) => (
                          <li key={idx}>
                            <code>{dep}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <div className={styles.emptyState}>No architecture details available</div>
            )}
          </div>
        )}
      </section>

      {/* Best Practices Section */}
      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggleSection('bestPractices')}>
          {expandedSections.has('bestPractices') ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span>Best Practices</span>
        </button>

        {expandedSections.has('bestPractices') && (
          <div className={styles.sectionContent}>
            {content?.bestPractices && content.bestPractices.length > 0 ? (
              <div className={styles.practicesList}>
                {content.bestPractices.map((practice, idx) => (
                  <div key={idx} className={styles.practiceItem}>
                    <div className={styles.doItem}>
                      <span className={styles.doLabel}>Do</span>
                      <p>{practice.do}</p>
                    </div>
                    {practice.dont && (
                      <div className={styles.dontItem}>
                        <span className={styles.dontLabel}>Avoid</span>
                        <p>{practice.dont}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No best practices documented yet</div>
            )}
          </div>
        )}
      </section>

      {/* Improvements Section */}
      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggleSection('improvements')}>
          {expandedSections.has('improvements') ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span>Suggested Improvements</span>
        </button>

        {expandedSections.has('improvements') && (
          <div className={styles.sectionContent}>
            {content?.improvements && content.improvements.length > 0 ? (
              <div className={styles.improvementsList}>
                {content.improvements.map((item, idx) => (
                  <div key={idx} className={`${styles.improvementItem} ${styles[item.priority]}`}>
                    <span className={styles.priorityBadge}>{item.priority}</span>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No improvements suggested</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default PlatformContentPanel;
