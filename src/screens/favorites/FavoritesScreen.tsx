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
import { createStyles } from '../../utils/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Post } from '../../types';

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
  const styles = createStyles(theme);

  const handleDoubleTap = useCallback((postId: string) => {
    removeFavorite(postId);
    Alert.alert('Removed', 'Removed from favorites');
  }, [removeFavorite]);

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
      onLongPress={() => handleLongPress(item.caption)}
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
    <View style={styles.container}>
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
