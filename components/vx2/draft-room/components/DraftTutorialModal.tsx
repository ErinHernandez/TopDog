/**
 * DraftTutorialModal - Multi-page tutorial carousel for snake draft
 * 
 * Shows when user taps "Tutorial" in the info modal.
 * VX2-styled pages with position-colored illustrations.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Accessibility: ARIA labels, keyboard navigation
 */

import React, { useState, useCallback } from 'react';

import { cn } from '@/lib/styles';

import styles from './DraftTutorialModal.module.css';

// Colors: DraftTutorialModal.module.css uses global tokens (--color-background, --color-text-muted, --color-accent from styles/tokens.css).

// ============================================================================
// TYPES
// ============================================================================

export interface DraftTutorialModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Called when modal closes */
  onClose: () => void;
  /** Called when Rules button is tapped */
  onRules?: () => void;
  /** Draft format for title */
  format?: string;
  /** Whether to show the "don&apos;t show again" checkbox */
  showDontShowAgain?: boolean;
  /** Callback when "don&apos;t show again" is changed */
  onDontShowAgainChange?: (checked: boolean) => void;
}

interface TutorialPage {
  illustration: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
}

// ============================================================================
// ILLUSTRATIONS - VX2 Style
// ============================================================================

function DraftCardsIllustration(): React.ReactElement {
  return (
    <div className={styles.cardsIllustration}>
      {/* User card - highlighted with blue */}
      <div className={styles.userCard}>
        <div className={styles.userCardHeader}>
          <span className={styles.userCardLabel}>YOUR TURN</span>
        </div>
        <div className={styles.userCardContent}>
          28
        </div>
        <div className={styles.userCardPositions}>
          <div className={styles.positionBar} data-position="qb" />
          <div className={styles.positionBar} data-position="rb" />
          <div className={styles.positionBar} data-position="wr" />
          <div className={styles.positionBar} data-position="te" />
        </div>
      </div>

      {/* Picked cards with players */}
      {[
        { pos: 'WR', name: 'Chase' },
        { pos: 'RB', name: 'Robinson' },
        { pos: 'QB', name: 'Allen' },
      ].map((player, i) => (
        <div
          key={i}
          className={styles.playerCard}
          data-position={player.pos.toLowerCase()}
        >
          <div className={styles.playerCardHeader}>
            <span className={styles.playerCardHeaderLabel}>{player.pos}</span>
          </div>
          <div className={styles.playerCardContent}>
            <div className={styles.playerAvatar} />
            <span className={styles.playerCardName}>{player.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SnakeOrderIllustration(): React.ReactElement {
  const teams = [
    { name: 'YOU', isUser: true, tracker: ['qb', 'rb', 'wr'] },
    { name: 'TEAM 2', isUser: false, tracker: ['rb', 'wr', 'te'] },
    { name: 'TEAM 3', isUser: false, tracker: ['wr', 'rb', 'qb'] },
    { name: 'TEAM 4', isUser: false, tracker: ['rb', 'wr', 'wr'] },
  ];

  // Pick data matching actual board style
  const picks = [
    // Round 1
    [
      { pick: '1.01', first: 'Ja\'Marr', last: 'Chase', pos: 'WR', team: 'CIN' },
      { pick: '1.02', first: 'Bijan', last: 'Robinson', pos: 'RB', team: 'ATL' },
      { pick: '1.03', first: 'Jahmyr', last: 'Gibbs', pos: 'RB', team: 'DET' },
      { pick: '1.04', first: 'CeeDee', last: 'Lamb', pos: 'WR', team: 'DAL' },
    ],
    // Round 2 - reversed
    [
      { pick: '2.04', first: 'Josh', last: 'Allen', pos: 'QB', team: 'BUF' },
      { pick: '2.03', first: 'Malik', last: 'Nabers', pos: 'WR', team: 'NYG' },
      { pick: '2.02', first: 'Sam', last: 'LaPorta', pos: 'TE', team: 'DET' },
      { pick: '2.01', first: 'Breece', last: 'Hall', pos: 'RB', team: 'NYJ' },
    ],
  ];

  return (
    <div className={styles.snakeIllustration}>
      <div className={styles.snakeBoardContainer}>
        {/* Team Headers */}
        <div className={styles.snakeTeamHeaders}>
          {teams.map((team, i) => (
            <div
              key={i}
              className={cn(
                styles.snakeTeamCell,
                team.isUser ? styles.snakeTeamUserBorder : styles.snakeTeamOtherBorder
              )}
            >
              {/* Name header */}
              <div className={cn(
                styles.snakeTeamName,
                team.isUser ? styles.snakeTeamUserName : styles.snakeTeamOtherName
              )}>
                <span className={styles.snakeTeamNameText}>
                  {team.name}
                </span>
              </div>
              {/* Position tracker */}
              <div className={styles.snakePositionTracker}>
                <div className={styles.snakePositionBar}>
                  {team.tracker.map((pos, j) => (
                    <div key={j} className={styles.snakePositionSegment} data-position={pos} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pick Rows */}
        {picks.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.snakePickRow}>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={styles.snakePickCell}
                data-position={cell.pos.toLowerCase()}
              >
                {/* Pick number */}
                <span className={styles.snakePickNumber}>
                  {cell.pick}
                </span>
                {/* Player name */}
                <div className={styles.snakePlayerName}>
                  <span className={styles.snakePlayerFirst}>{cell.first}</span>
                  <span className={styles.snakePlayerLast}>{cell.last}</span>
                </div>
                {/* Position-Team */}
                <div className={styles.snakePlayerTeam}>
                  {cell.pos}-{cell.team}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Snake direction indicators */}
        <div className={styles.snakeDirectionIndicators}>
          <div className={styles.snakeRoundIndicator}>
            <span className={styles.snakeRoundLabel}>R1</span>
            <span className={styles.snakeArrow}>→</span>
          </div>
          <div className={styles.snakeRoundIndicator}>
            <span className={styles.snakeArrow}>←</span>
            <span className={styles.snakeRoundLabel}>R2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueIllustration(): React.ReactElement {
  const players = [
    { name: 'Ja\'Marr Chase', pos: 'WR', team: 'CIN' },
    { name: 'Bijan Robinson', pos: 'RB', team: 'ATL' },
    { name: 'Sam LaPorta', pos: 'TE', team: 'DET' },
  ];

  return (
    <div className={styles.queueIllustration}>
      <div className={styles.queueContainer}>
        {/* Header */}
        <div className={styles.queueHeader}>
          <span className={styles.queueTitle}>MY QUEUE</span>
          <span className={styles.queueCount}>3 players</span>
        </div>

        {/* Queue items */}
        {players.map((player, i) => (
          <div
            key={i}
            className={cn(styles.queueItem, i === players.length - 1 && styles.queueItemLast)}
          >
            {/* Drag handle */}
            <div className={styles.dragHandle}>
              <div className={styles.dragHandleBar} />
              <div className={styles.dragHandleBar} />
            </div>

            {/* Position badge */}
            <div className={styles.positionBadge} data-position={player.pos.toLowerCase()}>
              {player.pos}
            </div>

            {/* Player info */}
            <div className={styles.queuePlayerInfo}>
              <div className={styles.queuePlayerName}>{player.name}</div>
              <div className={styles.queuePlayerTeam}>{player.team}</div>
            </div>

            {/* Remove button */}
            <div className={styles.removeButton}>
              ×
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BestBallIllustration(): React.ReactElement {
  const starters = [
    { pos: 'QB', pts: 28.4 },
    { pos: 'RB', pts: 22.1 },
    { pos: 'WR', pts: 31.2 },
    { pos: 'TE', pts: 18.6 },
  ];

  return (
    <div className={styles.bestBallIllustration}>
      <div className={styles.bestBallContainer}>
        {/* Week label */}
        <div className={styles.bestBallWeekLabel}>
          <span className={styles.weekLabelText}>WEEK 1 LINEUP</span>
          <span className={styles.autoSetBadge}>✓ Auto-set</span>
        </div>

        {/* Starters grid */}
        <div className={styles.startersGrid}>
          {starters.map((s, i) => (
            <div
              key={i}
              className={styles.starterCard}
              data-position={s.pos.toLowerCase()}
            >
              <div className={styles.starterPosition}>
                {s.pos}
              </div>
              <div className={styles.starterPoints}>
                {s.pts}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className={styles.bestBallTotal}>
          <span className={styles.totalLabel}>Week Total</span>
          <span className={styles.totalScore}>100.3 pts</span>
        </div>
      </div>

      {/* No work badge */}
      <div className={styles.noBadgeContainer}>
        <div className={styles.noBadge}>
          <span className={styles.noBadgeText}>No lineup changes needed!</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TUTORIAL PAGES DATA
// ============================================================================

const TUTORIAL_PAGES: TutorialPage[] = [
  {
    illustration: <DraftCardsIllustration />,
    title: 'Pick Your Players',
    description: 'When the timer shows, it\&apos;s your turn. Tap any available player to add them to your roster.',
    tips: [
      'Filter by position using the tabs at top',
      'Blue border = your cards',
      'Timer auto-picks if you run out of time',
    ],
  },
  {
    illustration: <SnakeOrderIllustration />,
    title: 'Snake Draft Format',
    description: 'Pick order flips each round so everyone gets fair value.',
    tips: [
      'Pick 1st in Round 1? You pick last in Round 2',
      'Your highlighted picks show when you\'re up',
      'Use the Board tab to plan ahead',
    ],
  },
  {
    illustration: <QueueIllustration />,
    title: 'Queue Up Players',
    description: 'Add players to your queue before your turn. Drag to set priority.',
    tips: [
      'Tap + on any player to add to queue',
      'First available queued player auto-drafts',
      'Queue saves if you disconnect',
    ],
  },
  {
    illustration: <BestBallIllustration />,
    title: 'Set It & Forget It',
    description: 'Best Ball means your best players automatically start each week. Zero maintenance.',
    tips: [
      'Top scorers slide into your lineup',
      'No trades, adds, or drops',
      'Just draft smart and enjoy the season',
    ],
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PageIndicator({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}): React.ReactElement {
  return (
    <div className={styles.pageIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to step ${i + 1}`}
          className={cn(
            styles.progressDot,
            i === current ? styles.progressDotActive : styles.progressDotInactive
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftTutorialModal({
  isOpen,
  onClose,
  onRules,
  format = 'Snake',
  showDontShowAgain = false,
  onDontShowAgainChange,
}: DraftTutorialModalProps): React.ReactElement | null {
  const [currentPage, setCurrentPage] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const isLastPage = currentPage === TUTORIAL_PAGES.length - 1;
  
  const handleDontShowAgainChange = useCallback((checked: boolean) => {
    setDontShowAgain(checked);
    onDontShowAgainChange?.(checked);
  }, [onDontShowAgainChange]);
  
  const handleNext = useCallback(() => {
    if (isLastPage) {
      onClose();
    } else {
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLastPage, onClose]);
  
  // Reset to first page when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const page = TUTORIAL_PAGES[currentPage]!;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className={styles.modalDialog}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerSpacer} />
        <h1 id="tutorial-modal-title" className={styles.headerTitle}>
          {currentPage + 1} of {TUTORIAL_PAGES.length}
        </h1>
        <button onClick={onClose} className={styles.skipButton}>
          Skip
        </button>
      </div>

      {/* Content */}
      <div className={styles.contentArea}>
        {/* Title */}
        <h2 className={styles.contentTitle}>
          {page.title}
        </h2>

        {/* Description */}
        <p className={styles.description}>
          {page.description}
        </p>

        {/* Illustration */}
        <div className={styles.illustrationContainer}>
          {page.illustration}
        </div>

        {/* Tips */}
        <div className={styles.tipsSection}>
          {page.tips.map((tip, i) => (
            <div
              key={i}
              className={cn(
                styles.tipItem,
                i === 0 && styles.tipItemHighlight
              )}
            >
              <div
                className={cn(
                  styles.tipNumber,
                  i === 0 ? styles.tipNumberHighlight : styles.tipNumberNormal
                )}
              >
                {i + 1}
              </div>
              <p
                className={cn(
                  styles.tipText,
                  i === 0 ? styles.tipTextHighlight : styles.tipTextNormal
                )}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Page Indicator */}
        <div className={styles.pageIndicatorContainer}>
          <PageIndicator
            total={TUTORIAL_PAGES.length}
            current={currentPage}
            onSelect={setCurrentPage}
          />
        </div>

        {/* Don't show again checkbox - only on last page when enabled */}
        {showDontShowAgain && isLastPage && (
          <label className={styles.dontShowAgainLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleDontShowAgainChange(e.target.checked)}
              className={styles.dontShowAgainCheckbox}
            />
            <span className={styles.dontShowAgainText}>
              Don&apos;t show this tutorial again
            </span>
          </label>
        )}

        {/* Next Button */}
        <button
          onClick={handleNext}
          className={cn(
            styles.nextButton,
            isLastPage ? styles.nextButtonFinish : styles.nextButtonContinue
          )}
        >
          {isLastPage ? 'Let\'s Draft!' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
