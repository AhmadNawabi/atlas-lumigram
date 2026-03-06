import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
  writeBatch,
  getCountFromServer,
  DocumentSnapshot,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase';
import { postsService } from './posts.service';
import { Post } from '../types';

const FAVORITES_COLLECTION = 'favorites';
const POSTS_COLLECTION = 'posts';

const increment = (num: number) => ({
  type: 'increment' as const,
  value: num,
});

class FavoritesService {
  async toggleFavorite(userId: string, postId: string, isFavoriting: boolean): Promise<void> {
    const batch = writeBatch(db);

    try {
      if (isFavoriting) {
        const existing = await this.isPostFavorited(userId, postId);
        if (existing) return;

        const favoriteRef = doc(collection(db, FAVORITES_COLLECTION));
        batch.set(favoriteRef, {
          userId,
          postId,
          createdAt: Timestamp.now(),
        });

        const postRef = doc(db, POSTS_COLLECTION, postId);
        batch.update(postRef, { favoritesCount: increment(1) });
      } else {
        const q = query(
          collection(db, FAVORITES_COLLECTION),
          where('userId', '==', userId),
          where('postId', '==', postId)
        );
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => batch.delete(doc.ref));

        const postRef = doc(db, POSTS_COLLECTION, postId);
        batch.update(postRef, { favoritesCount: increment(-1) });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to update favorite. Please try again.');
    }
  }

  async isPostFavorited(userId: string, postId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, FAVORITES_COLLECTION),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async getUserFavorites(
    userId: string,
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 10
  ): Promise<{ favorites: Post[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      let q = query(
        collection(db, FAVORITES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastVisible) q = query(q, startAfter(lastVisible));

      const snapshot = await getDocs(q);
      const favorites: Post[] = [];

      for (const doc of snapshot.docs) {
        const favoriteData = doc.data();
        const post = await postsService.getPost(favoriteData.postId);
        if (post) favorites.push({ ...post, isFavorited: true });
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return { favorites, lastVisible: lastDoc, hasMore };
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  }

  async getPostFromFavorite(postId: string) {
    try {
      const post = await postsService.getPost(postId);
      if (post) return { ...post, isFavorited: true };
      return null;
    } catch (error) {
      console.error('Error fetching post from favorite:', error);
      return null;
    }
  }

  async getPostFavoritesCount(postId: string): Promise<number> {
    try {
      const q = query(collection(db, FAVORITES_COLLECTION), where('postId', '==', postId));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting post favorites count:', error);
      return 0;
    }
  }
}

export const favoritesService = new FavoritesService();
