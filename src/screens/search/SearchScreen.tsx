import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { debounce } from 'lodash';
import { showMessage } from 'react-native-flash-message';
import { UserProfile } from '../../types';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Debounced search
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        // Search users by username or email
        const results = await profileService.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        showMessage({
          message: 'Error',
          description: 'Failed to search users',
          type: 'danger',
        });
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const handleUserPress = (userId: string, username: string) => {
    navigation.navigate('UserProfile', { userId, username });
  };

  const refreshSearch = async () => {
    setRefreshing(true);
    await performSearch(searchQuery);
    setRefreshing(false);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id, item.username)}
    >
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
          <Text style={styles.userAvatarText}>
            {item.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    const iconName = searchQuery ? 'person-outline' : 'search-outline';
    const title = searchQuery ? 'No users found' : 'Search for users';
    const subText = searchQuery
      ? 'Try a different search term'
      : 'Find other users by their username or email';

    return (
      <View style={styles.emptyContainer}>
        <Icon name={iconName} size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>{title}</Text>
        <Text style={styles.emptySubtext}>{subText}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or email..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && searchResults.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshSearch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={searchResults.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </View>
  );
}
