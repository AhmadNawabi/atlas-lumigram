import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Initial values passed from ProfileScreen
  const [username, setUsername] = useState(route.params?.currentUsername || '');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(route.params?.currentImage || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await profileService.getUserProfile(user.uid);
        if (data) {
          setUsername(data.username || '');
          setBio(data.bio || '');
          setProfileImage(data.profileImage || '');
        }
      } catch (err) {
        console.error(err);
        showMessage({ message: 'Error', description: 'Failed to load profile', type: 'danger' });
      }
    };
    loadProfile();
  }, [user]);

  const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('Permission denied', 'You need to allow access to your photos.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
  });

  // Updated for new types
  if (!result.canceled && result.assets && result.assets.length > 0) {
    setProfileImage(result.assets[0].uri);
  }
};

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await profileService.updateProfile(user.uid, {
        username,
        bio,
        profileImage,
      });
      showMessage({ message: 'Success', description: 'Profile updated!', type: 'success' });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      showMessage({ message: 'Error', description: 'Failed to update profile', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Saving profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { padding: 16 }]}>
      <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 16 }}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="person" size={60} color={theme.colors.textSecondary} />
          </View>
        )}
        <Text style={{ textAlign: 'center', marginTop: 8, color: theme.colors.primary }}>Change Photo</Text>
      </TouchableOpacity>

      <Text style={{ color: theme.colors.text, marginBottom: 4 }}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 5,
          padding: 8,
          marginBottom: 16,
          color: theme.colors.text,
        }}
      />

      <Text style={{ color: theme.colors.text, marginBottom: 4 }}>Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Enter your bio"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 5,
          padding: 8,
          marginBottom: 16,
          color: theme.colors.text,
          height: 80,
          textAlignVertical: 'top',
        }}
        multiline
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: theme.colors.primary,
          padding: 12,
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
