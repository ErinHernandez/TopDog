import React from 'react';

export default function Rules() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center" style={{ color: '#c4b5fd', fontFamily: 'Anton SC, sans-serif' }}>the TopDog<br/>Tournament Rules</h1>
      <p className="mb-4 text-gray-300">TopDog contests are governed by our Terms of Use, Privacy Policy, and the rules listed below.</p>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>General Contest Information</h2>
        <ul className="list-disc ml-6 mb-2 text-gray-200">
          <li>Entrants select players through a snake draft. In a snake draft, the pick order is reversed each round.</li>
          <li>Entrants are required to pay an entry fee of $25 per entry to enter Best Ball Mania VI (the "Tournament").</li>
          <li>Entry to the Tournament will be closed prior to the 1st game of the 2025 season.</li>
          <li>Entrants draft a team of players who accumulate points throughout the duration of the contest period.</li>
          <li>Once entrants draft, their rosters are set—there are no waivers, substitutions, or trades during the contest period.</li>
          <li>At the end of each NFL week, TopDog automatically selects the entrant's highest scoring players at the designated positions to be "starters" and only those players' statistics over that week are counted toward the entrant's accumulated score.</li>
          <li>Entrants compete in groups ("Groups") over the course of multiple rounds ("Rounds").</li>
        </ul>
        <p className="mb-2 text-gray-200">The Tournament will have 4 rounds, with each round consisting of player groups as seen below:</p>
        <ul className="list-disc ml-6 mb-2 text-gray-200">
          <li>Round 1 - 12 person groups</li>
          <li>Round 2 - 13 person groups</li>
          <li>Round 3 - 16 person groups</li>
          <li>Round 4 - 539 person final group</li>
        </ul>
        <p className="mb-2 text-gray-200">The Tournament will consist of 672,672 total entries and in the first round, a total of 56,056 12-person Groups.</p>
        <p className="mb-2 text-gray-200">At the end of each round, top performing entries advance and are awarded prizes as described below.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Rounds</h2>
        <ul className="list-disc ml-6 mb-2 text-gray-200">
          <li>Round 1 - NFL Weeks 1 - 14</li>
          <li>Round 2 - NFL Week 15</li>
          <li>Round 3 - NFL Week 16</li>
          <li>Round 4 - NFL Week 17</li>
        </ul>
        <p className="mb-2 text-gray-200">In the event of season postponement, any missed weeks will lead to a shortening of Round 1.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Roster Makeup</h2>
        <ul className="list-disc ml-6 mb-2 text-gray-200">
          <li>QB: 1</li>
          <li>RB: 2</li>
          <li>WR: 3</li>
          <li>FLEX: 2</li>
          <li>BENCH: 10</li>
          <li>TE: 1</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Prize Pool</h2>
        <p className="mb-2 text-gray-200">Prizes are awarded as described in the tournament prize breakdown and round 1 prize breakdown.</p>
        <p className="mb-2 text-gray-200">TopDog may pay out partial prizes upon advancement that eventually will equal the total prizes per user as seen below.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Maximum Entries</h2>
        <p className="mb-2 text-gray-200">This Tournament will have a maximum of 150 entries per entrant.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Scoring</h2>
        <p className="mb-2 text-gray-200">Official league statistics are used. Final scores are confirmed within 72 hours after the final game of the week. Once entries are advanced, scores are considered final and no changes will be made except in rare cases of scoring error. TopDog uses official league statistics provided by reputable partners and only includes statistics from sporting events the relevant league deems to be official.</p>
        <ul className="list-disc ml-6 mb-2 text-gray-200">
          <li>Reception: 0.5</li>
          <li>Receiving TD: 6.0</li>
          <li>Receiving Yard: 0.1</li>
          <li>Rushing TD: 6.0</li>
          <li>Rushing Yard: 0.1</li>
          <li>Passing Yard: 0.04</li>
          <li>Passing TD: 4.0</li>
          <li>Interception: -1.0</li>
          <li>2-PT Conversion: 2.0</li>
          <li>Fumble Lost: -2.0</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Ties & Advancement</h2>
        <p className="mb-2 text-gray-200">Ties in advancement rounds are broken by highest scoring player, then second highest, and so on. If still tied, the entrant who entered first advances. Finals/prizes ties split the combined prize for the finishing spots.</p>
        <p className="mb-2 text-gray-200">Wild card advancements may occur if the tournament does not fill. Highest scoring lineups will advance as wild cards if needed.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Multiple Entries</h2>
        <p className="mb-2 text-gray-200">Each entry is placed in a different group for Round 1. If an entrant has more entries than groups, multiple entries may be in the same group.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Slow Drafts</h2>
        <p className="mb-2 text-gray-200">Pick clock is reduced as the draft cutoff approaches. Overnight pauses are in effect and change as the season approaches.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Guaranteed Contest</h2>
        <p className="mb-2 text-gray-200">This Tournament is guaranteed and will run (with prizes unchanged) even if it does not reach capacity before the contest start time. TopDog reserves the right to cancel contests at its sole discretion, typically only in cases of service or event integrity issues.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Eligibility & Accounts</h2>
        <p className="mb-2 text-gray-200">One account per user. Collusion and multi-accounting are prohibited. Suspended accounts may have prizes revoked. See Terms of Use for more details. If you undertake any actions that are detrimental to TopDog or other users on TopDog's service, we may suspend some or all functions associated with your account. If you want to communicate with us regarding restoration of your account, please email support@topdog.dog.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Lineup Restrictions & Edits</h2>
        <p className="mb-2 text-gray-200">Lineups must include players from at least two different teams. Entrants may not edit rosters after drafting. Traded/retired players remain on rosters and accumulate points as eligible.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2DE2C5' }}>Contest Cancellation</h2>
        <p className="mb-2 text-gray-200">TopDog reserves the right to cancel contests at its sole discretion, typically only in cases of service or event integrity issues.</p>
      </section>
    </div>
  );
} 