import {
  collection,
  addDoc,
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
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment } from '../types';
import { profileService } from './profile.service';

const COMMENTS_COLLECTION = 'comments';
const POSTS_COLLECTION = 'posts';

class CommentService {
  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    userEmail: string,
    content: string
  ): Promise<string> {
    const batch = writeBatch(db);

    try {
      // Get user profile for username and image
      const userProfile = await profileService.getUserProfile(userId);

      // Create comment
      const commentRef = doc(collection(db, COMMENTS_COLLECTION));
      const commentData = {
        postId,
        userId,
        userEmail,
        username: userProfile.username,
        userProfileImage: userProfile.profileImage,
        content: content.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        likesCount: 0,
      };

      batch.set(commentRef, commentData);

      // Increment post comments count
      const postRef = doc(db, POSTS_COLLECTION, postId);
      batch.update(postRef, {
        commentsCount: increment(1),
      });

      await batch.commit();

      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comments for a post with pagination
   */
  async getPostComments(
    postId: string,
    lastVisible: DocumentSnapshot | null = null,
    pageSize: number = 20
  ): Promise<{ comments: Comment[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    try {
      let q = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const comments: Comment[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        comments.push({
          id: doc.id,
          postId: data.postId,
          userId: data.userId,
          userEmail: data.userEmail,
          username: data.username,
          userProfileImage: data.userProfileImage,
          content: data.content,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          likesCount: data.likesCount || 0,
        });
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        comments,
        lastVisible: lastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
      await updateDoc(commentRef, {
        content: content.trim(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, postId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Delete comment
      const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
      batch.delete(commentRef);

      // Decrement post comments count
      const postRef = doc(db, POSTS_COLLECTION, postId);
      batch.update(postRef, {
        commentsCount: increment(-1),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Get comments count for a post
   */
  async getCommentsCount(postId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting comments count:', error);
      return 0;
    }
  }

  /**
   * Like or unlike a comment
   */
  async toggleCommentLike(userId: string, commentId: string, isLiking: boolean): Promise<void> {
    const batch = writeBatch(db);

    try {
      const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
      
      if (isLiking) {
        batch.update(commentRef, {
          likesCount: increment(1),
        });
      } else {
        batch.update(commentRef, {
          likesCount: increment(-1),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw new Error('Failed to update comment like');
    }
  }
}

// Helper for increment operation
const increment = (num: number) => ({
  type: 'increment' as const,
  value: num,
});

export const commentService = new CommentService();
