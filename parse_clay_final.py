#!/usr/bin/env python3
"""
Parse Mike Clay ESPN projections - Final comprehensive version
"""
import re
import json
import csv
from pathlib import Path

def parse_player_line_comprehensive(line):
    """Parse a player line to extract name, position, fantasy points, and position rank"""
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
    
    # Clean up names that have trailing stats mixed in
    # Handle cases like "Shedeur Sanders 4 139 86 926 4 4 11"
    if any(char.isdigit() for char in player_name):
        # Try to find the actual name before stats start
        clean_name_parts = []
        for part in name_parts:
            if part.isdigit():
                break
            clean_name_parts.append(part)
        if clean_name_parts:
            player_name = ' '.join(clean_name_parts)
    
    stats = parts[stats_start_idx:]
    
    if len(stats) < 15:  # Need enough stats
        return None
    
    try:
        games = int(stats[0])
        
        # Find fantasy points and position rank
        # Look backwards from "ED", "LB", "DI", "CB", "S" markers which indicate defensive stats
        fantasy_points = None
        position_rank = None
        
        defense_markers = ['ED', 'LB', 'DI', 'CB', 'S']
        
        for i, part in enumerate(stats):
            if part in defense_markers:
                # Fantasy points should be 2 positions back, rank 1 position back
                if i >= 2:
                    try:
                        position_rank = int(stats[i-1])
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
            'position_rank': position_rank
        }
    except (ValueError, IndexError):
        return None

def parse_all_projections():
    """Parse all player projections from extracted text"""
    players = []
    
    try:
        with open('extracted_text.txt', 'r') as f:
            lines = f.readlines()
        
        print("Parsing all positions...")
        for line_num, line in enumerate(lines):
            player = parse_player_line_comprehensive(line)
            if player:
                players.append(player)
                print(f"Line {line_num}: {player['position']}{player['position_rank']} {player['name']} - {player['fantasy_points']} pts")
        
    except FileNotFoundError:
        print("extracted_text.txt not found. Run extract_clay_projections.py first.")
        return []
    
    return players

def main():
    print("Parsing Mike Clay projections - All positions...")
    players = parse_all_projections()
    
    print(f"\nFound {len(players)} total players with projections")
    
    # Save as JSON
    with open('clay_projections_final.json', 'w') as f:
        json.dump(players, f, indent=2)
    
    # Save as CSV
    if players:
        with open('clay_projections_final.csv', 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'position', 'games', 'fantasy_points', 'position_rank'])
            writer.writeheader()
            writer.writerows(players)
    
    print("Saved projections to clay_projections_final.json and clay_projections_final.csv")
    
    # Show summary by position
    by_position = {}
    for player in players:
        pos = player['position']
        if pos not in by_position:
            by_position[pos] = []
        by_position[pos].append(player)
    
    print("\nTop players by fantasy points in each position:")
    for pos in ['QB', 'RB', 'WR', 'TE']:
        if pos in by_position:
            players_at_pos = by_position[pos]
            players_at_pos.sort(key=lambda x: x['fantasy_points'], reverse=True)
            print(f"\n{pos} ({len(players_at_pos)} players):")
            for i, player in enumerate(players_at_pos[:10]):  # Top 10
                print(f"  {player['position']}{player['position_rank']:2d}. {player['name']:25s} {player['fantasy_points']:6.1f} pts")

if __name__ == "__main__":
    main()