# User Registration System with Country-Specific Username Validation

## Overview

This implementation provides a complete user registration flow with username creation that supports country-specific character validation. The system follows two main rules:

1. **Rule 1**: Everyone can use standard Western alphabet and numbers (a-z, A-Z, 0-9) - no accented characters
2. **Rule 2**: Countries can use additional characters from their local dialect based on a centralized configuration file
3. **Rule 3**: Users can mix local language characters with standard Western alphabet in any order

## Files Created/Modified

### Core Files
- `lib/localeCharacters.js` - Centralized character mapping for different countries
- `lib/usernameValidation.js` - Username validation utilities
- `lib/userRegistration.js` - User registration service for database operations
- `components/RegistrationModal.js` - Registration modal component
- `components/AuthModal.js` - Updated authentication modal
- `pages/test-registration.js` - Test page for demonstrating functionality

## Key Features

### 1. Country-Specific Character Validation with Mixing

The system uses a centralized file (`localeCharacters.js`) to control what characters are allowed for usernames in different countries. Users can mix local language characters with standard Western alphabet in any order:

```javascript
export const localeCharacters = {
  'US': {
    additionalChars: '', // US only gets standard western alphabet
    description: 'United States - Standard Western alphabet only'
  },
  'FR': {
    additionalChars: 'éèêëàâäôöùûüçîïœæ', // French accents
    description: 'France - Western alphabet + French accents'
  },
  'RU': {
    additionalChars: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', // Cyrillic alphabet
    description: 'Russia - Western alphabet + Cyrillic characters'
  }
  // ... more countries
};
```

### 2. Character Mixing Examples

Users can freely mix local language characters with standard Western alphabet:

**France Examples:**
- `Jean123` (French name + numbers)
- `Marie2023` (French name + numbers)
- `François` (French name with accent)
- `Élise2024` (French name with accent + numbers)

**Germany Examples:**
- `Hans2023` (German name + numbers)
- `Müller` (German name with umlaut)
- `Schröder` (German name with umlaut)

**Russia Examples:**
- `Ivan2023` (Russian name + numbers)
- `Мария` (Pure Cyrillic)
- `Dmitry` (English spelling of Russian name)
- `Алексей` (Pure Cyrillic)

### 3. Username Validation Rules

- **Length**: 3-18 characters
- **Characters**: Standard Western alphabet (a-z, A-Z, 0-9) + country-specific characters
- **Mixing**: Users can mix local and standard characters in any order
- **Format**: No spaces allowed
- **Reserved**: Cannot use reserved usernames (admin, moderator, etc.)
- **Uniqueness**: Must be unique across all users

### 4. Real-time Validation

The registration form provides:
- Real-time character validation
- Username availability checking (debounced)
- Visual feedback with color-coded borders
- Detailed error messages
- Support for character mixing validation

### 5. Database Integration

User profiles are stored in Firestore with the following structure:

```javascript
{
  uid: 'user_id',
  username: 'sanitized_username',
  email: 'user@example.com',
  countryCode: 'US',
  displayName: 'Display Name',
  createdAt: Date,
  updatedAt: Date,
  isActive: true,
  profileComplete: true,
  tournamentsEntered: 0,
  tournamentsWon: 0,
  totalWinnings: 0,
  preferences: {
    notifications: true,
    emailUpdates: true,
    publicProfile: true
  }
}
```

## Usage

### 1. Testing the System

Visit `/test-registration` to test the username validation and registration flow:

- Test username validation for different countries
- See character sets for each country
- View examples of valid mixed usernames
- Test the full registration modal

### 2. Integration with Existing Auth

The system integrates with your existing authentication flow:

```javascript
// In your components
import RegistrationModal from '../components/RegistrationModal';

// Show registration when user needs to complete profile
<RegistrationModal
  open={showRegistration}
  onClose={() => setShowRegistration(false)}
  onRegistrationSuccess={handleRegistrationSuccess}
  user={currentUser}
/>
```

### 3. Adding New Countries

To add support for a new country, simply add an entry to `localeCharacters.js`:

```javascript
'NEW_COUNTRY_CODE': {
  additionalChars: 'additional_characters_here',
  description: 'Country description'
}
```

## API Functions

### Username Validation
```javascript
import { validateUsername, getUsernameRequirements } from '../lib/usernameValidation';

// Validate a username (supports character mixing)
const result = validateUsername('Jean123', 'FR'); // Valid mixed username
console.log(result.isValid, result.errors);

// Get requirements for a country
const requirements = getUsernameRequirements('FR');
```

### User Registration
```javascript
import { UserRegistrationService } from '../lib/userRegistration';

// Create user profile with mixed username
const result = await UserRegistrationService.createUserProfile({
  uid: 'user_id',
  username: 'François2023', // Mixed characters
  email: 'user@example.com',
  countryCode: 'FR'
});

// Check if profile is complete
const isComplete = await UserRegistrationService.isProfileComplete('user_id');
```

### Character Sets
```javascript
import { getAllowedCharacters, getLocaleDescription } from '../lib/localeCharacters';

// Get allowed characters for a country (local + standard)
const chars = getAllowedCharacters('FR'); // Returns: éèêëàâäôöùûüçîïœæabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789

// Get description for a country
const description = getLocaleDescription('FR');
```

## Character Mixing Examples by Country

### European Countries
- **France**: `Jean123`, `Marie2023`, `François`, `Élise2024`
- **Germany**: `Hans2023`, `Müller`, `Schröder`, `Günther`
- **Spain**: `José123`, `María2023`, `Carlos`, `Ana2024`
- **Poland**: `Jan2023`, `Kowalski`, `Marek`, `Nowak`
- **Czech Republic**: `Jan2023`, `Novák`, `Petr`, `Svoboda`

### Asian Countries
- **Japan**: `Taro2023`, `花子`, `Kenji`, `美咲`, `Yuki`
- **Korea**: `Kim2023`, `민수`, `Park`, `지영`, `Lee123`

### Other Regions
- **Russia**: `Ivan2023`, `Мария`, `Dmitry`, `Алексей`
- **Turkey**: `Mehmet123`, `Güneş`, `Ayşe`, `Özkan`
- **Saudi Arabia**: `Ahmed123`, `محمد`, `Ali`, `فاطمة`

## Security Features

1. **Input Sanitization**: Usernames are sanitized to remove extra spaces
2. **Reserved Names**: System prevents use of reserved usernames
3. **Database Validation**: Server-side validation ensures data integrity
4. **Uniqueness Check**: Real-time availability checking prevents duplicates
5. **Character Validation**: Each character is validated against allowed set

## Database Schema

The system creates a `users` collection in Firestore with the following structure:

```javascript
users/{uid} = {
  uid: string,
  username: string, // Can contain mixed characters
  email: string | null,
  countryCode: string,
  displayName: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean,
  profileComplete: boolean,
  tournamentsEntered: number,
  tournamentsWon: number,
  totalWinnings: number,
  bestFinish: object | null,
  lastLogin: timestamp,
  preferences: {
    notifications: boolean,
    emailUpdates: boolean,
    publicProfile: boolean
  }
}
```

## Firestore Rules

You'll need to add appropriate Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if resource.data.publicProfile == true;
    }
  }
}
```

## Future Enhancements

1. **Auto-detection**: Automatically detect user's country based on IP/location
2. **Character preview**: Show which characters are available for each country
3. **Username suggestions**: Suggest available usernames when desired one is taken
4. **Profile completion**: Track and encourage users to complete their profiles
5. **Username history**: Track username changes for audit purposes
6. **Advanced mixing**: Support for more complex character combinations

## Testing

The test page at `/test-registration` provides comprehensive testing capabilities:

- Test username validation for all supported countries
- See character sets and requirements for each country
- View examples of valid mixed usernames
- Test the full registration flow
- Validate error handling and edge cases
- Test character mixing functionality

This implementation provides a robust, scalable foundation for user registration with country-specific character support and full character mixing capabilities while maintaining security and usability. 