#!/usr/bin/env node

// Simple debug script to see the Falcons data structure

interface FalconsRawData {
  [key: string]: unknown;
}

async function debugFalconsData(): Promise<void> {
  const falconsData: string = `falcons :
QB Michael Penix Jr. 17 545 347 3960 23 13 36 47 187 3 0 0 0 0 250 26 DI David Onyemata 540 42 2.1 0.0 48 1 TB H 22.8 26.7 36%
QB Kirk Cousins 17 6 4 43 0 0 0 0 0 0 0 0 0 0 2 48 DI Morgan Fox 519 29 3.0 0.0 73 2 MIN V 19.8 24.9 32%
QB Total 34 550 351 4003 23 13 36 48 188 3 0 0 0 0 253 74 DI Ta'Quon Graham 454 32 1.4 0.0 89 3 CAR V 24.2 22.8 55%
RB Bijan Robinson 17 0 0 0 0 0 0 303 1422 12 79 62 490 2 336 1 DI Zach Harrison 378 32 1.5 0.0 86 4 WAS H 24.7 27.8 39%
RB Tyler Allgeier 17 0 0 0 0 0 0 121 551 4 13 11 75 0 98 48 DI Ruke Orhorhoro 303 22 1.3 0.0 110 5 0.0 0.0
RB Jashaun Corbin 17 0 0 0 0 0 0 9 40 0 3 2 14 0 10 101 DI Kentavius Street 227 15 0.9 0.0 126 6 BUF H 22.8 29.5 27%
RB Total 51 0 0 0 0 0 0 433 2013 16 95 75 579 3 443 150 DI Total 2420 173 10.2 0.1 532 7 SF V 23.6 25.8 42%
WR Drake London 17 0 0 0 0 0 0 0 0 0 154 97 1203 8 267 10 ED Jalon Walker 562 38 5.5 0.2 48 8 MIA H 24.1 24.7 48%
WR Darnell Mooney 16 0 0 0 0 0 0 0 0 0 95 58 789 4 161 55 ED James Pearce Jr. 540 37 5.3 0.1 54 9 NE V 20.4 23.5 39%
WR Ray-Ray McCloud 17 0 0 0 0 0 0 9 66 0 65 45 465 2 111 71 ED Arnold Ebiketie 529 36 5.1 0.2 64 10 IND V 21.6 23.1 45%
WR KhaDarel Hodge 17 0 0 0 0 0 0 0 0 0 18 11 148 1 30 121 ED Leonard Floyd 443 30 4.8 0.0 79 11 CAR H 25.3 21.7 63%
WR Jamal Agnew 17 0 0 0 0 0 0 0 0 0 6 4 44 0 12 142 ED Bralen Trice 162 11 1.5 0.0 126 12 NO V 23.6 20.4 61%
WR Total 84 0 0 0 0 0 0 9 66 0 338 215 2649 15 582 399 ED DeAngelo Malone 32 2 0.3 0.0 163 13 NYJ V 21.1 22.0 47%
TE Kyle Pitts 17 0 0 0 0 0 0 0 0 0 80 50 668 4 143 19 ED Total 2269 155 22.6 0.6 534 14 SEA H 21.6 22.1 48%
TE Charlie Woerner 17 0 0 0 0 0 0 0 0 0 14 9 88 1 21 59 LB Kaden Elliss 1026 145 4.4 0.7 7 15 TB V 21.7 27.9 29%
TE Feleipe Franks 17 0 0 0 0 0 0 0 0 0 3 2 18 0 4 93`;

  console.log('=== DEBUGGING FALCONS DATA ===\n');

  const lines: string[] = falconsData.trim().split('\n');
  let currentPosition: string = '';

  lines.forEach((line: string, index: number) => {
    console.log(`Line ${index + 1}: "${line}"`);

    if (!line.trim() || line.includes('falcons :')) {
      console.log('  -> Skipping header/empty line\n');
      return;
    }

    const parts: string[] = line.trim().split(/\s+/);
    console.log(`  Parts: [${parts.join(', ')}]`);

    const firstPart: string = parts[0];

    // Check if this is a position header
    if (['QB', 'RB', 'WR', 'TE', 'DI', 'ED', 'LB', 'CB', 'S'].includes(firstPart)) {
      currentPosition = firstPart;
      console.log(`  -> Position header: ${currentPosition}\n`);
      return;
    }

    // Skip "Total" rows
    if (firstPart.toLowerCase().includes('total') || line.toLowerCase().includes('total')) {
      console.log('  -> Skipping total row\n');
      return;
    }

    // Skip defensive players
    if (['DI', 'ED', 'LB', 'CB', 'S'].includes(currentPosition)) {
      console.log('  -> Skipping defensive player\n');
      return;
    }

    // Only process offensive positions
    const offensivePositions: string[] = ['QB', 'RB', 'WR', 'TE'];
    if (!offensivePositions.includes(currentPosition)) {
      console.log('  -> Not an offensive position\n');
      return;
    }

    console.log(`  -> Processing ${currentPosition} player\n`);

    // Try to parse player name
    let playerName: string = '';
    let dataStartIndex: number = 0;

    if (parts[1] && isNaN(parseInt(parts[1]))) {
      if (parts[2] && isNaN(parseInt(parts[2]))) {
        playerName = `${parts[0]} ${parts[1]} ${parts[2]}`;
        dataStartIndex = 3;
      } else {
        playerName = `${parts[0]} ${parts[1]}`;
        dataStartIndex = 2;
      }
    } else {
      playerName = parts[0];
      dataStartIndex = 1;
    }

    console.log(`  Player name: "${playerName}"`);
    console.log(`  Data starts at index: ${dataStartIndex}`);
    console.log(`  Total parts: ${parts.length}`);
    console.log(`  Need at least: ${dataStartIndex + 16} parts`);

    if (parts.length < dataStartIndex + 16) {
      console.log('  -> Insufficient data columns\n');
      return;
    }

    console.log('  -> Would process this player\n\n');
  });
}

// Run debug
if (require.main === module) {
  debugFalconsData().catch(console.error);
}

export { debugFalconsData };
