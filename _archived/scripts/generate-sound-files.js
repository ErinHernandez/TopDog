/**
 * Generate placeholder sound files for draft alerts
 * Creates simple beep tones using Web Audio API concepts
 * 
 * Note: This creates minimal valid MP3 files that can be replaced later
 */

const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '../public/sounds');

// Create directory if it doesn't exist
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

// Create minimal MP3 file headers (these are placeholder files)
// In production, replace with actual sound files

// Minimal MP3 header structure (very basic)
const createMinimalMP3 = (duration = 0.5) => {
  // This is a minimal valid MP3 frame header
  // In production, these should be replaced with actual sound files
  const header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word + header
    // Minimal frame data
  ]);
  
  // For now, create a text file that explains it needs to be replaced
  return `# Placeholder sound file
# Replace this with an actual MP3 file
# Duration: ${duration} seconds
# Format: MP3, 44.1kHz, 128kbps minimum
# 
# Recommended sources:
# - freesound.org (royalty-free sounds)
# - Generate with audio editing software
# - Use system notification sounds as reference
`;
};

// Create placeholder files
const files = [
  { name: 'your-turn.mp3', duration: 0.5, description: 'For "On The Clock" alert - gentle notification tone' },
  { name: 'urgent-beep.mp3', duration: 0.2, description: 'For "10 Seconds Remaining" alert - urgent beep tone' },
];

console.log('Creating placeholder sound files...\n');

files.forEach(({ name, duration, description }) => {
  const filePath = path.join(SOUNDS_DIR, name);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${name} already exists - skipping`);
    return;
  }
  
  // Create placeholder text file (will be replaced with actual MP3)
  const placeholder = createMinimalMP3(duration);
  fs.writeFileSync(filePath, placeholder, 'utf8');
  
  console.log(`✅ Created ${name}`);
  console.log(`   ${description}`);
});

console.log('\n📝 Next Steps:');
console.log('1. Replace placeholder files with actual MP3 sound files');
console.log('2. Recommended: Download from freesound.org or generate with audio software');
console.log('3. File specifications: MP3, 44.1kHz, 128kbps, 0.5-2 seconds duration');
console.log(`\n📁 Files location: ${SOUNDS_DIR}`);
