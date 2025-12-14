#!/usr/bin/env python3
"""
Parse Mike Clay ESPN projections from extracted text
"""
import re
import json
import csv
from pathlib import Path

def parse_player_line(line):
    """Parse a player line to extract name, position, and fantasy points"""
    # Look for patterns like:
    # QB Kyler Murray 17 552 374 3865 22 12 36 90 597 5 0 0 0 0 306 8
    # RB James Conner 17 0 0 0 0 0 0 232 1048 9 53 46 344 2 250 18
    # WR Marvin Harrison Jr. 17 0 0 0 0 0 0 0 0 0 139 83 1144 7 240 19
    # TE Trey McBride 17 0 0 0 0 0 0 0 0 0 150 113 1088 6 259 2
    
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
    if len(parts) < 10:  # Need enough parts for stats
        return None
    
    # Player name is typically the first 1-3 parts before numbers start
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
        # Fantasy points are typically near the end of the line
        # Looking for the fantasy points column (usually around position 15-16)
        fantasy_points = None
        
        # Try different positions for fantasy points
        for idx in [15, 16, 14]:
            if idx < len(stats):
                try:
                    fp = float(stats[idx])
                    if fp > 0 and fp < 500:  # Reasonable range for fantasy points
                        fantasy_points = fp
                        break
                except ValueError:
                    continue
        
        if fantasy_points is None or fantasy_points <= 0:
            return None
        
        return {
            'name': player_name,
            'position': position,
            'games': games,
            'fantasy_points': fantasy_points
        }
    except (ValueError, IndexError):
        return None

def parse_projections():
    """Parse all player projections from extracted text"""
    players = []
    
    try:
        with open('extracted_text.txt', 'r') as f:
            lines = f.readlines()
        
        for line_num, line in enumerate(lines):
            player = parse_player_line(line)
            if player:
                players.append(player)
                print(f"Line {line_num}: {player}")
        
    except FileNotFoundError:
        print("extracted_text.txt not found. Run extract_clay_projections.py first.")
        return []
    
    return players

def main():
    print("Parsing Mike Clay projections...")
    players = parse_projections()
    
    print(f"\nFound {len(players)} players with projections")
    
    # Save as JSON
    with open('clay_projections.json', 'w') as f:
        json.dump(players, f, indent=2)
    
    # Save as CSV
    if players:
        with open('clay_projections.csv', 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'position', 'games', 'fantasy_points'])
            writer.writeheader()
            writer.writerows(players)
    
    print("Saved projections to clay_projections.json and clay_projections.csv")
    
    # Show summary by position
    by_position = {}
    for player in players:
        pos = player['position']
        if pos not in by_position:
            by_position[pos] = []
        by_position[pos].append(player)
    
    print("\nSummary by position:")
    for pos in ['QB', 'RB', 'WR', 'TE']:
        if pos in by_position:
            players_at_pos = by_position[pos]
            players_at_pos.sort(key=lambda x: x['fantasy_points'], reverse=True)
            print(f"\n{pos} ({len(players_at_pos)} players):")
            for i, player in enumerate(players_at_pos[:10]):  # Top 10
                print(f"  {i+1:2d}. {player['name']:25s} {player['fantasy_points']:6.1f} pts")

if __name__ == "__main__":
    main()