import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  getCountFromServer,
  DocumentSnapshot,
  limit,
  orderBy,
  startAfter,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Share } from '../types';
import { Platform, Share as RNShare } from 'react-native';
import { postsService } from './posts.service';

const SHARES_COLLECTION = 'shares';
const POSTS_COLLECTION = 'posts';

class ShareService {
  /**
   * Share a post
   */
  async sharePost(
    postId: string,
    userId: string,
    platform: 'internal' | 'external' = 'internal'
  ): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Check if already shared (optional, you might want to allow multiple shares)
      const existingQuery = query(
        collection(db, SHARES_COLLECTION),
        where('postId', '==', postId),
        where('userId', '==', userId),
        where('platform', '==', platform)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log('Post already shared on this platform');
        return;
      }

      // Record share - Create a new document reference properly
      const shareRef = doc(collection(db, SHARES_COLLECTION));
      batch.set(shareRef, {
        postId,
        userId,
        platform,
        createdAt: Timestamp.now(),
      });

      // Increment post shares count
      const postRef = doc(db, POSTS_COLLECTION, postId);
      batch.update(postRef, {
        sharesCount: increment(1),
      });

      await batch.commit();
      console.log('Post shared successfully:', shareRef.id);
    } catch (error) {
      console.error('Error sharing post:', error);
      throw new Error('Failed to share post');
    }
  }

  /**
   * Share externally using native share dialog
   */
  async shareExternally(postImageUrl: string, caption: string): Promise<boolean> {
    try {
      const result = await RNShare.share({
        message: `Check out this post on Lumigram: ${caption}`,
        url: postImageUrl,
        title: 'Lumigram Post',
      });

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing externally:', error);
      throw new Error('Failed to share externally');
    }
  }

  /**
   * Get shares for a post with pagination
   */
  async getPostShares(
    postId: string,
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 20
  ): Promise<{ shares: Share[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      let q = query(
        collection(db, SHARES_COLLECTION),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const shares: Share[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        shares.push({
          id: doc.id,
          postId: data.postId,
          userId: data.userId,
          platform: data.platform,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        shares,
        lastVisible: lastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error getting shares:', error);
      throw error;
    }
  }

  /**
   * Get shares count for a post
   */
  async getSharesCount(postId: string): Promise<number> {
    try {
      const q = query(
        collection(db, SHARES_COLLECTION),
        where('postId', '==', postId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting shares count:', error);
      return 0;
    }
  }

  /**
   * Get user's shared posts
   */
  async getUserSharedPosts(
    userId: string,
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 10
  ): Promise<{ shares: Share[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      let q = query(
        collection(db, SHARES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const shares: Share[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        shares.push({
          id: doc.id,
          postId: data.postId,
          userId: data.userId,
          platform: data.platform,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        shares,
        lastVisible: lastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error getting user shared posts:', error);
      throw error;
    }
  }

  /**
   * Check if user has shared a post
   */
  async hasUserSharedPost(userId: string, postId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, SHARES_COLLECTION),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if user shared post:', error);
      return false;
    }
  }

  /**
   * Get share statistics for a user
   */
  async getUserShareStats(userId: string): Promise<{ total: number; byPlatform: Record<string, number> }> {
    try {
      const q = query(
        collection(db, SHARES_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const byPlatform: Record<string, number> = {};
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const platform = data.platform || 'internal';
        byPlatform[platform] = (byPlatform[platform] || 0) + 1;
        total++;
      });

      return { total, byPlatform };
    } catch (error) {
      console.error('Error getting user share stats:', error);
      return { total: 0, byPlatform: {} };
    }
  }
}

// Helper for increment operation
const increment = (num: number) => ({
  type: 'increment' as const,
  value: num,
});

export const shareService = new ShareService();
