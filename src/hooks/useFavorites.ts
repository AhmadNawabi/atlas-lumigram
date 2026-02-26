import { useState, useEffect, useCallback } from 'react';
import { favoritesService } from '../services/favorites.service';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './useAuth';
import { Post } from '../types';

export const useFavorites = (initialLimit = 10) => {
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const { user } = useAuth();

  const loadFavorites = useCallback(async (refresh = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await favoritesService.getUserFavorites(
        user.uid,
        refresh ? null : lastVisible,
        initialLimit
      );
      
      if (refresh) {
        setFavorites(result.favorites);
      } else {
        setFavorites(prev => [...prev, ...result.favorites]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error: any) {
      showMessage({
        message: 'Error',
        description: 'Failed to load favorites',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [user, lastVisible, initialLimit]);

  const refreshFavorites = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites(true);
    setRefreshing(false);
  }, [loadFavorites]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadFavorites();
    }
  }, [hasMore, loading, loadFavorites]);

  const removeFavorite = useCallback(async (postId: string) => {
    try {
      await favoritesService.toggleFavorite(postId, false);
      setFavorites(prev => prev.filter(fav => fav.id !== postId));
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to remove favorite',
        type: 'danger',
      });
    }
  }, []);

  useEffect(() => {
    loadFavorites(true);
  }, []);

  return {
    favorites,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refreshFavorites,
    removeFavorite,
  };
};
