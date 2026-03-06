import { useState, useEffect, useCallback } from 'react';
import { postsService } from '../services/posts.service';
import { favoritesService } from '../services/favorites.service';
import { likeService } from '../services/like.service';
import { commentService } from '../services/comment.service';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './useAuth';
import { Post } from '../types';
import { sanitizePosts, ensureNumber } from '../utils/sanitize';

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
      
      // SANITIZE: Ensure all posts have number fields, not objects
      const sanitizedPosts = sanitizePosts(result.posts);
      
      // Check which posts are favorited and liked
      const postsWithStatus = await Promise.all(
        sanitizedPosts.map(async (post) => {
          try {
            const [isFavorited, isLiked] = await Promise.all([
              favoritesService.isPostFavorited(user.uid, post.id),
              likeService.isLiked(user.uid, post.id)
            ]);
            return { 
              ...post, 
              isFavorited,
              isLiked,
            };
          } catch (error) {
            console.error('Error checking post status:', error);
            return { 
              ...post, 
              isFavorited: false,
              isLiked: false,
            };
          }
        })
      );
      
      if (refresh) {
        setPosts(postsWithStatus);
      } else {
        setPosts(prev => [...prev, ...postsWithStatus]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to load posts',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [user, lastVisible, initialLimit]);

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
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const newFavoriteStatus = !post.isFavorited;
      
      // Update UI immediately
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isFavorited: newFavoriteStatus }
          : p
      ));
      
      await favoritesService.toggleFavorite(user.uid, postId, newFavoriteStatus);
      
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isFavorited: !p.isFavorited }
          : p
      ));
      throw error;
    }
  }, [user, posts]);

  const toggleLike = useCallback(async (postId: string, isLiking: boolean) => {
    if (!user) return;
    
    let originalPost: Post | null = null;
    
    try {
      const foundPost = posts.find(p => p.id === postId);
      if (!foundPost) return;
      
      originalPost = { ...foundPost };
      
      // Update UI immediately with safe number operations
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const currentLikes = ensureNumber(p.likesCount);
          return { 
            ...p, 
            isLiked: isLiking,
            likesCount: isLiking ? currentLikes + 1 : Math.max(0, currentLikes - 1)
          };
        }
        return p;
      }));
      
      await likeService.toggleLike(user.uid, postId, isLiking);
      
    } catch (error) {
      if (originalPost) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? originalPost! : p
        ));
      }
      console.error('Error toggling like:', error);
      throw error;
    }
  }, [user, posts]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      await commentService.addComment(postId, user.uid, user.email || '', content.trim());
      
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, commentsCount: ensureNumber(p.commentsCount) + 1 }
          : p
      ));
      
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      await postsService.deletePost(postId, post.imageUrl, user.uid);
      
    } catch (error) {
      await loadPosts(true);
      throw error;
    }
  }, [user, posts, loadPosts]);

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
    toggleLike,
    addComment,
    deletePost,
  };
};
