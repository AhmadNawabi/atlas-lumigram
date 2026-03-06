import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import { postsService } from '../../services/posts.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;

export default function ProfileScreen() {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const safeNumber = (value: any) => (typeof value === 'number' ? value : 0);

  const loadProfileData = async () => {
    if (!user) return setLoading(false);
    try {
      setLoading(true);
      const [profileData, posts] = await Promise.all([
        profileService.getUserProfile(user.uid),
        postsService.getUserPosts(user.uid),
      ]);

      if (profileData) {
        setProfile({
          ...profileData,
          followersCount: safeNumber(profileData.followersCount),
          followingCount: safeNumber(profileData.followingCount),
        });
      }
      setUserPosts(posts || []);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to load profile',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [user])
  );

  const refreshData = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {
      currentImage: profile?.profileImage,
      currentUsername: profile?.username || user?.email?.split('@')[0],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const profileImage = profile?.profileImage;

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <FlatList
        data={userPosts}
        renderItem={({ item }) => (
          <View style={{ width: width / 3 - 2, height: width / 3 - 2, margin: 1 }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={handleEditProfile} style={{ marginRight: 16 }}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: theme.colors.surface,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name="person" size={40} color={theme.colors.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>
                    {userPosts.length}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>Posts</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>
                    {safeNumber(profile?.followersCount)}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>Followers</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>
                    {safeNumber(profile?.followingCount)}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>Following</Text>
                </View>
              </View>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>
              {displayName}
            </Text>

            {profile?.bio ? (
              <Text style={{ color: theme.colors.text, marginBottom: 16 }}>{profile.bio}</Text>
            ) : null}

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 5, padding: 8, alignItems: 'center' }}
              onPress={handleEditProfile}
            >
              <Text style={{ color: theme.colors.text }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      />
    </SafeAreaView>
  );
}
