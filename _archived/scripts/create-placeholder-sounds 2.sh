#!/bin/bash
# Create placeholder sound files for draft alerts
# These are temporary - replace with actual sound files

SOUNDS_DIR="public/sounds"

# Create directory if it doesn't exist
mkdir -p "$SOUNDS_DIR"

# Create a simple beep tone using ffmpeg (if available)
# Otherwise, create empty placeholder files

if command -v ffmpeg &> /dev/null; then
  echo "Creating placeholder sound files with ffmpeg..."
  
  # Create a simple beep for "your-turn" (500ms, 800Hz)
  ffmpeg -f lavfi -i "sine=frequency=800:duration=0.5" -acodec libmp3lame "$SOUNDS_DIR/your-turn.mp3" -y 2>/dev/null
  
  # Create an urgent beep for "10 seconds" (200ms, 1200Hz, repeated)
  ffmpeg -f lavfi -i "sine=frequency=1200:duration=0.2" -acodec libmp3lame "$SOUNDS_DIR/urgent-beep.mp3" -y 2>/dev/null
  
  echo "✅ Sound files created"
else
  echo "⚠️  ffmpeg not found. Creating placeholder files..."
  echo "# Placeholder - replace with actual sound file" > "$SOUNDS_DIR/your-turn.mp3"
  echo "# Placeholder - replace with actual sound file" > "$SOUNDS_DIR/urgent-beep.mp3"
  echo "⚠️  Please add actual sound files to $SOUNDS_DIR/"
  echo "   - your-turn.mp3 (for 'On The Clock' alert)"
  echo "   - urgent-beep.mp3 (for '10 Seconds Remaining' alert)"
fi
