import { db } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { validateUsername, checkUsernameAvailability, sanitizeUsername } from './usernameValidation';

// User registration service
export class UserRegistrationService {
  
  // Create a new user profile
  static async createUserProfile(userData) {
    try {
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
      const userProfile = {
        uid: uid,
        username: sanitizedUsername,
        email: email || null,
        countryCode: countryCode,
        displayName: displayName || sanitizedUsername,
        createdAt: createdAt,
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
      
      console.log('User profile created successfully:', sanitizedUsername);
      
      return {
        success: true,
        userProfile: userProfile,
        message: 'User profile created successfully'
      };
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create user profile'
      };
    }
  }
  
  // Get user profile by UID
  static async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return {
          success: true,
          userProfile: userDoc.data()
        };
      } else {
        return {
          success: false,
          error: 'User profile not found'
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update user profile
  static async updateUserProfile(uid, updates) {
    try {
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
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Check if user has completed profile setup
  static async isProfileComplete(uid) {
    try {
      const result = await this.getUserProfile(uid);
      if (result.success) {
        return result.userProfile.profileComplete || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }
  
  // Get user by username
  static async getUserByUsername(username) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          success: true,
          userProfile: userDoc.data()
        };
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
    } catch (error) {
      console.error('Error getting user by username:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Delete user profile (for admin use)
  static async deleteUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isActive: false, updatedAt: new Date() }, { merge: true });
      
      return {
        success: true,
        message: 'User profile deactivated successfully'
      };
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 