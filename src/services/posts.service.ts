import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  getCountFromServer,
  writeBatch,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Post, CreatePostData } from '../types';
import { profileService } from './profile.service';

const POSTS_COLLECTION = 'posts';

class PostsService {
  /**
   * Create a new post - This will show on home and profile automatically
   */
  async createPost(data: CreatePostData): Promise<string> {
    try {
      const batch = writeBatch(db);
      
      // Get user profile for username and profile image
      const userProfile = await profileService.getUserProfile(data.userId);
      
      const postData = {
        imageUrl: data.imageUrl,
        caption: data.caption,
        userId: data.userId,
        userEmail: data.userEmail,
        username: userProfile.username || data.userEmail.split('@')[0],
        userProfileImage: userProfile.profileImage || null,
        createdAt: Timestamp.fromDate(data.createdAt),
        updatedAt: Timestamp.now(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      };

      // Create post document
      const postRef = doc(collection(db, POSTS_COLLECTION));
      batch.set(postRef, postData);
      
      // Update user's post count in profile
      const userProfileRef = doc(db, 'profiles', data.userId);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        const currentPosts = userProfileSnap.data()?.postsCount || 0;
        batch.update(userProfileRef, {
          postsCount: currentPosts + 1,
          updatedAt: Timestamp.now(),
        });
      }
      
      await batch.commit();
      
      console.log('Post created successfully:', postRef.id);
      return postRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post. Please try again.');
    }
  }

  /**
   * Get posts for home feed (all posts chronologically)
   */
  async getPosts(
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 10
  ): Promise<{ posts: Post[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      ];

      if (lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      const q = query(collection(db, POSTS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const posts: Post[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // IMPORTANT: Extract raw values and ensure they're numbers
        const rawLikesCount = data.likesCount;
        const rawCommentsCount = data.commentsCount;
        const rawSharesCount = data.sharesCount;
        
        // Log if we find increment objects in Firestore (shouldn't happen, but just in case)
        if (rawLikesCount && typeof rawLikesCount === 'object') {
          console.warn(`⚠️ Found increment object in Firestore for post ${doc.id}.likesCount`);
        }
        
        posts.push({
          id: doc.id,
          imageUrl: data.imageUrl || '',
          caption: data.caption || '',
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          username: data.username || data.userEmail?.split('@')[0] || '',
          userProfileImage: data.userProfileImage || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          // Ensure these are numbers, not objects
          likesCount: typeof rawLikesCount === 'number' ? rawLikesCount : 0,
          commentsCount: typeof rawCommentsCount === 'number' ? rawCommentsCount : 0,
          sharesCount: typeof rawSharesCount === 'number' ? rawSharesCount : 0,
          isFavorited: false,
          isLiked: false,
        });
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        posts,
        lastVisible: lastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error getting posts:', error);
      throw new Error('Failed to load posts. Please check your connection.');
    }
  }

  /**
   * Get posts by user ID for profile
   */
  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const posts: Post[] = [];

      snapshot.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          imageUrl: data.imageUrl || '',
          caption: data.caption || '',
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          username: data.username || data.userEmail?.split('@')[0] || '',
          userProfileImage: data.userProfileImage || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
          sharesCount: data.sharesCount || 0,
          isFavorited: false,
          isLiked: false,
        });
      });

      return posts;
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  /**
   * Get single post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    try {
      const docRef = doc(db, POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        imageUrl: data.imageUrl || '',
        caption: data.caption || '',
        userId: data.userId || '',
        userEmail: data.userEmail || '',
        username: data.username || data.userEmail?.split('@')[0] || '',
        userProfileImage: data.userProfileImage || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
        sharesCount: data.sharesCount || 0,
        isFavorited: false,
        isLiked: false,
      };
    } catch (error) {
      console.error('Error getting post:', error);
      return null;
    }
  }

  /**
   * Update post
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    try {
      const docRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update post.');
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, imageUrl: string, userId: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, POSTS_COLLECTION, postId));

      // Delete from Storage
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError);
      }

      // Decrement user's post count
      const userRef = doc(db, 'profiles', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentPosts = userSnap.data()?.postsCount || 0;
        await updateDoc(userRef, {
          postsCount: Math.max(0, currentPosts - 1),
          updatedAt: Timestamp.now(),
        });
      }

      console.log('Post deleted successfully:', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post.');
    }
  }

  /**
   * Get post count for a user
   */
  async getUserPostCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting post count:', error);
      return 0;
    }
  }

  /**
   * Increment likes count
   */
  async incrementLikesCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        likesCount: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing likes count:', error);
    }
  }

  /**
   * Decrement likes count
   */
  async decrementLikesCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        likesCount: increment(-1),
      });
    } catch (error) {
      console.error('Error decrementing likes count:', error);
    }
  }

  /**
   * Increment comments count
   */
  async incrementCommentsCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing comments count:', error);
    }
  }

  /**
   * Decrement comments count
   */
  async decrementCommentsCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1),
      });
    } catch (error) {
      console.error('Error decrementing comments count:', error);
    }
  }

  /**
   * Increment shares count
   */
  async incrementSharesCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        sharesCount: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing shares count:', error);
    }
  }
}

// Helper for increment operation
const increment = (num: number) => ({
  type: 'increment' as const,
  value: num,
});

export const postsService = new PostsService();
