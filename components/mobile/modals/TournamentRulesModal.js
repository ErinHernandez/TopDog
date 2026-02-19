/* eslint-disable react/no-unescaped-entities */
/**
 * TournamentRulesModal - Full-screen Tournament Rules Modal
 * 
 * Extracted from TournamentModalMobile for maintainability.
 * Displays comprehensive tournament rules in a scrollable full-screen modal.
 */

import React from 'react';

export default function TournamentRulesModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-[#101927]">
      {/* Full Screen Container */}
      <div className="h-full w-full flex flex-col bg-[#101927] relative">
        
        {/* Close Button - Top Right Fixed */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rules and return"
          className="absolute right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/5 active:scale-95 transition-transform z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 44px) + 48px)' }}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M6 6L18 18M18 6L6 18" 
              stroke="#94A3B8" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        
        {/* Safe Area Spacer */}
        <div style={{ height: 'calc(env(safe-area-inset-top, 44px) + 48px)' }} className="flex-shrink-0" />
        
        {/* Scrollable Rules Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 mobile-no-scrollbar">
            <div className="space-y-6 pb-8 pt-[28px]">
              
              {/* Tournament Title */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">THE TOPDOG INTERNATIONAL TOURNAMENT RULES</h2>
                <p className="text-sm text-gray-300">TopDog.dog contests are governed by our Terms of Use, Privacy Policy, and the rules listed below.</p>
              </div>

              {/* Overview */}
              <RuleSection>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Entrants in TopDog.dog contests compete to accumulate points based on athletes' statistical performance in sporting events. Contest results are determined by the total points accumulated by each individual lineup entry according to the relevant scoring rules.
                </p>
              </RuleSection>

              {/* General Contest Information */}
              <RuleSection title="General Contest Information">
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <span>Entrants select players through a snake draft. In a snake draft, the pick order is reversed each round. In other words, the entrant with the first pick in round 1, will have the last pick in round 2 and the first pick in round 3.</span>
                  </div>
                  <div>
                    <span>Entrants are required to pay an entry fee of $25 per entry to enter TopDog International (the "Tournament").</span>
                  </div>
                  <div>
                    <span>Entry to the Tournament will be closed prior to the 1st game of the 2025 season. This means that the Tournament closure time would move if the timing of the first game were to change for any reason.</span>
                  </div>
                  <div>
                    <span>Entrants draft a team of players who accumulate points throughout the duration of the contest period.</span>
                  </div>
                  <div>
                    <span>Once entrants draft, their rosters are set-there are no waivers, substitutions, or trades during the contest period.</span>
                  </div>
                  <div>
                    <span>At the end of each NFL week, TopDog.dog automatically selects the entrant&apos;s highest scoring players at the designated positions to be "starters" and only those players' statistics over that week are counted toward the entrant&apos;s accumulated score. This means entrants do not need to set their lineups.</span>
                  </div>
                  <div>
                    <span>Entrants compete in groups ("Groups") over the course of multiple rounds ("Rounds").</span>
                  </div>
                </div>
              </RuleSection>

              {/* Tournament Structure */}
              <RuleSection title="Tournament Structure">
                <div className="space-y-3 text-sm text-gray-300">
                  <p className="font-medium">The Tournament will have 4 rounds, with each round consisting of player groups as seen below:</p>
                  <div><span>Round 1 - 12 person groups</span></div>
                  <div><span>Round 2 - 13 person groups</span></div>
                  <div><span>Round 3 - 16 person groups</span></div>
                  <div><span>Round 4 - 539 person final group</span></div>
                  <p className="mt-3">The Tournament will consist of 672,672 total entries and in the first round, a total of 56,056 12-person Groups.</p>
                </div>
              </RuleSection>

              {/* Advancement Rules */}
              <RuleSection title="Advancement Rules">
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <span>At the end of Round 1, the top two (2) performing entries in each Group will advance to Round 2. and be awarded a prize (as described below). Round 2 will consist of 112,112 entries in 8,624 13-person Groups.</span>
                  </div>
                  <div>
                    <span>At the end of Round 2, the top one (1) performing entry from each Group will advance to Round 3 and be awarded a prize (as described below). Round 3 will consist of 8,624 entries in 539 16-person Groups.</span>
                  </div>
                  <div>
                    <span>At the end of Round 3, the top one (1) performing entry from each Group will advance to Round 4 and be awarded a prize (as described below). Round 4 will consist of 539 entries in a single 539-person Group.</span>
                  </div>
                  <div>
                    <span>At the end of Round 4, the top one (1) performing entry from the Group will be the Grand Prize winner and prizes will be awarded to all entries in Round 4 (as described below).</span>
                  </div>
                </div>
              </RuleSection>

              {/* Rounds */}
              <RuleSection title="Rounds">
                <div className="space-y-3 text-sm text-gray-300">
                  <div><span>Round 1 - NFL Weeks 1 - 14</span></div>
                  <div><span>Round 2 - NFL Week 15</span></div>
                  <div><span>Round 3 - NFL Week 16</span></div>
                  <div><span>Round 4 - NFL Week 17</span></div>
                  <p className="mt-3">In the event of season postponement, any missed weeks will lead to a shortening of Round 1.</p>
                </div>
              </RuleSection>

              {/* Roster makeup */}
              <RuleSection title="Roster makeup">
                <p className="text-sm text-gray-300 mb-3">The roster makeup and scoring will follow the details below.</p>
                <div className="text-sm text-gray-300">
                  <h4 className="font-medium text-white mb-2">Roster</h4>
                  <div className="space-y-1">
                    <div>QB 1</div>
                    <div>RB 2</div>
                    <div>WR 3</div>
                    <div>TE 1</div>
                    <div>FLEX 2</div>
                    <div>Bench 9</div>
                  </div>
                </div>
              </RuleSection>

              {/* Prize pool */}
              <RuleSection title="Prize pool">
                <p className="text-sm text-gray-300 mb-3">Note that at TopDog.dog&apos;s discretion, TopDog.dog could pay out partial prizes upon advancement that eventually will equal the total prizes per user as seen below.</p>
                
                <h4 className="font-medium text-white mb-2">Tournament prize breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>1st:</span><span>$2,000,000</span></div>
                    <div className="flex justify-between"><span>2nd:</span><span>$1,000,000</span></div>
                    <div className="flex justify-between"><span>3rd:</span><span>$504,370</span></div>
                    <div className="flex justify-between"><span>4th:</span><span>$400,000</span></div>
                    <div className="flex justify-between"><span>5th:</span><span>$300,000</span></div>
                    <div className="flex justify-between"><span>6th:</span><span>$250,000</span></div>
                    <div className="flex justify-between"><span>7th:</span><span>$200,000</span></div>
                    <div className="flex justify-between"><span>8th:</span><span>$175,000</span></div>
                    <div className="flex justify-between"><span>9th:</span><span>$150,000</span></div>
                    <div className="flex justify-between"><span>10th:</span><span>$125,000</span></div>
                    <div className="flex justify-between"><span>11-15th:</span><span>$100,000</span></div>
                    <div className="flex justify-between"><span>16-20th:</span><span>$70,000</span></div>
                    <div className="flex justify-between"><span>21-30th:</span><span>$50,000</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>31-40th:</span><span>$30,000</span></div>
                    <div className="flex justify-between"><span>41-50th:</span><span>$15,000</span></div>
                    <div className="flex justify-between"><span>51-100th:</span><span>$10,000</span></div>
                    <div className="flex justify-between"><span>101-200th:</span><span>$7,000</span></div>
                    <div className="flex justify-between"><span>201-300th:</span><span>$5,000</span></div>
                    <div className="flex justify-between"><span>301-539th:</span><span>$3,750</span></div>
                    <div className="flex justify-between"><span>540-1078th:</span><span>$1,000</span></div>
                    <div className="flex justify-between"><span>1079-1617th:</span><span>$500</span></div>
                    <div className="flex justify-between"><span>1618-2156th:</span><span>$250</span></div>
                    <div className="flex justify-between"><span>2157-2695th:</span><span>$100</span></div>
                    <div className="flex justify-between"><span>2696-8624th:</span><span>$70</span></div>
                    <div className="flex justify-between"><span>8625-112112th:</span><span>$25</span></div>
                  </div>
                </div>
              </RuleSection>

              {/* Maximum entries */}
              <RuleSection title="Maximum entries">
                <p className="text-sm text-gray-300">TopDog.dog limits the maximum number of entries that a single entrant may enter into a single contest. This Tournament will have a maximum of 150 entry per entrant.</p>
              </RuleSection>

              {/* Scoring */}
              <RuleSection title="Scoring">
                <div className="space-y-3 text-sm text-gray-300">
                  <p>TopDog.dog uses official league statistics provided by reputable partners and only includes statistics from sporting events the relevant league deems to be official.</p>
                  <p>We endeavor to promptly settle contests and distribute prizes, but it is also important to us to make sure we do so accurately. On a weekly basis, final scores will be confirmed within 72 hours after the final game of the week is played.</p>
                  <p>Following each specified contest round, entries will be advanced within 72 hours after the final game for that NFL Week is played. Once entries are advanced, scores will be considered final and no changes will be made.</p>
                  <p>Normally, any scoring changes or stat corrections provided by our partners after a contest has ended and TopDog.dog has settled the contest will not impact the already-settled contest. However, TopDog.dog reserves the right, in its sole discretion, to revise scores after they are released in the unlikely event of potential scoring error by a provider or TopDog.dog.</p>
                  <p>If a league declares a game "postponed" or "suspended", then the statistics generated in the sporting event before that point will count toward the contest. Any statistics generated when the sporting event takes place or resumes will count only if it occurs before the relevant contest period or Round closes.</p>
                </div>
              </RuleSection>

              {/* Ties */}
              <RuleSection title="Ties">
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <h4 className="font-medium text-white mb-1">Tournament Advancement:</h4>
                    <p>Ties that take place in Advancement Rounds will be broken by whichever team has the highest scoring player in that round. If entrants have the same highest scoring player or a player with equivalent high scores, then it would go to the second highest scoring player, then the third, and so forth, until one entrant has a higher scoring player than the other entrant. If they are still tied after that, the entrant that entered the contest first will advance.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Tournament Finals:</h4>
                    <p>As it relates to Tournament Finals and Prizes, any entrants that tie will evenly split the combined prize allocation for the finishing spots they occupy. For example, if two entrants tie for first place, those two entrants would evenly split the combined prize for first and second.</p>
                  </div>
                </div>
              </RuleSection>

              {/* Round advancements */}
              <RuleSection title="Round advancements">
                <div className="space-y-3 text-sm text-gray-300">
                  <p>If there are not enough entries to fill the Tournament, some entries may advance to the next Round of the Tournament, even if they do not place high enough in their Group to qualify for automatic advancement, these are called "wild cards".</p>
                  <p>The wild cards will be provided to the highest scoring entries from the Round who did not automatically advance. For wild card advancements, place in the Group is irrelevant, highest scoring lineups will advance.</p>
                </div>
              </RuleSection>

              {/* Multiple entries */}
              <RuleSection title="Multiple entries">
                <p className="text-sm text-gray-300">If an entrant enters more than one entry in the Tournament, each entry will be placed in a different Group for Round 1. Similarly, a single entrant&apos;s entries will not be in the same Group if the number of groups is greater than the entrant&apos;s remaining number of entries.</p>
              </RuleSection>

              {/* Slow drafts */}
              <RuleSection title="Slow drafts">
                <p className="text-sm text-gray-300 mb-3">For drafts operating at an 12 hour pick clock, the schedule for picks being sped up will be as follows:</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>2 weeks ahead of the draft cutoff time, the pick clock will be reduced to 4 hours per pick.</p>
                  <p>1 week ahead of the draft cutoff time, the pick clock will be reduced to 1 hour per pick.</p>
                  <p>On the day of cutoff, the pick clock will be reduced to 10 minutes per pick.</p>
                  <p>2 hours ahead of cutoff, the pick clock will be reduced to 60 seconds per pick.</p>
                </div>
              </RuleSection>

              {/* Eligibility */}
              <RuleSection title="Eligibility">
                <p className="text-sm text-gray-300">Please review the other eligibility requirements in our Terms of Use.</p>
              </RuleSection>

              {/* Multiple accounts and collusion */}
              <RuleSection title="Multiple accounts and collusion">
                <p className="text-sm text-gray-300">Each user on TopDog.dog is permitted to maintain one account. "Multi-accounting" or colluding with any other entrant is expressly prohibited. If you have opened, maintained, used, colluded with, or controlled more than one account, as determined in TopDog.dog&apos;s sole discretion, we may terminate or suspend any or all of your accounts and may revoke or withhold any prizes that you have won.</p>
              </RuleSection>

              {/* Suspended accounts */}
              <RuleSection title="Suspended accounts">
                <p className="text-sm text-gray-300">If you undertake any actions that are detrimental to TopDog.dog or other users on TopDog.dog&apos;s service, we may suspend some or all functions associated with your account. If you want to communicate with us regarding restoration of your account, please email support@topdog.dog.</p>
              </RuleSection>

              {/* Cancelling entries */}
              <RuleSection title="Cancelling entries">
                <p className="text-sm text-gray-300">TopDog.dog permits entrants to cancel entries as long as the draft that you are attempting to enter has not yet been filled.</p>
              </RuleSection>

              {/* Lineup restrictions */}
              <RuleSection title="Lineup restrictions">
                <p className="text-sm text-gray-300">Player positions are determined at the sole discretion of TopDog.dog. Lineups must include players from at least two different teams.</p>
              </RuleSection>

              {/* Lineup edits */}
              <RuleSection title="Lineup edits">
                <p className="text-sm text-gray-300">Entrants may not edit Tournament rosters after they are drafted.</p>
              </RuleSection>

              {/* Traded and retired players */}
              <RuleSection title="Traded and retired players">
                <p className="text-sm text-gray-300">When players are traded in real life or retire, entrants will accumulate points based on the player&apos;s performance on the new team. Entrants are not permitted to swap players, even if a player in their lineup is no longer eligible to earn points.</p>
              </RuleSection>

              {/* Contest cancellation */}
              <RuleSection title="Contest cancellation">
                <p className="text-sm text-gray-300">TopDog.dog reserves the right to cancel contests at our sole discretion, without any restrictions. Typically, we would only do so in cases where we believe that due to problems with our services or occurring in events impacting the sporting events, there would be questions regarding the contest&apos;s integrity.</p>
              </RuleSection>

            </div>
          </div>
        </div>
      </div>
  );
}

/**
 * RuleSection - Reusable section wrapper for rules content
 */
function RuleSection({ title, children }) {
  return (
    <div className="bg-gray-800/40 rounded-lg p-4">
      {title && <h3 className="text-lg font-medium text-white mb-3">{title}</h3>}
      {children}
    </div>
  );
}

