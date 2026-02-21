#!/usr/bin/env python3
"""
Advanced Large CSV Processor using Pandas
Efficiently handles multi-gigabyte CSV files with chunking and memory optimization
"""

import pandas as pd
import numpy as np
import os
import sys
import json
from datetime import datetime
import gc

class PandasCSVProcessor:
    def __init__(self, csv_path, chunk_size=50000):
        self.csv_path = csv_path
        self.chunk_size = chunk_size
        self.headers = []
        self.total_rows = 0
        self.sample_data = None
        
    def analyze_file_structure(self):
        """Analyze CSV structure efficiently"""
        print(f"📊 Analyzing CSV file: {os.path.basename(self.csv_path)}")
        
        file_size = os.path.getsize(self.csv_path)
        print(f"📁 File size: {file_size / (1024**3):.2f} GB")
        
        try:
            # Read just the first few rows to understand structure
            sample_df = pd.read_csv(self.csv_path, nrows=1000)
            self.headers = list(sample_df.columns)
            self.sample_data = sample_df
            
            print(f"📋 Found {len(self.headers)} columns:")
            for i, header in enumerate(self.headers):
                dtype = str(sample_df[header].dtype)
                non_null = sample_df[header].notna().sum()
                print(f"  {i+1:3d}. {header:30s} [{dtype:10s}] ({non_null}/1000 non-null)")
            
            # Estimate total rows
            try:
                # Quick row count using pandas
                total_chunks = 0
                for chunk in pd.read_csv(self.csv_path, chunksize=self.chunk_size):
                    total_chunks += len(chunk)
                self.total_rows = total_chunks
                print(f"📊 Total rows: {self.total_rows:,}")
            except Exception as e:
                print(f"⚠️  Could not count all rows: {e}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error analyzing file: {e}")
            return False
    
    def show_sample_data(self, rows=5):
        """Show sample data"""
        if self.sample_data is not None:
            print(f"\n📄 Sample data (first {rows} rows):")
            print("-" * 100)
            
            # Show with better formatting
            pd.set_option('display.max_columns', 10)
            pd.set_option('display.width', 100)
            print(self.sample_data.head(rows).to_string())
            print("-" * 100)
    
    def detect_player_columns(self):
        """Auto-detect player name and relevant stat columns"""
        player_columns = []
        stat_columns = []
        position_columns = []
        team_columns = []
        
        if self.sample_data is None:
            return [], [], [], []
        
        for col in self.headers:
            col_lower = col.lower()
            col_data = self.sample_data[col]
            
            # Player name detection
            if any(keyword in col_lower for keyword in [
                'name', 'player', 'full_name', 'player_name'
            ]):
                # Check if it contains text that looks like names
                if col_data.dtype == 'object':
                    sample_values = col_data.dropna().head(5).tolist()
                    if any(' ' in str(val) for val in sample_values):  # Names usually have spaces
                        player_columns.append(col)
            
            # Position detection
            elif any(keyword in col_lower for keyword in [
                'position', 'pos', 'eligible'
            ]):
                position_columns.append(col)
            
            # Team detection
            elif any(keyword in col_lower for keyword in [
                'team', 'tm', 'club'
            ]):
                team_columns.append(col)
            
            # Fantasy/stat detection
            elif any(keyword in col_lower for keyword in [
                'fantasy', 'points', 'pts', 'yards', 'yd', 'yds',
                'touchdown', 'td', 'reception', 'rec', 'target', 'tgt',
                'rush', 'pass', 'adp', 'rank', 'projection', 'proj',
                'actual', 'season', 'week', 'game', 'snap', 'share',
                'ppr', 'half', 'standard', 'score'
            ]):
                # Check if it's numeric
                if pd.api.types.is_numeric_dtype(col_data) or col_data.dtype == 'object':
                    stat_columns.append(col)
        
        print(f"\n🏈 AUTO-DETECTED COLUMNS:")
        print(f"👤 Player columns: {player_columns}")
        print(f"🏟️  Position columns: {position_columns}")
        print(f"🏈 Team columns: {team_columns}")
        print(f"📊 Stat columns ({len(stat_columns)} found): {stat_columns[:10]}{'...' if len(stat_columns) > 10 else ''}")
        
        return player_columns, stat_columns, position_columns, team_columns
    
    def extract_fantasy_data(self, player_col, stat_cols, position_col=None, team_col=None, 
                           filters=None, year_col=None):
        """Extract fantasy football data efficiently using chunking"""
        
        print(f"\n⚙️  EXTRACTING DATA...")
        print(f"👤 Player column: {player_col}")
        print(f"📊 Extracting {len(stat_cols)} stat columns")
        if position_col:
            print(f"🏟️  Position column: {position_col}")
        if team_col:
            print(f"🏈 Team column: {team_col}")
        
        # Prepare columns to read
        columns_to_read = [player_col] + stat_cols
        if position_col and position_col not in columns_to_read:
            columns_to_read.append(position_col)
        if team_col and team_col not in columns_to_read:
            columns_to_read.append(team_col)
        if year_col and year_col not in columns_to_read:
            columns_to_read.append(year_col)
        
        all_data = []
        processed_rows = 0
        
        try:
            # Process in chunks to handle large file
            chunk_num = 0
            for chunk in pd.read_csv(self.csv_path, chunksize=self.chunk_size, 
                                   usecols=columns_to_read, low_memory=False):
                chunk_num += 1
                
                # Clean the chunk
                chunk = chunk.dropna(subset=[player_col])  # Remove rows without player names
                chunk[player_col] = chunk[player_col].astype(str).str.strip()
                chunk = chunk[chunk[player_col] != '']  # Remove empty names
                
                # Apply filters if provided
                if filters:
                    if position_col and 'positions' in filters:
                        chunk = chunk[chunk[position_col].isin(filters['positions'])]
                    if year_col and 'year' in filters:
                        chunk = chunk[chunk[year_col] == filters['year']]
                
                # Convert to records
                chunk_records = chunk.to_dict('records')
                all_data.extend(chunk_records)
                
                processed_rows += len(chunk)
                
                if chunk_num % 10 == 0:  # Progress every 10 chunks
                    print(f"  📦 Processed chunk {chunk_num:,} ({processed_rows:,} rows so far)")
                    gc.collect()  # Free up memory
            
            print(f"✅ Extraction complete: {len(all_data):,} records extracted")
            
        except Exception as e:
            print(f"❌ Error during extraction: {e}")
            return None
        
        return all_data
    
    def analyze_fantasy_positions(self, data, position_col):
        """Analyze position distribution in the data"""
        if not data or not position_col:
            return
        
        positions = {}
        for record in data:
            pos = record.get(position_col, 'Unknown')
            positions[pos] = positions.get(pos, 0) + 1
        
        print(f"\n🏟️  POSITION DISTRIBUTION:")
        for pos, count in sorted(positions.items(), key=lambda x: x[1], reverse=True):
            print(f"  {pos:10s}: {count:,} players")
    
    def save_for_integration(self, data, output_path):
        """Save data in format ready for integration with our player database"""
        
        if not data:
            print("❌ No data to save")
            return False
        
        try:
            # Save raw extracted data
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            print(f"💾 Raw data saved to: {output_path}")
            
            # Also create a summary file
            summary_path = output_path.replace('.json', '_summary.json')
            summary = {
                'extraction_date': datetime.now().isoformat(),
                'total_records': len(data),
                'columns': list(data[0].keys()) if data else [],
                'sample_record': data[0] if data else None
            }
            
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2, default=str)
            
            print(f"📋 Summary saved to: {summary_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving data: {e}")
            return False

def interactive_setup(processor):
    """Interactive setup for column selection"""
    
    print(f"\n🔧 INTERACTIVE COLUMN SELECTION")
    print("=" * 60)
    
    # Auto-detect columns
    player_cols, stat_cols, pos_cols, team_cols = processor.detect_player_columns()
    
    # Select player column
    if len(player_cols) == 1:
        player_col = player_cols[0]
        print(f"✅ Auto-selected player column: {player_col}")
    else:
        print(f"\nAvailable player columns: {player_cols}")
        if player_cols:
            player_col = input(f"Select player column [{player_cols[0]}]: ").strip() or player_cols[0]
        else:
            player_col = input("Enter player column name: ").strip()
    
    # Select position column (optional)
    position_col = None
    if pos_cols:
        position_col = pos_cols[0]
        print(f"✅ Auto-selected position column: {position_col}")
    
    # Select team column (optional)
    team_col = None
    if team_cols:
        team_col = team_cols[0]
        print(f"✅ Auto-selected team column: {team_col}")
    
    # Select stat columns
    print(f"\n📊 Found {len(stat_cols)} potential stat columns")
    use_all = input("Use all detected stat columns? [y/N]: ").strip().lower()
    
    if use_all == 'y':
        selected_stat_cols = stat_cols
    else:
        print("Available stat columns:")
        for i, col in enumerate(stat_cols):
            print(f"  {i+1:3d}. {col}")
        
        selection = input("Enter column numbers (comma-separated) or 'all': ").strip()
        if selection.lower() == 'all':
            selected_stat_cols = stat_cols
        else:
            try:
                indices = [int(x.strip()) - 1 for x in selection.split(',')]
                selected_stat_cols = [stat_cols[i] for i in indices if 0 <= i < len(stat_cols)]
            except:
                print("Invalid selection, using all columns")
                selected_stat_cols = stat_cols
    
    print(f"✅ Selected {len(selected_stat_cols)} stat columns")
    
    # Filters
    filters = {}
    if position_col:
        filter_pos = input("Filter by positions (e.g., 'QB,RB,WR,TE') or press Enter for all: ").strip()
        if filter_pos:
            filters['positions'] = [pos.strip() for pos in filter_pos.split(',')]
    
    return player_col, selected_stat_cols, position_col, team_col, filters

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 process_large_csv_pandas.py <csv_file_path>")
        print("Example: python3 process_large_csv_pandas.py /path/to/your/5gb-data.csv")
        return
    
    csv_path = sys.argv[1]
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        return
    
    print("🏈 ADVANCED CSV PROCESSOR WITH PANDAS")
    print("=" * 60)
    
    # Initialize processor
    processor = PandasCSVProcessor(csv_path)
    
    # Step 1: Analyze file
    print("\n📊 STEP 1: ANALYZING FILE STRUCTURE")
    if not processor.analyze_file_structure():
        return
    
    # Step 2: Show sample data
    print("\n📄 STEP 2: SAMPLE DATA PREVIEW")
    processor.show_sample_data()
    
    # Step 3: Interactive setup
    print("\n🔧 STEP 3: COLUMN SELECTION")
    try:
        player_col, stat_cols, position_col, team_col, filters = interactive_setup(processor)
    except KeyboardInterrupt:
        print("\n👋 Processing cancelled")
        return
    
    # Step 4: Extract data
    print("\n⚙️  STEP 4: DATA EXTRACTION")
    extracted_data = processor.extract_fantasy_data(
        player_col, stat_cols, position_col, team_col, filters
    )
    
    if not extracted_data:
        print("❌ No data extracted")
        return
    
    # Step 5: Analyze results
    print("\n📊 STEP 5: ANALYSIS")
    if position_col:
        processor.analyze_fantasy_positions(extracted_data, position_col)
    
    # Step 6: Save results
    print("\n💾 STEP 6: SAVING RESULTS")
    output_file = f"extracted_fantasy_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    processor.save_for_integration(extracted_data, output_file)
    
    print(f"\n✅ PROCESSING COMPLETE!")
    print(f"📁 Output file: {output_file}")
    print(f"🏈 Records extracted: {len(extracted_data):,}")
    print(f"📊 Columns: {len(stat_cols)} stats + metadata")
    
    print(f"\n🔗 NEXT STEPS:")
    print(f"1. Review the extracted data in {output_file}")
    print(f"2. Use the DataManager to integrate into the player database")
    print(f"3. Run: python3 scripts/integrate_extracted_data.py {output_file}")

if __name__ == "__main__":
    main()