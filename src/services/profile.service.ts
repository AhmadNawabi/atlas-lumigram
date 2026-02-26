import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  limit,
  orderBy,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

const PROFILES_COLLECTION = 'profiles';

class ProfileService {
  /**
   * Create a new user profile
   * @param userId - User ID from Firebase Auth
   * @param data - Initial profile data
   */
  async createProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const now = Timestamp.now();
      
      const profileData = {
        ...data,
        id: userId,
        createdAt: now,
        updatedAt: now,
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
      };

      await setDoc(profileRef, profileData);
      console.log('Profile created successfully for user:', userId);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns UserProfile object
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        // Create default profile if it doesn't exist
        console.log('Profile not found, creating default for user:', userId);
        
        const defaultProfile: Partial<UserProfile> = {
          id: userId,
          email: '',
          username: `user_${userId.slice(0, 6)}`,
          profileImage: null,
          bio: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          stats: {
            posts: 0,
            followers: 0,
            following: 0,
          },
        };
        
        await this.createProfile(userId, defaultProfile);
        
        // Return the newly created profile
        return {
          id: userId,
          email: '',
          username: `user_${userId.slice(0, 6)}`,
          profileImage: null,
          bio: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          stats: {
            posts: 0,
            followers: 0,
            following: 0,
          },
        };
      }

      const data = profileSnap.data();
      
      // Convert Firestore timestamps to Date objects
      const profile: UserProfile = {
        id: profileSnap.id,
        email: data.email || '',
        username: data.username || `user_${userId.slice(0, 6)}`,
        profileImage: data.profileImage || null,
        bio: data.bio || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        stats: data.stats || {
          posts: 0,
          followers: 0,
          following: 0,
        },
      };

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param updates - Partial profile updates
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      
      // Remove undefined values and convert dates to timestamps
      const cleanedUpdates: Record<string, any> = {
        updatedAt: Timestamp.now(),
      };

      if (updates.username !== undefined) {
        cleanedUpdates.username = updates.username;
      }
      if (updates.profileImage !== undefined) {
        cleanedUpdates.profileImage = updates.profileImage;
      }
      if (updates.bio !== undefined) {
        cleanedUpdates.bio = updates.bio;
      }
      if (updates.email !== undefined) {
        cleanedUpdates.email = updates.email;
      }
      if (updates.stats !== undefined) {
        cleanedUpdates.stats = updates.stats;
      }

      await updateDoc(profileRef, cleanedUpdates);
      console.log('Profile updated successfully for user:', userId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Search for users by username
   * @param searchTerm - Username search term
   * @returns Array of matching user profiles
   */
  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return [];
      }

      const trimmedSearch = searchTerm.trim().toLowerCase();
      
      // Query for usernames that start with the search term
      const q = query(
        collection(db, PROFILES_COLLECTION),
        where('username', '>=', trimmedSearch),
        where('username', '<=', trimmedSearch + '\uf8ff'),
        orderBy('username'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const users: UserProfile[] = [];

      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          email: data.email || '',
          username: data.username || '',
          profileImage: data.profileImage || null,
          bio: data.bio || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          stats: data.stats || {
            posts: 0,
            followers: 0,
            following: 0,
          },
        });
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Delete user profile
   * @param userId - User ID
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      await deleteDoc(profileRef);
      console.log('Profile deleted successfully for user:', userId);
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete profile');
    }
  }

  /**
   * Increment user's post count
   * @param userId - User ID
   */
  async incrementPostCount(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const profile = await this.getUserProfile(userId);
      
      const currentPosts = profile.stats?.posts || 0;
      
      await updateDoc(profileRef, {
        'stats.posts': currentPosts + 1,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error incrementing post count:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Decrement user's post count
   * @param userId - User ID
   */
  async decrementPostCount(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const profile = await this.getUserProfile(userId);
      
      const currentPosts = profile.stats?.posts || 0;
      const newCount = Math.max(0, currentPosts - 1);
      
      await updateDoc(profileRef, {
        'stats.posts': newCount,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error decrementing post count:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Update follower count
   * @param userId - User ID
   * @param increment - Whether to increment (true) or decrement (false)
   */
  async updateFollowerCount(userId: string, increment: boolean): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const profile = await this.getUserProfile(userId);
      
      const currentFollowers = profile.stats?.followers || 0;
      const newCount = increment ? currentFollowers + 1 : Math.max(0, currentFollowers - 1);
      
      await updateDoc(profileRef, {
        'stats.followers': newCount,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating follower count:', error);
    }
  }

  /**
   * Update following count
   * @param userId - User ID
   * @param increment - Whether to increment (true) or decrement (false)
   */
  async updateFollowingCount(userId: string, increment: boolean): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const profile = await this.getUserProfile(userId);
      
      const currentFollowing = profile.stats?.following || 0;
      const newCount = increment ? currentFollowing + 1 : Math.max(0, currentFollowing - 1);
      
      await updateDoc(profileRef, {
        'stats.following': newCount,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating following count:', error);
    }
  }

  /**
   * Check if a username is available
   * @param username - Username to check
   * @returns boolean indicating if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      if (!username || username.length < 3) {
        return false;
      }

      const q = query(
        collection(db, PROFILES_COLLECTION),
        where('username', '==', username)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
