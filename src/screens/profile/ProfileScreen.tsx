import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import { postsService } from '../../services/posts.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';
import { Post } from '../../types';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const IMAGE_SIZE = (width - 32) / NUM_COLUMNS;

export default function ProfileScreen() {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const [profile, posts] = await Promise.all([
        profileService.getUserProfile(user.uid),
        postsService.getUserPosts(user.uid),
      ]);

      setProfileImage(profile.profileImage || null);
      setUsername(profile.username || user.email?.split('@')[0] || 'User');
      setStats(profile.stats || { posts: posts.length, followers: 0, following: 0 });
      setUserPosts(posts);
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to load profile',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {
      currentImage: profileImage,
      currentUsername: username,
    });
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        // Navigate to post detail (optional)
      }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
      />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileInfo}>
        <TouchableOpacity onPress={handleEditProfile}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Icon name="person" size={40} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Icon name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <Text style={styles.username}>{username}</Text>

      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={handleEditProfile}
      >
        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <Icon name="images-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        contentContainerStyle={styles.profileContent}
      />
    </View>
  );
}
