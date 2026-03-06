import {
  collection,
  query,
  where,
  getDocs,
  doc,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

const FOLLOWERS_COLLECTION = 'followers';

class FollowService {
  async toggleFollow(
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    const batch = writeBatch(db);

    try {
      const followQuery = query(
        collection(db, FOLLOWERS_COLLECTION),
        where('followerId', '==', currentUserId),
        where('followingId', '==', targetUserId)
      );

      const existingFollows = await getDocs(followQuery);
      const isFollowing = !existingFollows.empty;

      const targetProfileRef = doc(db, 'profiles', targetUserId);
      const currentProfileRef = doc(db, 'profiles', currentUserId);

      if (isFollowing) {
        // 🔥 UNFOLLOW

        existingFollows.forEach((document) => {
          batch.delete(document.ref);
        });

        batch.update(targetProfileRef, {
          followersCount: increment(-1),
          updatedAt: Timestamp.now(),
        });

        batch.update(currentProfileRef, {
          followingCount: increment(-1),
          updatedAt: Timestamp.now(),
        });

      } else {
        // 🔥 FOLLOW

        const followRef = doc(collection(db, FOLLOWERS_COLLECTION));

        batch.set(followRef, {
          followerId: currentUserId,
          followingId: targetUserId,
          createdAt: Timestamp.now(),
        });

        batch.update(targetProfileRef, {
          followersCount: increment(1),
          updatedAt: Timestamp.now(),
        });

        batch.update(currentProfileRef, {
          followingCount: increment(1),
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();
      return !isFollowing;

    } catch (error) {
      console.error('Error toggling follow:', error);
      throw new Error('Failed to update follow status');
    }
  }

  async isFollowing(
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    try {
      const followQuery = query(
        collection(db, FOLLOWERS_COLLECTION),
        where('followerId', '==', currentUserId),
        where('followingId', '==', targetUserId)
      );

      const snapshot = await getDocs(followQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
}

export const followService = new FollowService();
