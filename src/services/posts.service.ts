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
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Post, CreatePostData } from '../types';

const POSTS_COLLECTION = 'posts';

class PostsService {
  async createPost(data: CreatePostData): Promise<string> {
    const postData = {
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt),
      favoritesCount: 0,
      commentsCount: 0,
    };

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    return docRef.id;
  }

  async getPosts(
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 10
  ): Promise<{ posts: Post[]; lastVisible: DocumentSnapshot; hasMore: boolean }> {
    let q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const posts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Post);
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === pageSize;

    return {
      posts,
      lastVisible: lastDoc,
      hasMore,
    };
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const posts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Post);
    });

    return posts;
  }

  async getPost(postId: string): Promise<Post | null> {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Post;
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(docRef, updates);
  }

  async deletePost(postId: string, imageUrl: string): Promise<void> {
    // Delete from Firestore
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));

    // Delete from Storage
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  async incrementFavoriteCount(postId: string): Promise<void> {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(docRef, {
      favoritesCount: increment(1),
    });
  }

  async decrementFavoriteCount(postId: string): Promise<void> {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(docRef, {
      favoritesCount: increment(-1),
    });
  }
}

// Helper for increment
const increment = (num: number) => {
  return {
    type: 'increment',
    value: num,
  };
};

export const postsService = new PostsService();
