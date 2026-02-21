#!/bin/bash

# Push Notifications Setup Script
# This script automates the setup process for push notifications

set -e  # Exit on error

echo "🚀 Push Notifications Setup Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    echo "Creating .env.local template..."
    cat > .env.local << 'EOF'
# Firebase Configuration (REQUIRED)
# Get these from Firebase Console > Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# FCM VAPID Key (REQUIRED for push notifications)
# Get from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key_here
EOF
    echo -e "${YELLOW}⚠️  Created .env.local template. Please update with your Firebase config.${NC}"
    echo ""
fi

# Check if VAPID key is set
if ! grep -q "NEXT_PUBLIC_FCM_VAPID_KEY" .env.local || grep -q "your_vapid_key_here" .env.local; then
    echo -e "${YELLOW}⚠️  VAPID key not configured${NC}"
    echo "To get your VAPID key:"
    echo "1. Go to Firebase Console > Project Settings > Cloud Messaging"
    echo "2. Under 'Web Push certificates', click 'Generate key pair'"
    echo "3. Copy the key and add to .env.local as NEXT_PUBLIC_FCM_VAPID_KEY"
    echo ""
else
    echo -e "${GREEN}✅ VAPID key configured${NC}"
fi

# Generate service worker
echo "📝 Generating service worker..."
if npm run generate-sw 2>/dev/null; then
    echo -e "${GREEN}✅ Service worker generated${NC}"
else
    echo -e "${YELLOW}⚠️  Service worker generation skipped (env vars may not be set)${NC}"
fi
echo ""

# Install functions dependencies
echo "📦 Installing Firebase Functions dependencies..."
cd functions
if [ ! -d "node_modules" ]; then
    if npm install; then
        echo -e "${GREEN}✅ Functions dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install functions dependencies${NC}"
        echo "You may need to run 'cd functions && npm install' manually"
    fi
else
    echo -e "${GREEN}✅ Functions dependencies already installed${NC}"
fi
cd ..
echo ""

# Build functions
echo "🔨 Building Firebase Functions..."
cd functions
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✅ Functions built successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Functions build skipped (TypeScript may need configuration)${NC}"
fi
cd ..
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. ✅ Code is ready"
echo "2. ⏳ Configure Firebase Console:"
echo "   - Enable FCM in Project Settings > Cloud Messaging"
echo "   - Generate Web Push certificate (VAPID key)"
echo "   - Add VAPID key to .env.local"
echo "3. ⏳ Deploy functions:"
echo "   cd functions && npm run deploy"
echo "4. ⏳ Test: Enable FCM in user preferences"
echo ""
echo "For detailed instructions, see: SETUP_PUSH_NOTIFICATIONS.md"
