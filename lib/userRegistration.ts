/**
 * User Registration Service
 * 
 * Provides user profile management functionality.
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { validateUsername, checkUsernameAvailability, sanitizeUsername } from './usernameValidation';
import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[UserRegistration]');

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfileData {
  uid: string;
  username: string;
  email?: string | null;
  countryCode?: string;
  displayName?: string;
  createdAt?: Date;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  countryCode: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  profileComplete: boolean;
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;
  bestFinish: null;
  lastLogin: Date;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
    borderColor: string;
  };
}

export interface CreateUserProfileResult {
  success: boolean;
  userProfile?: UserProfile;
  message?: string;
  error?: string;
}

export interface GetUserProfileResult {
  success: boolean;
  userProfile?: UserProfile;
  error?: string;
}

export interface UpdateUserProfileResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UserProfileUpdates {
  username?: string;
  email?: string;
  displayName?: string;
  countryCode?: string;
  [key: string]: unknown;
}

// ============================================================================
// USER REGISTRATION SERVICE
// ============================================================================

// User registration service
export class UserRegistrationService {
  
  /**
   * Create a new user profile
   */
  static async createUserProfile(userData: UserProfileData): Promise<CreateUserProfileResult> {
    try {
      if (!db) {
        return {
          success: false,
          error: 'Database not available',
          message: 'Failed to create user profile'
        };
      }

      const {
        uid,
        username,
        email,
        countryCode = 'US',
        displayName,
        createdAt = new Date()
      } = userData;
      
      // Validate username
      const validation = validateUsername(username, countryCode);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Check username availability
      const availability = await checkUsernameAvailability(username);
      if (!availability.isAvailable) {
        throw new Error(availability.message);
      }
      
      // Sanitize username
      const sanitizedUsername = sanitizeUsername(username);
      
      // Create user profile document
      const userProfile: UserProfile = {
        uid: uid,
        username: sanitizedUsername,
        email: email || null,
        countryCode: countryCode,
        displayName: displayName || sanitizedUsername,
        createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
        updatedAt: new Date(),
        isActive: true,
        profileComplete: true,
        // Additional user stats (initialize to 0)
        tournamentsEntered: 0,
        tournamentsWon: 0,
        totalWinnings: 0,
        bestFinish: null,
        lastLogin: new Date(),
        // Profile settings
        preferences: {
          notifications: true,
          emailUpdates: true,
          publicProfile: true,
          borderColor: '#4285F4' // Default navbar blue
        }
      };
      
      // Save to Firestore
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, userProfile);

      logger.info('User profile created successfully', { username: sanitizedUsername });

      return {
        success: true,
        userProfile: userProfile,
        message: 'User profile created successfully'
      };
      
    } catch (error) {
      logger.error('Error creating user profile', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to create user profile'
      };
    }
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<GetUserProfileResult> {
    try {
      if (!db) {
        return {
          success: false,
          error: 'Database not available'
        };
      }

      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return {
          success: true,
          userProfile: userDoc.data() as UserProfile
        };
      } else {
        return {
          success: false,
          error: 'User profile not found'
        };
      }
    } catch (error) {
      logger.error('Error getting user profile', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    uid: string,
    updates: UserProfileUpdates
  ): Promise<UpdateUserProfileResult> {
    try {
      if (!db) {
        return {
          success: false,
          error: 'Database not available'
        };
      }

      const userRef = doc(db, 'users', uid);
      
      // If username is being updated, validate it
      if (updates.username) {
        const currentProfile = await this.getUserProfile(uid);
        const countryCode = currentProfile.userProfile?.countryCode || 'US';
        
        const validation = validateUsername(updates.username, countryCode);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        
        // Check if new username is different from current
        if (currentProfile.userProfile?.username !== updates.username) {
          const availability = await checkUsernameAvailability(updates.username);
          if (!availability.isAvailable) {
            throw new Error(availability.message);
          }
        }
        
        // Sanitize username
        updates.username = sanitizeUsername(updates.username);
      }
      
      // Add updated timestamp
      updates.updatedAt = new Date();
      
      await setDoc(userRef, updates, { merge: true });
      
      return {
        success: true,
        message: 'User profile updated successfully'
      };

    } catch (error) {
      logger.error('Error updating user profile', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if user has completed profile setup
   */
  static async isProfileComplete(uid: string): Promise<boolean> {
    try {
      const result = await this.getUserProfile(uid);
      if (result.success && result.userProfile) {
        return result.userProfile.profileComplete || false;
      }
      return false;
    } catch (error) {
      logger.error('Error checking profile completion', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<GetUserProfileResult> {
    try {
      if (!db) {
        return {
          success: false,
          error: 'Database not available'
        };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          success: true,
          userProfile: userDoc.data() as UserProfile
        };
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
    } catch (error) {
      logger.error('Error getting user by username', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Delete user profile (for admin use)
   */
  static async deleteUserProfile(uid: string): Promise<UpdateUserProfileResult> {
    try {
      if (!db) {
        return {
          success: false,
          error: 'Database not available'
        };
      }

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isActive: false, updatedAt: new Date() }, { merge: true });
      
      return {
        success: true,
        message: 'User profile deactivated successfully'
      };
    } catch (error) {
      logger.error('Error deleting user profile', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
