import { getAllowedCharacters, getLocaleDescription } from './localeCharacters';

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 18;

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help', 'info',
  'system', 'root', 'guest', 'anonymous', 'user', 'test', 'demo',
  'newuser', 'newusername', 'user123', 'test123', 'demo123'
];

// Function to validate username format
export function validateUsername(username, countryCode = 'US') {
  const errors = [];
  
  // Check length
  if (!username || username.length < USERNAME_MIN_LENGTH) {
    errors.push(`Username must be at least ${USERNAME_MIN_LENGTH} characters long`);
  }
  
  if (username && username.length > USERNAME_MAX_LENGTH) {
    errors.push(`Username must be no more than ${USERNAME_MAX_LENGTH} characters long`);
  }
  
  // Check if username is reserved
  if (username && RESERVED_USERNAMES.includes(username.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
  }
  
  // Get allowed characters for the country
  const allowedChars = getAllowedCharacters(countryCode);
  
  // Check each character
  if (username) {
    for (let i = 0; i < username.length; i++) {
      const char = username[i];
      if (!allowedChars.includes(char)) {
        errors.push(`Character '${char}' is not allowed in usernames for your country`);
        break; // Only show first invalid character error
      }
    }
  }
  
  // Check for any spaces (not allowed)
  if (username && username.includes(' ')) {
    errors.push('Username cannot contain any spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Function to check if username is available (for uniqueness validation)
export async function checkUsernameAvailability(username) {
  try {
    // This would typically check against your database
    // For now, we'll simulate this with a simple check
    const { db } = await import('./firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    return {
      isAvailable: querySnapshot.empty,
      message: querySnapshot.empty ? 'Username is available' : 'Username is already taken'
    };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return {
      isAvailable: false,
      message: 'Error checking username availability'
    };
  }
}

// Function to get username requirements for a country
export function getUsernameRequirements(countryCode = 'US') {
  const description = getLocaleDescription(countryCode);
  return {
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
    allowedCharacters: getAllowedCharacters(countryCode),
    description: description,
    rules: [
      `Must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters long`,
      'Cannot contain any spaces',
      'Cannot be a reserved username',
      `Character set: ${description}`
    ]
  };
}

// Function to sanitize username (remove extra spaces, etc.)
export function sanitizeUsername(username) {
  if (!username) return '';
  
  // Remove leading/trailing spaces and replace multiple spaces with single space
  return username.trim().replace(/\s+/g, ' ');
}

// Function to format username for display (capitalize first letter)
export function formatUsername(username) {
  if (!username) return '';
  
  const sanitized = sanitizeUsername(username);
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
} 