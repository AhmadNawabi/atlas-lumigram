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

  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth } from './firebase';

const PROFILES_COLLECTION = 'profiles';
const USERS_COLLECTION = 'users';

class ProfileService {
  /**
   
  * Create a new user profile
   */
  
  async createProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const now = Timestamp.now();

      const profileData = {
        id: userId,
        ...data,
        profileImage: data.profileImage || null,
        bio: data.bio || '',
        createdAt: now,
        updatedAt: now,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        stats: { posts: 0, followers: 0, following: 0 },
      };

      await setDoc(doc(db, PROFILES_COLLECTION, userId), profileData);
      await setDoc(doc(db, USERS_COLLECTION, userId), profileData);
      console.log('Profile created for user:', userId);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      let profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const userRef = doc(db, USERS_COLLECTION, userId);
        profileSnap = await getDoc(userRef);
      }

      if (!profileSnap.exists()) return await this.createDefaultProfile(userId);

      const data = profileSnap.data();

      return {
        id: profileSnap.id,
        email: data.email || '',
        username: data.username || data.displayName || `user_${userId.slice(0, 6)}`,
        displayName: data.displayName || data.username || `user_${userId.slice(0, 6)}`,
        profileImage: data.profileImage || null,
        bio: data.bio || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        stats: data.stats || { posts: 0, followers: 0, following: 0 },
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return this.createDefaultProfile(userId);
    }
  }

  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      id: userId,
      email: '',
      username: `user_${userId.slice(0, 6)}`,
      displayName: `user_${userId.slice(0, 6)}`,
      profileImage: null,
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      stats: { posts: 0, followers: 0, following: 0 },
    };

    await setDoc(doc(db, PROFILES_COLLECTION, userId), {
      ...defaultProfile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return defaultProfile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      const userRef = doc(db, USERS_COLLECTION, userId);

      const cleanedUpdates: Record<string, any> = { updatedAt: Timestamp.now() };
      if (updates.username !== undefined) {
        cleanedUpdates.username = updates.username;
        cleanedUpdates.displayName = updates.username;
      }
      if (updates.displayName !== undefined) cleanedUpdates.displayName = updates.displayName;
      if (updates.profileImage !== undefined) cleanedUpdates.profileImage = updates.profileImage;
      if (updates.bio !== undefined) cleanedUpdates.bio = updates.bio;
      if (updates.stats !== undefined) cleanedUpdates.stats = updates.stats;

      await updateDoc(profileRef, cleanedUpdates);
      await updateDoc(userRef, cleanedUpdates);

      const user = auth.currentUser;
      if (user && updates.displayName) {
        await updateFirebaseProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.profileImage || null,
        });
      }

      console.log('Profile updated for user:', userId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Search users by username OR email
   */
  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    try {
      if (!searchTerm?.trim()) return [];

      const term = searchTerm.trim().toLowerCase();

      const usernameQuery = query(
        collection(db, PROFILES_COLLECTION),
        where('username', '>=', term),
        where('username', '<=', term + '\uf8ff'),
        orderBy('username'),
        limit(20)
      );

      const emailQuery = query(
        collection(db, PROFILES_COLLECTION),
        where('email', '>=', term),
        where('email', '<=', term + '\uf8ff'),
        orderBy('email'),
        limit(20)
      );

      const [usernameSnap, emailSnap] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(emailQuery),
      ]);

      const users: UserProfile[] = [];

      usernameSnap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          email: data.email || '',
          username: data.username || '',
          displayName: data.displayName || data.username || '',
          profileImage: data.profileImage || null,
          bio: data.bio || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          postsCount: data.postsCount || 0,
          stats: data.stats || { posts: 0, followers: 0, following: 0 },
        });
      });

      emailSnap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        // Avoid duplicates
        if (!users.find(u => u.id === doc.id)) {
          users.push({
            id: doc.id,
            email: data.email || '',
            username: data.username || '',
            displayName: data.displayName || data.username || '',
            profileImage: data.profileImage || null,
            bio: data.bio || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            postsCount: data.postsCount || 0,
            stats: data.stats || { posts: 0, followers: 0, following: 0 },
          });
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}

export const profileService = new ProfileService();
