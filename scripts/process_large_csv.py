#!/usr/bin/env python3
"""
Large CSV Processor for Player Statistics
Handles multi-gigabyte CSV files without requiring pandas
"""

import csv
import os
import sys
import json
from collections import defaultdict

class LargeCSVProcessor:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.headers = []
        self.row_count = 0
        self.chunk_size = 10000  # Process 10k rows at a time
        
    def analyze_file(self):
        """Analyze the CSV structure without loading everything into memory"""
        print(f"📊 Analyzing CSV file: {os.path.basename(self.csv_path)}")
        
        file_size = os.path.getsize(self.csv_path)
        print(f"📁 File size: {file_size / (1024**3):.2f} GB")
        
        # Read just the header and first few rows
        with open(self.csv_path, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            
            # Get headers
            try:
                self.headers = next(reader)
                print(f"📋 Found {len(self.headers)} columns:")
                for i, header in enumerate(self.headers[:20]):  # Show first 20 columns
                    print(f"  {i+1:2d}. {header}")
                if len(self.headers) > 20:
                    print(f"  ... and {len(self.headers) - 20} more columns")
                
                # Sample first few rows
                print(f"\n📄 Sample data (first 3 rows):")
                for i, row in enumerate(reader):
                    if i >= 3:
                        break
                    print(f"  Row {i+1}: {row[:5]}{'...' if len(row) > 5 else ''}")
                    
            except Exception as e:
                print(f"❌ Error reading CSV: {e}")
                return False
        
        # Count total rows (approximate)
        print(f"\n🔢 Counting rows (this may take a moment)...")
        try:
            with open(self.csv_path, 'r', encoding='utf-8', errors='ignore') as file:
                self.row_count = sum(1 for line in file) - 1  # Subtract header
            print(f"📊 Total data rows: {self.row_count:,}")
        except Exception as e:
            print(f"⚠️  Could not count rows: {e}")
        
        return True
    
    def find_player_columns(self):
        """Identify potential player name and relevant columns"""
        player_columns = []
        stat_columns = []
        
        for i, header in enumerate(self.headers):
            header_lower = header.lower()
            
            # Potential player name columns
            if any(keyword in header_lower for keyword in ['name', 'player', 'full_name']):
                player_columns.append((i, header))
            
            # Potential stat columns
            if any(keyword in header_lower for keyword in [
                'fantasy', 'points', 'yards', 'touchdown', 'td', 'reception', 'target',
                'rush', 'pass', 'adp', 'rank', 'projection', 'actual'
            ]):
                stat_columns.append((i, header))
        
        print(f"\n🏈 Potential player columns:")
        for idx, col in player_columns:
            print(f"  Column {idx+1}: {col}")
        
        print(f"\n📊 Potential stat columns (showing first 10):")
        for idx, col in stat_columns[:10]:
            print(f"  Column {idx+1}: {col}")
        if len(stat_columns) > 10:
            print(f"  ... and {len(stat_columns) - 10} more")
        
        return player_columns, stat_columns
    
    def extract_player_data(self, player_col_idx, stat_col_indices, position_filter=None):
        """Extract player data in chunks to avoid memory issues"""
        print(f"\n⚙️  Extracting player data...")
        print(f"Player column: {self.headers[player_col_idx]}")
        print(f"Extracting {len(stat_col_indices)} stat columns")
        
        players_data = {}
        processed_rows = 0
        
        with open(self.csv_path, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            
            for row_num, row in enumerate(reader):
                if len(row) <= max(player_col_idx, max(stat_col_indices, default=0)):
                    continue
                
                player_name = row[player_col_idx].strip()
                if not player_name:
                    continue
                
                # Extract stats for this player
                player_stats = {'name': player_name}
                for stat_idx in stat_col_indices:
                    if stat_idx < len(row):
                        stat_name = self.headers[stat_idx]
                        stat_value = row[stat_idx].strip()
                        
                        # Try to convert to number
                        try:
                            if '.' in stat_value:
                                player_stats[stat_name] = float(stat_value)
                            else:
                                player_stats[stat_name] = int(stat_value)
                        except ValueError:
                            player_stats[stat_name] = stat_value
                
                players_data[player_name] = player_stats
                processed_rows += 1
                
                # Progress update
                if processed_rows % 50000 == 0:
                    print(f"  Processed {processed_rows:,} rows...")
        
        print(f"✅ Extraction complete: {len(players_data)} unique players found")
        return players_data
    
    def save_extracted_data(self, data, output_path):
        """Save extracted data as JSON"""
        try:
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"💾 Saved extracted data to: {output_path}")
            return True
        except Exception as e:
            print(f"❌ Error saving data: {e}")
            return False

def interactive_column_selection(processor):
    """Interactive column selection for the user"""
    print(f"\n🔧 INTERACTIVE COLUMN SELECTION")
    print("=" * 50)
    
    # Show all columns with numbers
    print("Available columns:")
    for i, header in enumerate(processor.headers):
        print(f"  {i+1:3d}. {header}")
    
    # Get player name column
    while True:
        try:
            player_col = input(f"\nEnter the column number for PLAYER NAMES (1-{len(processor.headers)}): ")
            player_col_idx = int(player_col) - 1
            if 0 <= player_col_idx < len(processor.headers):
                print(f"✅ Selected player column: {processor.headers[player_col_idx]}")
                break
            else:
                print("❌ Invalid column number")
        except ValueError:
            print("❌ Please enter a valid number")
    
    # Get stat columns
    print(f"\nEnter stat column numbers (comma-separated, e.g., '5,10,15'):")
    print("Or enter 'auto' to auto-detect fantasy football stats")
    
    stat_input = input("Stat columns: ").strip()
    
    if stat_input.lower() == 'auto':
        # Auto-detect fantasy relevant columns
        _, stat_columns = processor.find_player_columns()
        stat_col_indices = [idx for idx, _ in stat_columns]
        print(f"✅ Auto-selected {len(stat_col_indices)} stat columns")
    else:
        try:
            stat_col_indices = [int(x.strip()) - 1 for x in stat_input.split(',')]
            print(f"✅ Selected {len(stat_col_indices)} stat columns")
        except ValueError:
            print("❌ Invalid column selection, using auto-detection")
            _, stat_columns = processor.find_player_columns()
            stat_col_indices = [idx for idx, _ in stat_columns]
    
    return player_col_idx, stat_col_indices

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 process_large_csv.py <csv_file_path>")
        print("Example: python3 process_large_csv.py /path/to/your/data.csv")
        return
    
    csv_path = sys.argv[1]
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        return
    
    print("🏈 LARGE CSV PROCESSOR FOR PLAYER STATISTICS")
    print("=" * 60)
    
    processor = LargeCSVProcessor(csv_path)
    
    # Step 1: Analyze file structure
    if not processor.analyze_file():
        return
    
    # Step 2: Find potential columns
    processor.find_player_columns()
    
    # Step 3: Interactive column selection
    try:
        player_col_idx, stat_col_indices = interactive_column_selection(processor)
    except KeyboardInterrupt:
        print("\n👋 Processing cancelled by user")
        return
    
    # Step 4: Extract data
    extracted_data = processor.extract_player_data(player_col_idx, stat_col_indices)
    
    # Step 5: Save results
    output_file = f"extracted_player_data_{os.path.basename(csv_path).replace('.csv', '')}.json"
    processor.save_extracted_data(extracted_data, output_file)
    
    print(f"\n✅ Processing complete!")
    print(f"📁 Output file: {output_file}")
    print(f"🏈 Players found: {len(extracted_data)}")

if __name__ == "__main__":
    main()