# Best Ball Fantasy Football Site

A fantasy football draft website with tournament types: TopDog and development tournaments.

## Features

- **Tournament Types**: TopDog tournament
- **Real-time Drafting**: Live draft rooms with player selection
- **User Management**: Balance tracking, statistics, and profile management
- **Payment Integration**: Stripe-powered deposit system with geolocation verification
- **Location Verification**: Geolocation approval required for deposits (US states only)

## Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env.local file with the following variables:
   
   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required for Payments
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key

### Required for Database
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

## Geolocation Requirements

The deposit system requires geolocation verification. Users must be located in approved US states to make deposits. The system automatically:

1. Requests location permission from the browser
2. Gets GPS coordinates
3. Reverse geocodes to determine state
4. Validates against approved states list
5. Stores location data with transactions

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## Project Structure

```
bestball-site/
├── components/          # React components
├── lib/                # Utility functions and Firebase config
├── pages/              # Next.js pages and API routes
├── public/             # Static assets
└── styles/             # CSS styles
```

## License

This project is proprietary and confidential. 