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
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import { postsService } from '../../services/posts.service';
import { followService } from '../../services/follow.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';
import { Post, UserProfile } from '../../types';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;

export default function UserProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userId, username: routeUsername } = route.params;
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const safeNumber = (value: any): number => (typeof value === 'number' ? value : 0);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const [userProfile, posts] = await Promise.all([
        profileService.getUserProfile(userId),
        postsService.getUserPosts(userId),
      ]);

      if (userProfile) {
        setProfile({
          ...userProfile,
          followersCount: safeNumber(userProfile.followersCount),
          followingCount: safeNumber(userProfile.followingCount),
        });
      }

      setUserPosts(posts || []);

      if (currentUser) {
        const following = await followService.isFollowing(currentUser.uid, userId);
        setIsFollowing(following);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showMessage({ message: 'Error', description: 'Failed to load user profile', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId, currentUser]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;

    setFollowLoading(true);
    try {
      const newFollowStatus = await followService.toggleFollow(currentUser.uid, userId);
      setIsFollowing(newFollowStatus);

      setProfile(prev => {
        if (!prev) return prev;
        const currentFollowers = safeNumber(prev.followersCount);
        return {
          ...prev,
          followersCount: newFollowStatus ? currentFollowers + 1 : Math.max(0, currentFollowers - 1),
        };
      });

      showMessage({
        message: newFollowStatus ? `Following ${profile.username}` : `Unfollowed ${profile.username}`,
        type: 'success',
        duration: 1500,
      });
    } catch (error) {
      console.error('Follow toggle error:', error);
      showMessage({ message: 'Error', description: 'Failed to update follow status', type: 'danger' });
    } finally {
      setFollowLoading(false);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={{ width: width / 3 - 2, height: width / 3 - 2, margin: 1 }}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {profile?.profileImage ? (
          <Image source={{ uri: profile.profileImage }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        ) : (
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Icon name="person" size={40} color={theme.colors.textSecondary} />
          </View>
        )}

        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{userPosts.length}</Text>
            <Text>Posts</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{safeNumber(profile?.followersCount)}</Text>
            <Text>Followers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{safeNumber(profile?.followingCount)}</Text>
            <Text>Following</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8 }}>
        {profile?.username || routeUsername || 'User'}
      </Text>

      {currentUser?.uid !== userId && (
        <TouchableOpacity
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 6,
            alignItems: 'center',
            backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary,
          }}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? theme.colors.primary : '#fff'} />
          ) : (
            <Text style={{ fontWeight: '600', color: isFollowing ? theme.colors.primary : '#fff' }}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={userPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="images-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={{ marginTop: 10 }}>No posts yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
