#!/usr/bin/env python3
"""
Extract Mike Clay ESPN projections from PDF
"""
import pdfplumber
import re
import json
import csv
from pathlib import Path

def extract_projections_from_pdf(pdf_path):
    """Extract player projections from Mike Clay PDF"""
    players = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            
            all_text = ""
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing page {page_num + 1}...")
                text = page.extract_text()
                if text:
                    all_text += text + "\n"
            
            # Save extracted text for debugging
            with open('extracted_text.txt', 'w') as f:
                f.write(all_text)
            print("Raw text saved to extracted_text.txt")
            
            # Try to parse the text for player data
            lines = all_text.split('\n')
            
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                
                # Look for patterns that might indicate player data
                # This will need to be adjusted based on the actual PDF format
                print(f"Line {i}: {line[:100]}...")  # Print first 100 chars of each line
                
                if i > 20:  # Just show first 20 lines for debugging
                    break
    
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return []
    
    return players

def main():
    pdf_path = Path("public/DOG_8:14:25_CLAYESPNRANKS_.pdf")
    
    if not pdf_path.exists():
        print(f"PDF file not found: {pdf_path}")
        return
    
    print(f"Extracting projections from: {pdf_path}")
    players = extract_projections_from_pdf(pdf_path)
    
    print(f"Extracted {len(players)} players")

if __name__ == "__main__":
    main()