import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { profileService } from '../../services/profile.service';
import { storageService } from '../../services/storage.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';

export default function EditProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [profileImage, setProfileImage] = useState<string | null>(
    route.params?.currentImage || null
  );
  const [username, setUsername] = useState(
    route.params?.currentUsername || user?.email?.split('@')[0] || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to pick image',
        type: 'danger',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      let imageUrl = profileImage;

      // Upload new image if changed
      if (profileImage && profileImage !== route.params?.currentImage) {
        imageUrl = await storageService.uploadImage(
          profileImage,
          `profiles/${user.uid}/${Date.now()}`
        );
      }

      // Update profile
      await profileService.updateProfile(user.uid, {
        username: username.trim(),
        profileImage: imageUrl || null,
      });

      showMessage({
        message: 'Success!',
        description: 'Profile updated successfully',
        type: 'success',
      });

      navigation.goBack();
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to update profile',
        type: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.editProfileContainer}>
        <TouchableOpacity
          style={styles.profileImageEdit}
          onPress={pickImage}
          disabled={isSaving}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImageEdit} />
          ) : (
            <View style={[styles.profileImageEdit, styles.profileImagePlaceholder]}>
              <Icon name="person" size={60} color={theme.colors.textSecondary} />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Icon name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.changePhotoText}>Tap to change profile photo</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor={theme.colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            editable={!isSaving}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.email || ''}
            editable={false}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!username.trim() || isSaving) && styles.buttonDisabled
            ]}
            onPress={handleSave}
            disabled={!username.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
