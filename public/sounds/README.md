# Draft Alert Sound Files

This directory contains audio files for draft alert notifications.

## Required Files

- `your-turn.mp3` - Sound for "On The Clock" alert
- `urgent-beep.mp3` - Sound for "10 Seconds Remaining" alert

## File Specifications

- **Format**: MP3
- **Duration**: 0.5-2 seconds (short, non-intrusive)
- **Volume**: Normalized to -12dB to -6dB
- **Sample Rate**: 44.1kHz or 48kHz
- **Bitrate**: 128kbps minimum

## Placeholder Files

Currently, placeholder files need to be added. You can:
1. Use royalty-free alert sounds from sites like freesound.org
2. Generate simple beep tones using audio editing software
3. Use system notification sounds as a temporary solution

## Integration

Sounds are loaded via the `audioAlerts.ts` module and played using the Web Audio API.
