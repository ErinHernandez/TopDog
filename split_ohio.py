#!/usr/bin/env python3
"""
Script to split the Ohio SVG path into 12 close to equal chunks.
"""

import re
import math
from pathlib import Path

def extract_ohio_path(svg_file):
    """Extract the Ohio path from the SVG file."""
    with open(svg_file, 'r') as f:
        content = f.read()
    
    # Find the Ohio path using regex - look for the path element containing id="OH"
    pattern = r'<path[^>]*id="OH"[^>]*d="([^"]*)"[^>]*/>'
    match = re.search(pattern, content)
    
    if not match:
        # Try a different approach - look for the line containing id="OH"
        lines = content.split('\n')
        for line in lines:
            if 'id="OH"' in line:
                # Extract the d attribute from this line
                d_match = re.search(r'd="([^"]*)"', line)
                if d_match:
                    return d_match.group(1)
    
    if match:
        return match.group(1)
    else:
        raise ValueError("Ohio path not found in SVG file")

def parse_path_data(path_data):
    """Parse SVG path data into a list of commands and coordinates."""
    # Split the path data into commands and coordinates
    commands = []
    current_command = None
    current_coords = []
    
    # Split by spaces and process each part
    parts = path_data.split()
    
    for part in parts:
        if part.isalpha():
            # This is a command
            if current_command:
                commands.append((current_command, current_coords))
            current_command = part
            current_coords = []
        else:
            # This is a coordinate
            try:
                coord = float(part)
                current_coords.append(coord)
            except ValueError:
                # Handle cases where coordinates might be comma-separated
                for subpart in part.split(','):
                    try:
                        coord = float(subpart)
                        current_coords.append(coord)
                    except ValueError:
                        continue
    
    # Add the last command
    if current_command:
        commands.append((current_command, current_coords))
    
    return commands

def split_path_commands(commands, num_chunks):
    """Split the path commands into approximately equal chunks."""
    total_commands = len(commands)
    chunk_size = math.ceil(total_commands / num_chunks)
    
    chunks = []
    for i in range(0, total_commands, chunk_size):
        chunk = commands[i:i + chunk_size]
        chunks.append(chunk)
    
    return chunks

def commands_to_path_data(commands):
    """Convert commands back to SVG path data string."""
    path_parts = []
    
    for command, coords in commands:
        path_parts.append(command)
        path_parts.extend([str(coord) for coord in coords])
    
    return ' '.join(path_parts)

def create_chunk_svg(chunk_commands, chunk_num, original_svg_content):
    """Create a new SVG file for a chunk."""
    # Create the path data for this chunk
    chunk_path_data = commands_to_path_data(chunk_commands)
    
    # Create the new path element
    chunk_path = f'<path id="OH_chunk_{chunk_num}" class="st3" d="{chunk_path_data}" style="fill: none; stroke: rgb(204, 204, 204); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>'
    
    # Replace the original Ohio path with this chunk
    new_svg_content = re.sub(
        r'<path[^>]*id="OH"[^>]*/>',
        chunk_path,
        original_svg_content
    )
    
    return new_svg_content

def main():
    svg_file = "public/vecteezy_united-states_36654955.svg"
    num_chunks = 12
    
    print(f"Splitting Ohio SVG into {num_chunks} chunks...")
    
    # Extract the Ohio path
    try:
        ohio_path_data = extract_ohio_path(svg_file)
        print("✓ Ohio path extracted successfully")
    except ValueError as e:
        print(f"✗ Error: {e}")
        return
    
    # Parse the path data
    commands = parse_path_data(ohio_path_data)
    print(f"✓ Parsed {len(commands)} path commands")
    
    # Split into chunks
    chunks = split_path_commands(commands, num_chunks)
    print(f"✓ Split into {len(chunks)} chunks")
    
    # Read the original SVG content
    with open(svg_file, 'r') as f:
        original_svg_content = f.read()
    
    # Create output directory
    output_dir = Path("ohio_chunks")
    output_dir.mkdir(exist_ok=True)
    
    # Create individual chunk files
    for i, chunk_commands in enumerate(chunks, 1):
        chunk_svg_content = create_chunk_svg(chunk_commands, i, original_svg_content)
        
        output_file = output_dir / f"ohio_chunk_{i:02d}.svg"
        with open(output_file, 'w') as f:
            f.write(chunk_svg_content)
        
        print(f"✓ Created {output_file} with {len(chunk_commands)} commands")
    
    # Create a combined file showing all chunks
    combined_content = original_svg_content
    for i, chunk_commands in enumerate(chunks, 1):
        chunk_path_data = commands_to_path_data(chunk_commands)
        chunk_path = f'<path id="OH_chunk_{i}" class="st3" d="{chunk_path_data}" style="fill: none; stroke: rgb(204, 204, 204); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>'
        
        # Add this chunk path to the combined file
        # Insert before the closing </g> tag
        combined_content = combined_content.replace('</g>', f'{chunk_path}\n\t</g>', 1)
    
    combined_file = output_dir / "ohio_all_chunks.svg"
    with open(combined_file, 'w') as f:
        f.write(combined_content)
    
    print(f"✓ Created combined file: {combined_file}")
    print(f"\nAll files saved in: {output_dir.absolute()}")

if __name__ == "__main__":
    main()
