#!/usr/bin/env python3
"""
Parse Mike Clay ESPN projections from extracted text - Fixed version
"""
import re
import json
import csv
from pathlib import Path

def parse_player_line_fixed(line):
    """Parse a player line to extract name, position, and fantasy points (corrected)"""
    line = line.strip()
    if not line:
        return None
    
    # Match position at start of line
    pos_match = re.match(r'^(QB|RB|WR|TE)\s+(.+)', line)
    if not pos_match:
        return None
    
    position = pos_match.group(1)
    rest_of_line = pos_match.group(2)
    
    # Skip "Total" lines
    if 'Total' in rest_of_line:
        return None
    
    # Split the rest and try to extract player name and stats
    parts = rest_of_line.split()
    if len(parts) < 15:  # Need enough parts for stats
        return None
    
    # Player name is typically the first 1-4 parts before numbers start
    name_parts = []
    stats_start_idx = 0
    
    for i, part in enumerate(parts):
        # Look for where numbers start (games played, should be 16 or 17)
        if part.isdigit() and (part == '16' or part == '17'):
            stats_start_idx = i
            break
        name_parts.append(part)
    
    if not name_parts or stats_start_idx == 0:
        return None
    
    player_name = ' '.join(name_parts)
    stats = parts[stats_start_idx:]
    
    if len(stats) < 16:  # Need enough stats
        return None
    
    try:
        games = int(stats[0])
        
        # The structure appears to be:
        # QB: Gm Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD [FantasyPts] [Rank]
        # RB: Gm (QB stats all 0) Att Yds TD Tgt Rec Yd TD [FantasyPts] [Rank]
        # WR: Gm (QB stats all 0) (RB stats all 0) Tgt Rec Yd TD [FantasyPts] [Rank]
        # TE: same as WR
        
        # Find fantasy points - looking for a reasonable number before "DI" appears
        fantasy_points = None
        rank = None
        
        # Look backwards from the end to find fantasy points and rank
        # The pattern seems to be: ... FantasyPts Rank DI ...
        for i in range(len(stats) - 1, -1, -1):
            if stats[i] == 'DI':
                # Fantasy points should be 2 positions back, rank 1 position back
                if i >= 2:
                    try:
                        rank = int(stats[i-1])
                        fantasy_points = float(stats[i-2])
                        break
                    except ValueError:
                        continue
        
        if fantasy_points is None or fantasy_points <= 0:
            return None
        
        return {
            'name': player_name,
            'position': position,
            'games': games,
            'fantasy_points': fantasy_points,
            'rank': rank
        }
    except (ValueError, IndexError):
        return None

def parse_projections_fixed():
    """Parse all player projections from extracted text - Fixed version"""
    players = []
    
    try:
        with open('extracted_text.txt', 'r') as f:
            lines = f.readlines()
        
        for line_num, line in enumerate(lines):
            player = parse_player_line_fixed(line)
            if player:
                players.append(player)
                print(f"Line {line_num}: {player}")
        
    except FileNotFoundError:
        print("extracted_text.txt not found. Run extract_clay_projections.py first.")
        return []
    
    return players

def main():
    print("Parsing Mike Clay projections (Fixed version)...")
    players = parse_projections_fixed()
    
    print(f"\nFound {len(players)} players with projections")
    
    # Save as JSON
    with open('clay_projections_fixed.json', 'w') as f:
        json.dump(players, f, indent=2)
    
    # Save as CSV
    if players:
        with open('clay_projections_fixed.csv', 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'position', 'games', 'fantasy_points', 'rank'])
            writer.writeheader()
            writer.writerows(players)
    
    print("Saved projections to clay_projections_fixed.json and clay_projections_fixed.csv")
    
    # Show summary by position
    by_position = {}
    for player in players:
        pos = player['position']
        if pos not in by_position:
            by_position[pos] = []
        by_position[pos].append(player)
    
    print("\nTop players by fantasy points:")
    for pos in ['QB', 'RB', 'WR', 'TE']:
        if pos in by_position:
            players_at_pos = by_position[pos]
            players_at_pos.sort(key=lambda x: x['fantasy_points'], reverse=True)
            print(f"\n{pos} ({len(players_at_pos)} players):")
            for i, player in enumerate(players_at_pos[:10]):  # Top 10
                print(f"  {i+1:2d}. {player['name']:25s} {player['fantasy_points']:6.1f} pts (Rank {player['rank']})")

if __name__ == "__main__":
    main()