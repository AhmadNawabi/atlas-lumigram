import { useState, useEffect, useCallback } from 'react';
import { postsService } from '../services/posts.service';
import { favoritesService } from '../services/favorites.service';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './useAuth';
import { Post } from '../types';

export const usePosts = (initialLimit = 10) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const { user } = useAuth();

  const loadPosts = useCallback(async (refresh = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await postsService.getPosts(
        refresh ? null : lastVisible,
        initialLimit
      );
      
      if (refresh) {
        setPosts(result.posts);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error: any) {
      showMessage({
        message: 'Error',
        description: 'Failed to load posts',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [lastVisible, user, initialLimit]);

  const refreshPosts = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(true);
    setRefreshing(false);
  }, [loadPosts]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadPosts();
    }
  }, [hasMore, loading, loadPosts]);

  const toggleFavorite = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const isFavorited = posts.some(p => p.id === postId && p.isFavorited);
      await favoritesService.toggleFavorite(postId, !isFavorited);
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isFavorited: !isFavorited }
          : post
      ));
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to update favorite',
        type: 'danger',
      });
    }
  }, [user, posts]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refreshPosts,
    toggleFavorite,
  };
};
