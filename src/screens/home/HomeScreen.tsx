import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FeedPost } from '../../components/home/FeedPost';
import { usePosts } from '../../hooks/usePosts';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { createStyles } from '../../utils/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Post } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const {
    posts,
    loading,
    refreshing,
    loadMore,
    refreshPosts,
    toggleFavorite,
    toggleLike,
    addComment,
    deletePost,
  } = usePosts();
  
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme);
  const [showStoryBar, setShowStoryBar] = useState(true);

  const handleDoubleTap = useCallback((postId: string) => {
    toggleFavorite(postId);
  }, [toggleFavorite]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
    await toggleLike(postId, !isLiked);
  }, [user, toggleLike]);

  const handleLongPress = useCallback((caption: string) => {
    Alert.alert('Caption', caption);
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleComment = useCallback((postId: string) => {
    Alert.prompt(
      'Add Comment',
      'Write your comment',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Post',
          onPress: async (comment) => {
            if (comment && comment.trim() && user) {
              try {
                await addComment(postId, comment.trim());
                showMessage({
                  message: 'Comment added!',
                  type: 'success',
                  duration: 1500,
                });
              } catch (error) {
                showMessage({
                  message: 'Error',
                  description: 'Failed to add comment',
                  type: 'danger',
                });
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [user, addComment]);

  const handleShare = useCallback((post: Post) => {
    Alert.alert(
      'Share Post',
      'How would you like to share?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Link', onPress: () => {
          showMessage({
            message: 'Link copied to clipboard',
            type: 'success',
            duration: 1500,
          });
        }},
        { text: 'Share via...', onPress: () => {
          showMessage({
            message: 'Share feature coming soon',
            type: 'info',
            duration: 1500,
          });
        }},
      ]
    );
  }, []);

  const handleDeletePost = useCallback((postId: string, userId: string) => {
    if (user?.uid !== userId) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              showMessage({
                message: 'Post deleted',
                type: 'success',
                duration: 1500,
              });
            } catch (error) {
              showMessage({
                message: 'Error',
                description: 'Failed to delete post',
                type: 'danger',
              });
            }
          }
        },
      ]
    );
  }, [user, deletePost]);

  const renderHeader = () => (
    <View style={styles.storiesContainer}>
      <LinearGradient
        colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyGradient}
      >
        <TouchableOpacity style={styles.storyAvatar}>
          {userProfile?.profileImage ? (
            <Image source={{ uri: userProfile.profileImage }} style={styles.storyImage} />
          ) : (
            <View style={[styles.storyImage, styles.storyPlaceholder]}>
              <Icon name="person" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
      <Text style={[styles.storyText, { color: theme.colors.text }]}>Your Story</Text>
    </View>
  );

  const renderFooter = (): JSX.Element | null => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading more posts...
        </Text>
      </View>
    );
  };

  const renderEmpty = (): JSX.Element | null => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon name="images-outline" size={80} color={theme.colors.primary} />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          Be the first to share a moment with the community!
        </Text>
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => navigation.navigate('AddPost')}
        >
          <Text style={styles.createPostButtonText}>Create Your First Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }): JSX.Element => (
    <FeedPost
      post={item}
      onDoubleTap={() => handleDoubleTap(item.id)}
      onLike={() => handleLike(item.id, item.isLiked || false)}
      onLongPress={() => handleLongPress(item.caption)}
      onUserPress={() => handleUserPress(item.userId)}
      onComment={() => handleComment(item.id)}
      onShare={() => handleShare(item)}
      onDelete={() => handleDeletePost(item.id, item.userId)}
      currentUserId={user?.uid}
    />
  );

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Loading your feed...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <FlashList
        data={posts}
        renderItem={renderItem}
        estimatedItemSize={500}
        keyExtractor={(item: Post) => item.id}
        ListHeaderComponent={showStoryBar ? renderHeader : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPosts}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            title="Pull to refresh"
            titleColor={theme.colors.textSecondary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
