#!/usr/bin/env python3
"""
Quick CSV Examiner - Preview large CSV files without loading them fully
"""

import csv
import os
import sys

def examine_csv(csv_path, preview_rows=10):
    """Examine CSV structure and show preview"""
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        return
    
    file_size = os.path.getsize(csv_path)
    print(f"📁 File: {os.path.basename(csv_path)}")
    print(f"📊 Size: {file_size / (1024**3):.2f} GB")
    print("=" * 60)
    
    try:
        with open(csv_path, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            
            # Read header
            headers = next(reader)
            print(f"📋 Columns ({len(headers)} total):")
            
            # Show all headers with numbers
            for i, header in enumerate(headers):
                print(f"  {i+1:3d}. {header}")
            
            print(f"\n📄 Preview (first {preview_rows} rows):")
            print("-" * 80)
            
            # Show preview rows
            for i, row in enumerate(reader):
                if i >= preview_rows:
                    break
                
                # Show first few columns to avoid overwhelming output
                preview_cols = min(5, len(row))
                row_preview = row[:preview_cols]
                if len(row) > preview_cols:
                    row_preview.append("...")
                
                print(f"Row {i+1:2d}: {row_preview}")
            
            print("-" * 80)
            
    except Exception as e:
        print(f"❌ Error reading file: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 examine_csv.py <csv_file_path> [preview_rows]")
        print("Example: python3 examine_csv.py /path/to/data.csv 20")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    preview_rows = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    examine_csv(csv_path, preview_rows)