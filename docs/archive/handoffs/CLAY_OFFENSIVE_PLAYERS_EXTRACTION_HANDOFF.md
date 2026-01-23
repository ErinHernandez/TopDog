# Clay Projections - Offensive Players Extraction Handoff

**Project:** Extract Offensive Player Data from Clay Projections PDF
**Date:** January 22, 2025
**Status:** Ready for Implementation
**Target:** Cursor AI Agent
**Estimated Effort:** 4-6 hours

---

## EXECUTIVE SUMMARY

This document provides a complete implementation plan to extract only offensive player data (QB, RB, WR, TE) from the Mike Clay ESPN 2025 NFL Projections PDF, excluding all defensive players, kickers, punters, and special teams players.

### Current State

- **Source PDF:** `public/NFLDK2025_CS_ClayProjections2025.pdf` (4.7MB, dated Jan 22, 2025)
- **Existing Code:** Multiple parsing scripts exist in `scripts/` directory but they parse all positions
- **Existing Raw Data:** `clay_projections_2025_raw.txt` shows the data structure (fixed-width concatenated format)

### What Needs To Be Done

1. Extract text from PDF using `pdf-parse` library
2. Parse only offensive positions (QB, RB, WR, TE)
3. Filter out defensive players (DL, EDGE, LB, CB, S)
4. Filter out special teams (K, P, KR, PR)
5. Extract player stats and calculate fantasy points
6. Output clean JSON structure

---

## TABLE OF CONTENTS

1. [Data Structure Analysis](#data-structure-analysis)
2. [Implementation Strategy](#implementation-strategy)
3. [Code Implementation](#code-implementation)
4. [Output Format](#output-format)
5. [Testing Checklist](#testing-checklist)
6. [File Structure](#file-structure)
7. [Known Limitations](#known-limitations)

---

## DATA STRUCTURE ANALYSIS

### PDF Format

The Clay projections PDF contains team-by-team projections with the following structure:

- **Header Section:** Metadata and glossary (lines 1-26)
- **Column Header:** `PosPlayerGmAtt CompYds TD INT Sk Att Yds TDTgtRec Yd TD PtsRkPosPlayerSnapTklSackINT FF RkWkOppLocTm Opp Win Prob`
- **Team Sections:** 32 teams, each containing:
  - Offensive players (QB, RB, WR, TE)
  - Defensive players (DI, ED, LB, CB, S)
  - Special teams (K, P, KR, PR)
  - Team totals and rankings

### Line Format

Lines follow a fixed-width concatenated format with no delimiters:

```
QBKyler Murray17552374386522123690597500003068DIDalvin Tomlinson651372.60.0511...
```

**Structure:**
- Position (2 chars): `QB`, `RB`, `WR`, `TE`, `DI`, `ED`, `LB`, `CB`, `S`, `K`, `P`, `KR`, `PR`
- Player Name (variable length, no spaces in concatenated format)
- Games (2 digits): `17` or `16`
- Stats (all numbers concatenated, position-specific)
- Defensive data starts after offensive stats (marked by `DI`, `ED`, `LB`, etc.)

### NFL Team Abbreviations (Standard 3-Letter Codes)

```
AFC East:  BUF, MIA, NE, NYJ
AFC North: BAL, CIN, CLE, PIT
AFC South: HOU, IND, JAX, TEN
AFC West:  DEN, KC, LAC, LV
NFC East:  DAL, NYG, PHI, WAS
NFC North: CHI, DET, GB, MIN
NFC South: ATL, CAR, NO, TB
NFC West:  ARI, LAR, SEA, SF
```

> **Note:** The PDF may use non-standard codes (e.g., "ARZ" for Arizona, "BLT" for Baltimore, "HST" for Houston). The script should handle both standard and PDF-specific codes.

### Position-Specific Stat Formats

**QB Format:**
- Position (2) + Name + Games (2) + Passing: Att(4) + Comp(3) + Yds(4) + TD(2) + INT(2) + Sk(2) + Rushing: Att(3) + Yds(4) + TD(2) + Receiving: Tgt(3) + Rec(3) + Yd(4) + TD(2) + Fantasy Points(4) + Rank(2) + [Defensive data starts here]

**RB Format:**
- Position (2) + Name + Games (2) + Rushing: Att(4) + Yds(4) + TD(2) + Receiving: Tgt(3) + Rec(3) + Yd(4) + TD(2) + Fantasy Points(4) + Rank(2) + [Defensive data starts here]

**WR/TE Format:**
- Position (2) + Name + Games (2) + Receiving: Tgt(4) + Rec(3) + Yd(4) + TD(2) + Rushing: Att(3) + Yds(4) + TD(2) + Fantasy Points(4) + Rank(2) + [Defensive data starts here]

---

## IMPLEMENTATION STRATEGY

### Step 1: PDF Text Extraction

**File:** `scripts/extract_offensive_players_clay.js`

- Use `pdf-parse` library (already in codebase)
- Read PDF from `public/NFLDK2025_CS_ClayProjections2025.pdf`
- Extract all text content
- Save raw text to `clay_projections_2025_extracted.txt` for debugging

### Step 2: Line Filtering

Filter lines to extract only offensive players:

- **Include:** Lines starting with `QB`, `RB`, `WR`, `TE`
- **Exclude:**
  - Lines starting with `DI`, `ED`, `LB`, `CB` (defense)
  - Lines starting with `S` followed by a player name pattern (safety position)
  - Lines starting with `K`, `P` (kickers/punters - special teams)
  - Lines starting with `KR`, `PR` (returners - special teams)
  - Lines containing "Total" (team totals)
  - Header lines containing "PosPlayer"

### Step 3: Player Name Extraction

Player names are variable length and end before the games number:

- Find the position code (first 2 characters)
- Extract everything after position until we hit:
  - A 2-digit games number (`16` or `17`) followed by stat digits
  - The pattern: name ends where numbers begin

**Challenge:** Player names may contain periods (Jr., Sr., III), apostrophes (O'Brien), or hyphens (Smith-Schuster) but appear concatenated in the text.

### Step 4: Stat Extraction

Use fixed-width parsing based on position:

1. **Identify position** from first 2 characters
2. **Extract name** until games pattern
3. **Extract games** (2 digits after name)
4. **Extract stats** using known field widths for each position
5. **Stop parsing** when defensive position codes appear (`DI`, `ED`, `LB`, etc.)

### Step 5: Team Assignment

Team assignment strategy (in order of reliability):
1. Parse team code if present in the line
2. Track current team context from team header lines
3. Use player name lookup against known rosters as fallback

### Step 6: Fantasy Points Calculation

- **PPR:** Use the fantasy points value from the data
- **Half-PPR:** Calculate as `PPR - (receptions × 0.5)` for RB, WR, TE
- **Standard:** Calculate as `PPR - receptions` for RB, WR, TE
- **QB:** All scoring formats are the same (no reception bonus)

---

## CODE IMPLEMENTATION

### Main Extraction Script

**File:** `scripts/extract_offensive_players_clay.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Valid NFL team codes (standard + PDF variants)
const VALID_TEAMS = new Set([
  // Standard codes
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
  // PDF variants (map these to standard codes)
  'ARZ', 'BLT', 'HST', 'CLV'
]);

// Team code normalization map
const TEAM_CODE_MAP = {
  'ARZ': 'ARI',
  'BLT': 'BAL',
  'HST': 'HOU',
  'CLV': 'CLE'
};

const OFFENSIVE_POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const DEFENSIVE_POSITIONS = ['DI', 'ED', 'LB', 'CB'];
const SPECIAL_TEAMS_POSITIONS = ['K', 'P', 'KR', 'PR'];

async function extractOffensivePlayers() {
  console.log('📊 Extracting Offensive Players from Clay Projections PDF...\n');

  try {
    // Read PDF
    const pdfPath = path.join(__dirname, '../public/NFLDK2025_CS_ClayProjections2025.pdf');

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    console.log('📄 PDF loaded, extracting text...');

    // Parse PDF
    const data = await pdf(dataBuffer);
    const text = data.text;

    console.log(`📝 Extracted ${text.length.toLocaleString()} characters of text`);
    console.log(`📄 PDF has ${data.numpages} pages`);

    // Save raw text for debugging
    const rawTextPath = path.join(__dirname, '../clay_projections_2025_extracted.txt');
    fs.writeFileSync(rawTextPath, text, 'utf8');
    console.log('💾 Raw text saved to: clay_projections_2025_extracted.txt');

    // Parse offensive players only
    const players = parseOffensivePlayers(text);

    // Create output structure
    const output = {
      metadata: {
        source: 'NFLDK2025_CS_ClayProjections2025.pdf',
        extractedAt: new Date().toISOString(),
        totalPlayers: players.length,
        positions: {
          QB: players.filter(p => p.position === 'QB').length,
          RB: players.filter(p => p.position === 'RB').length,
          WR: players.filter(p => p.position === 'WR').length,
          TE: players.filter(p => p.position === 'TE').length
        }
      },
      players: players
    };

    // Validate output
    validateOutput(output);

    // Save output
    const outputPath = path.join(__dirname, '../clay_offensive_players_2025.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n✅ Extracted ${players.length} offensive players`);
    console.log(`📊 Position breakdown:`);
    console.log(`   QB: ${output.metadata.positions.QB}`);
    console.log(`   RB: ${output.metadata.positions.RB}`);
    console.log(`   WR: ${output.metadata.positions.WR}`);
    console.log(`   TE: ${output.metadata.positions.TE}`);
    console.log(`\n💾 Output saved to: clay_offensive_players_2025.json`);

    // Show sample
    console.log('\n📋 Sample Players:');
    players.slice(0, 5).forEach((player, idx) => {
      console.log(`\n${idx + 1}. ${player.name} (${player.position}, ${player.team})`);
      if (player.passing) {
        console.log(`   Passing: ${player.passing.attempts} att, ${player.passing.yards} yds, ${player.passing.tds} TD`);
      }
      if (player.rushing && player.rushing.attempts > 0) {
        console.log(`   Rushing: ${player.rushing.attempts} att, ${player.rushing.yards} yds, ${player.rushing.tds} TD`);
      }
      if (player.receiving && player.receiving.targets > 0) {
        console.log(`   Receiving: ${player.receiving.targets} tgts, ${player.receiving.receptions} rec, ${player.receiving.yards} yds, ${player.receiving.tds} TD`);
      }
      console.log(`   Fantasy: ${player.fantasy.ppr} PPR, ${player.fantasy.halfPpr} Half-PPR`);
    });

    return output;

  } catch (error) {
    console.error(`\n💥 Error extracting players: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseOffensivePlayers(text) {
  console.log('🔍 Parsing offensive players from text...');

  const lines = text.split('\n');
  const players = [];
  const seenPlayers = new Set(); // Track duplicates
  let currentTeam = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Skip header lines
    if (line.includes('PosPlayer') || line.includes('TEAM STAT') ||
        line.includes('OFFENSE') || line.includes('DEFENSE') ||
        (line.includes('2025') && line.includes('Projections'))) {
      continue;
    }

    // Try to detect team context from line
    const teamMatch = line.match(/^([A-Z]{2,3})\s+(?:OFFENSE|DEFENSE|TEAM)/i);
    if (teamMatch && VALID_TEAMS.has(teamMatch[1])) {
      currentTeam = normalizeTeamCode(teamMatch[1]);
      continue;
    }

    // Check if line starts with offensive position
    const position = line.substring(0, 2);
    if (!OFFENSIVE_POSITIONS.includes(position)) {
      continue; // Skip non-offensive positions
    }

    // Skip "Total" lines
    if (line.toLowerCase().includes('total')) {
      continue;
    }

    // Parse player line
    const player = parsePlayerLine(line, position, currentTeam);
    if (player && player.name && player.team) {
      // Check for duplicates
      const playerKey = `${player.name}-${player.position}-${player.team}`;
      if (!seenPlayers.has(playerKey)) {
        seenPlayers.add(playerKey);
        players.push(player);
      }
    }
  }

  console.log(`   Found ${players.length} offensive players`);
  return players;
}

function parsePlayerLine(line, position, contextTeam) {
  try {
    // Remove position prefix
    const data = line.substring(2);

    // Find where defensive data starts
    // Look for defensive position codes followed by a capital letter (start of name)
    const defensivePattern = /(?:DI|ED|LB|CB)[A-Z][a-z]/;
    const safetyPattern = /S[A-Z][a-z]/; // Safety position - be careful with this

    let defensiveStart = data.search(defensivePattern);
    if (defensiveStart === -1) {
      defensiveStart = data.search(safetyPattern);
    }

    const offensiveData = defensiveStart > 0 ? data.substring(0, defensiveStart) : data;

    // Find the games number pattern (16 or 17 followed by more digits)
    const gamesMatch = offensiveData.match(/^(.+?)(1[67])(\d{3,})/);
    if (!gamesMatch) {
      return null;
    }

    const nameRaw = gamesMatch[1];
    const games = parseInt(gamesMatch[2]);
    const statsString = gamesMatch[2] + gamesMatch[3]; // Include games in stats for alignment

    // Clean up name (add spaces before capital letters, handle special cases)
    let name = nameRaw
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters after lowercase
      .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Extract team code if present at end of name
    let team = contextTeam;
    const teamAtEnd = name.match(/\s([A-Z]{2,3})$/);
    if (teamAtEnd && VALID_TEAMS.has(teamAtEnd[1])) {
      team = normalizeTeamCode(teamAtEnd[1]);
      name = name.replace(/\s[A-Z]{2,3}$/, '').trim();
    }

    // Get stats after games number
    const stats = statsString.substring(2); // Remove the games digits

    const player = {
      name: name,
      position: position,
      team: team || 'UNK',
      games: games,
      fantasy: {}
    };

    // Parse stats based on position
    if (position === 'QB') {
      player.passing = parseQBStats(stats);
      player.rushing = parseQBRushingStats(stats);
      player.receiving = { targets: 0, receptions: 0, yards: 0, tds: 0 };
      const fantasyPts = extractFantasyPoints(stats, 38, 42);
      player.fantasy.ppr = fantasyPts;
      player.fantasy.halfPpr = fantasyPts;
      player.fantasy.standard = fantasyPts;
    } else if (position === 'RB') {
      const rbStats = parseRBStats(stats);
      player.rushing = rbStats.rushing;
      player.receiving = rbStats.receiving;
      const fantasyPts = extractFantasyPoints(stats, 22, 26);
      player.fantasy.ppr = fantasyPts;
      player.fantasy.halfPpr = Math.round((fantasyPts - (player.receiving.receptions * 0.5)) * 10) / 10;
      player.fantasy.standard = fantasyPts - player.receiving.receptions;
    } else if (position === 'WR' || position === 'TE') {
      const wrStats = parseWRTEStats(stats);
      player.receiving = wrStats.receiving;
      player.rushing = wrStats.rushing;
      const fantasyPts = extractFantasyPoints(stats, 22, 26);
      player.fantasy.ppr = fantasyPts;
      player.fantasy.halfPpr = Math.round((fantasyPts - (player.receiving.receptions * 0.5)) * 10) / 10;
      player.fantasy.standard = fantasyPts - player.receiving.receptions;
    }

    // Validate player has required data
    if (player.name && player.name.length > 1 && player.fantasy.ppr >= 0) {
      return player;
    }

  } catch (error) {
    // Skip lines that can't be parsed
    return null;
  }

  return null;
}

function parseQBStats(stats) {
  if (stats.length < 17) return { attempts: 0, completions: 0, yards: 0, tds: 0, ints: 0, sacks: 0 };

  return {
    attempts: parseInt(stats.substring(0, 4)) || 0,
    completions: parseInt(stats.substring(4, 7)) || 0,
    yards: parseInt(stats.substring(7, 11)) || 0,
    tds: parseInt(stats.substring(11, 13)) || 0,
    ints: parseInt(stats.substring(13, 15)) || 0,
    sacks: parseInt(stats.substring(15, 17)) || 0
  };
}

function parseQBRushingStats(stats) {
  if (stats.length < 26) return { attempts: 0, yards: 0, tds: 0 };

  return {
    attempts: parseInt(stats.substring(17, 20)) || 0,
    yards: parseInt(stats.substring(20, 24)) || 0,
    tds: parseInt(stats.substring(24, 26)) || 0
  };
}

function parseRBStats(stats) {
  if (stats.length < 22) {
    return {
      rushing: { attempts: 0, yards: 0, tds: 0 },
      receiving: { targets: 0, receptions: 0, yards: 0, tds: 0 }
    };
  }

  return {
    rushing: {
      attempts: parseInt(stats.substring(0, 4)) || 0,
      yards: parseInt(stats.substring(4, 8)) || 0,
      tds: parseInt(stats.substring(8, 10)) || 0
    },
    receiving: {
      targets: parseInt(stats.substring(10, 13)) || 0,
      receptions: parseInt(stats.substring(13, 16)) || 0,
      yards: parseInt(stats.substring(16, 20)) || 0,
      tds: parseInt(stats.substring(20, 22)) || 0
    }
  };
}

function parseWRTEStats(stats) {
  if (stats.length < 22) {
    return {
      receiving: { targets: 0, receptions: 0, yards: 0, tds: 0 },
      rushing: { attempts: 0, yards: 0, tds: 0 }
    };
  }

  return {
    receiving: {
      targets: parseInt(stats.substring(0, 4)) || 0,
      receptions: parseInt(stats.substring(4, 7)) || 0,
      yards: parseInt(stats.substring(7, 11)) || 0,
      tds: parseInt(stats.substring(11, 13)) || 0
    },
    rushing: {
      attempts: parseInt(stats.substring(13, 16)) || 0,
      yards: parseInt(stats.substring(16, 20)) || 0,
      tds: parseInt(stats.substring(20, 22)) || 0
    }
  };
}

function extractFantasyPoints(stats, start, end) {
  if (stats.length < end) return 0;
  const ptsStr = stats.substring(start, end).trim();
  return parseFloat(ptsStr) || 0;
}

function normalizeTeamCode(code) {
  return TEAM_CODE_MAP[code] || code;
}

function validateOutput(output) {
  console.log('\n🔎 Validating output...');

  const warnings = [];
  const errors = [];

  // Check player counts
  if (output.players.length < 100) {
    warnings.push(`Low player count: ${output.players.length} (expected 400-500)`);
  }

  // Check for unknown teams
  const unknownTeams = output.players.filter(p => p.team === 'UNK');
  if (unknownTeams.length > 0) {
    warnings.push(`${unknownTeams.length} players with unknown team`);
  }

  // Check for suspicious data
  output.players.forEach(player => {
    if (player.fantasy.ppr > 500) {
      warnings.push(`High fantasy points for ${player.name}: ${player.fantasy.ppr}`);
    }
    if (player.games < 1 || player.games > 17) {
      errors.push(`Invalid games for ${player.name}: ${player.games}`);
    }
  });

  // Report
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(e => console.log(`   - ${e}`));
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ Validation passed');
  }
}

// Run extraction
if (require.main === module) {
  extractOffensivePlayers().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { extractOffensivePlayers, parseOffensivePlayers };
```

---

## OUTPUT FORMAT

### JSON Structure

```json
{
  "metadata": {
    "source": "NFLDK2025_CS_ClayProjections2025.pdf",
    "extractedAt": "2025-01-22T12:00:00.000Z",
    "totalPlayers": 450,
    "positions": {
      "QB": 96,
      "RB": 120,
      "WR": 180,
      "TE": 54
    }
  },
  "players": [
    {
      "name": "Kyler Murray",
      "position": "QB",
      "team": "ARI",
      "games": 17,
      "passing": {
        "attempts": 552,
        "completions": 374,
        "yards": 3865,
        "tds": 22,
        "ints": 12,
        "sacks": 36
      },
      "rushing": {
        "attempts": 90,
        "yards": 597,
        "tds": 5
      },
      "receiving": {
        "targets": 0,
        "receptions": 0,
        "yards": 0,
        "tds": 0
      },
      "fantasy": {
        "ppr": 306.8,
        "halfPpr": 306.8,
        "standard": 306.8
      }
    }
  ]
}
```

---

## TESTING CHECKLIST

### Functional Tests

- [ ] Script successfully reads PDF file
- [ ] Script handles missing PDF file gracefully
- [ ] Text extraction completes without errors
- [ ] Only offensive positions (QB, RB, WR, TE) are included
- [ ] No defensive players (DI, ED, LB, CB, S) are included
- [ ] No kickers/punters (K, P) are included
- [ ] No special teams (KR, PR) are included
- [ ] Team totals are excluded
- [ ] Player names are correctly extracted and formatted
- [ ] Team abbreviations are normalized to standard codes
- [ ] Games played is 16 or 17
- [ ] Stats are correctly parsed for each position
- [ ] Fantasy points are calculated correctly
- [ ] Half-PPR calculation is correct (PPR - receptions × 0.5 for RB/WR/TE)
- [ ] No duplicate players in output

### Data Validation

- [ ] All players have required fields (name, position, team, games)
- [ ] QB players have passing stats
- [ ] RB/WR/TE players have receiving stats
- [ ] All players have rushing stats (may be 0)
- [ ] Fantasy points are non-negative numbers
- [ ] No duplicate players
- [ ] Expected player count (roughly 400-500 offensive players)

### Sample Verification

Manually verify these known players (update with actual 2025 data):

| Player | Position | Team | Key Stat to Verify |
|--------|----------|------|-------------------|
| Patrick Mahomes | QB | KC | Passing yards |
| Josh Allen | QB | BUF | Rushing TDs |
| Christian McCaffrey | RB | SF | Total touches |
| Ja'Marr Chase | WR | CIN | Receiving yards |
| Travis Kelce | TE | KC | Receptions |

---

## FILE STRUCTURE

### Files to Create

- **`scripts/extract_offensive_players_clay.js`** - Main extraction script

### Files Generated

- **`clay_projections_2025_extracted.txt`** - Raw extracted text (for debugging)
- **`clay_offensive_players_2025.json`** - Final parsed output

### Dependencies

- **`pdf-parse`** - Already in codebase (verify in `package.json`)
- **`fs`** - Node.js built-in
- **`path`** - Node.js built-in

---

## RUNNING THE SCRIPT

```bash
# From project root
node scripts/extract_offensive_players_clay.js
```

### Expected Output

```
📊 Extracting Offensive Players from Clay Projections PDF...

📄 PDF loaded, extracting text...
📝 Extracted ~192,000 characters of text
📄 PDF has 81 pages
💾 Raw text saved to: clay_projections_2025_extracted.txt
🔍 Parsing offensive players from text...
   Found ~450 offensive players

🔎 Validating output...
✅ Validation passed

✅ Extracted ~450 offensive players
📊 Position breakdown:
   QB: ~96
   RB: ~120
   WR: ~180
   TE: ~54

💾 Output saved to: clay_offensive_players_2025.json

📋 Sample Players:

1. Kyler Murray (QB, ARI)
   Passing: 552 att, 3865 yds, 22 TD
   Rushing: 90 att, 597 yds, 5 TD
   Fantasy: 306.8 PPR, 306.8 Half-PPR
...
```

---

## TROUBLESHOOTING

### Common Issues

**1. PDF file not found**
```
Error: PDF file not found: /path/to/file.pdf
```
- Verify the PDF exists at `public/NFLDK2025_CS_ClayProjections2025.pdf`
- Check file permissions

**2. Player names not parsing correctly**
- Check the raw text file (`clay_projections_2025_extracted.txt`) to see actual format
- Adjust name extraction regex/pattern matching
- May need to handle special characters (Jr., III, O'Brien, etc.)

**3. Stats not aligning correctly**
- Verify field widths match actual data in raw text
- PDF extraction may change spacing—check raw output
- May need to adjust fixed-width position indices

**4. Missing players**
- Check if filtering is too strict
- Verify position codes match PDF format
- Check for edge cases in name extraction
- Look for alternative line formats

**5. Defensive players included**
- Verify defensive position code detection regex
- Check that "S" (Safety) detection doesn't conflict with names starting with "S"
- Ensure all defensive position codes are in the filter list

**6. Duplicate players**
- Script includes deduplication by name-position-team key
- If duplicates appear, check for spelling variations

---

## KNOWN LIMITATIONS

1. **Fixed-width parsing fragility**: The field width assumptions may not hold for all players. Edge cases with very long/short names or unusual stat values may parse incorrectly.

2. **Team assignment**: Team context tracking is imperfect. Some players may end up with "UNK" team if the team header wasn't detected.

3. **Safety position conflict**: The "S" position code for safeties can conflict with player names starting with "S". The current implementation may miss some safeties (acceptable since we're filtering them anyway).

4. **PDF version dependency**: Different PDF export settings or versions may produce different text layouts. The script is tuned for the specific PDF dated Jan 22, 2025.

5. **Name formatting**: Complex names (hyphenated, apostrophes, suffixes) may not format perfectly.

6. **Fantasy point precision**: Points are extracted as-is from the PDF; rounding may differ from official sources.

---

## NEXT STEPS

After successful extraction:

1. **Review Output:** Manually spot-check 10-20 players against the PDF
2. **Fix Edge Cases:** Address any parsing issues found
3. **Integrate:** Merge data with existing player database
4. **Calculate Rankings:** Generate positional and overall rankings
5. **Update Player Pool:** Sync with bestball player pool system

---

## REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-22 | 1.0 | Initial handoff document |
| 2025-01-22 | 1.1 | Added validation, team normalization, deduplication, known limitations, standard scoring format, improved error handling |
