import {
  collection,
  query,
  where,
  getDocs,
  doc,
  Timestamp,
  writeBatch,
  getCountFromServer,
  DocumentSnapshot,
  limit,
  orderBy,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase';

const LIKES_COLLECTION = 'likes';
const POSTS_COLLECTION = 'posts';

// Helper for increment - ONLY used in Firestore operations, NEVER returned to UI
const increment = (num: number) => ({
  type: 'increment' as const,
  value: num,
});

class LikeService {
  /**
   * Like or unlike a post
   */
  async toggleLike(userId: string, postId: string, isLiking: boolean): Promise<void> {
    const batch = writeBatch(db);

    try {
      if (isLiking) {
        // Check if already liked
        const existing = await this.isLiked(userId, postId);
        if (existing) {
          console.log('Post already liked');
          return;
        }

        // Add like
        const likeRef = doc(collection(db, LIKES_COLLECTION));
        batch.set(likeRef, {
          userId,
          postId,
          createdAt: Timestamp.now(),
        });

        // Increment post likes count - using increment helper (this is fine, it's in a batch.update)
        const postRef = doc(db, POSTS_COLLECTION, postId);
        batch.update(postRef, {
          likesCount: increment(1),
        });
      } else {
        // Remove like
        const q = query(
          collection(db, LIKES_COLLECTION),
          where('userId', '==', userId),
          where('postId', '==', postId)
        );
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Decrement post likes count
        const postRef = doc(db, POSTS_COLLECTION, postId);
        batch.update(postRef, {
          likesCount: increment(-1),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error('Failed to update like');
    }
  }

  /**
   * Check if user liked a post
   */
  async isLiked(userId: string, postId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, LIKES_COLLECTION),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  /**
   * Get likes count for a post (returns a number, NOT an increment object)
   */
  async getLikesCount(postId: string): Promise<number> {
    try {
      const q = query(
        collection(db, LIKES_COLLECTION),
        where('postId', '==', postId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }
  }
}

export const likeService = new LikeService();
