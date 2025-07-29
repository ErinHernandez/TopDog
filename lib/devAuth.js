// Development authentication and access control
// This file handles developer-only access to development features

// List of authorized developer user IDs
const AUTHORIZED_DEVELOPERS = [
  'Not Todd Middleton', // Current user ID from the codebase
  'developer1',
  'developer2',
  'admin'
];

// Development access token (in production, this would be more secure)
const DEV_ACCESS_TOKEN = 'dev_access_2024';

// Check if user is authorized for development access
export const isDeveloper = (userId) => {
  return AUTHORIZED_DEVELOPERS.includes(userId);
};

// Check if user has development access token
export const hasDevAccess = (accessToken) => {
  return accessToken === DEV_ACCESS_TOKEN;
};

// Get development access token (for testing purposes)
export const getDevAccessToken = () => {
  return DEV_ACCESS_TOKEN;
};

// Validate development access
export const validateDevAccess = (userId, accessToken = null) => {
  // Check if user is in authorized developers list
  if (isDeveloper(userId)) {
    return true;
  }
  
  // Check if user has valid access token
  if (accessToken && hasDevAccess(accessToken)) {
    return true;
  }
  
  return false;
};

// Development environment check
export const isDevelopmentEnvironment = () => {
  return process.env.NODE_ENV === 'development';
};

// Combined access check for development features
export const canAccessDevFeatures = (userId, accessToken = null) => {
  // In development environment, allow access with proper credentials
  if (isDevelopmentEnvironment()) {
    return validateDevAccess(userId, accessToken);
  }
  
  // In production, only allow authorized developers
  return isDeveloper(userId);
}; 