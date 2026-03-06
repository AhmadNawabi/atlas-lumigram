import { useState, useEffect, useCallback } from 'react';
import { favoritesService } from '../services/favorites.service';
import { Post } from '../types';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 10;

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (!user) return;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { favorites: newFavorites, lastVisible: lastDoc, hasMore: more } =
        await favoritesService.getUserFavorites(user.uid, isRefresh ? null : lastVisible, PAGE_SIZE);

      setFavorites(prev => (isRefresh ? newFavorites : [...prev, ...newFavorites]));
      setLastVisible(lastDoc);
      setHasMore(more);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, lastVisible]);

  useEffect(() => {
    fetchFavorites(true);
  }, [fetchFavorites]);

  const refreshFavorites = useCallback(async () => {
    setLastVisible(null);
    await fetchFavorites(true);
  }, [fetchFavorites]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchFavorites(false);
  }, [hasMore, loading, fetchFavorites]);

  const removeFavorite = useCallback(async (postId: string) => {
    if (!user) return;
    try {
      await favoritesService.toggleFavorite(user.uid, postId, false);
      setFavorites(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }, [user]);

  return {
    favorites,
    loading,
    refreshing,
    refreshFavorites,
    loadMore,
    removeFavorite,
  };
};
