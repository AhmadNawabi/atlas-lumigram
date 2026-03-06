import React, { useCallback } from 'react';
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FeedPost } from '../../components/home/FeedPost';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { createStyles } from '../../utils/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Post } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

export default function FavoritesScreen() {
  const {
    favorites,
    loading,
    refreshing,
    loadMore,
    refreshFavorites,
    removeFavorite,
  } = useFavorites();
  
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme);

  const handleDoubleTap = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      await removeFavorite(postId); // toggle favorite already removes if exists
      showMessage({
        message: 'Removed from favorites',
        type: 'info',
        duration: 1500,
      });
    } catch (error) {
      showMessage({
        message: 'Failed to update favorite',
        type: 'danger',
        duration: 1500,
      });
    }
  }, [removeFavorite, user]);

  const handleLike = useCallback(() => {
    showMessage({
      message: 'Feature coming soon',
      type: 'info',
      duration: 1500,
    });
  }, []);

  const handleLongPress = useCallback((caption: string) => {
    Alert.alert('Caption', caption);
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleComment = useCallback(() => {
    showMessage({
      message: 'Comments coming soon',
      type: 'info',
      duration: 1500,
    });
  }, []);

  const handleShare = useCallback(() => {
    showMessage({
      message: 'Share feature coming soon',
      type: 'info',
      duration: 1500,
    });
  }, []);

  const renderFooter = (): JSX.Element | null => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = (): JSX.Element | null => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon name="heart-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>No favorites yet</Text>
        <Text style={styles.emptySubtext}>
          Double tap on posts to add them to your favorites
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }): JSX.Element => (
    <FeedPost
      post={item}
      onDoubleTap={() => handleDoubleTap(item.id)}
      onLike={handleLike}
      onLongPress={() => handleLongPress(item.caption)}
      onUserPress={() => handleUserPress(item.userId)}
      onComment={handleComment}
      onShare={handleShare}
      currentUserId={user?.uid}
    />
  );

  const keyExtractor = (item: Post): string => item.id;

  if (loading && favorites.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <FlashList
        data={favorites}
        renderItem={renderItem}
        estimatedItemSize={400}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFavorites}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
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
