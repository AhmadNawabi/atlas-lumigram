import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { postsService } from './posts.service';
import { Post } from '../types';

const FAVORITES_COLLECTION = 'favorites';

class FavoritesService {
  async toggleFavorite(postId: string, isFavoriting: boolean): Promise<void> {
    const batch = writeBatch(db);

    if (isFavoriting) {
      // Add to favorites
      const favoriteRef = doc(collection(db, FAVORITES_COLLECTION));
      batch.set(favoriteRef, {
        postId,
        createdAt: Timestamp.now(),
      });

      // Increment post favorites count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        favoritesCount: increment(1),
      });
    } else {
      // Remove from favorites
      const q = query(
        collection(db, FAVORITES_COLLECTION),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Decrement post favorites count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        favoritesCount: increment(-1),
      });
    }

    await batch.commit();
  }

  async getUserFavorites(
    userId: string,
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 10
  ): Promise<{ favorites: Post[]; lastVisible: DocumentSnapshot; hasMore: boolean }> {
    let q = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const favorites: Post[] = [];

    for (const doc of snapshot.docs) {
      const favoriteData = doc.data();
      const post = await postsService.getPost(favoriteData.postId);
      if (post) {
        favorites.push(post);
      }
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === pageSize;

    return {
      favorites,
      lastVisible: lastDoc,
      hasMore,
    };
  }

  async isPostFavorited(postId: string): Promise<boolean> {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}

const increment = (num: number) => {
  return {
    type: 'increment',
    value: num,
  };
};

export const favoritesService = new FavoritesService();
