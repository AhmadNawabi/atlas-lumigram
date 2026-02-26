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
import { usePosts } from '../../hooks/usePosts';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Post } from '../../types';

export default function HomeScreen() {
  const {
    posts,
    loading,
    refreshing,
    loadMore,
    refreshPosts,
    toggleFavorite,
  } = usePosts();
  
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleDoubleTap = useCallback((postId: string) => {
    toggleFavorite(postId);
    Alert.alert('Success', 'Added to favorites!');
  }, [toggleFavorite]);

  const handleLongPress = useCallback((caption: string) => {
    Alert.alert('Caption', caption);
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
        <Icon name="images-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share a moment!</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }): JSX.Element => (
    <FeedPost
      post={item}
      onDoubleTap={() => handleDoubleTap(item.id)}
      onLongPress={() => handleLongPress(item.caption)}
    />
  );

  const keyExtractor = (item: Post): string => item.id;

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        renderItem={renderItem}
        estimatedItemSize={400}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPosts}
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
