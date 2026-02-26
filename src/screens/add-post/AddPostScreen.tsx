import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { createStyles } from '../../utils/theme';
import { postsService } from '../../services/posts.service';
import { storageService } from '../../services/storage.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type AddPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function AddPostScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigation = useNavigation<AddPostScreenNavigationProp>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload photos',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Alert.alert('Please enable permissions in your device settings') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to pick image',
        type: 'danger',
      });
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take photos',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Alert.alert('Please enable permissions in your device settings') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to take photo',
        type: 'danger',
      });
    }
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `post_${timestamp}.jpg`;
      const storagePath = `posts/${user.uid}/${filename}`;

      // Upload image to storage
      const imageUrl = await storageService.uploadImage(
        image,
        storagePath,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Create post in Firestore
      await postsService.createPost({
        imageUrl,
        caption: caption.trim(),
        userId: user.uid,
        userEmail: user.email || 'anonymous@lumigram.com',
        createdAt: new Date(),
      });

      showMessage({
        message: 'Success!',
        description: 'Your post has been shared',
        type: 'success',
        duration: 3000,
      });

      // Reset form
      setImage(null);
      setCaption('');
      setUploadProgress(0);
      
      // Navigate to home tab
      navigation.navigate('Main');
    } catch (error) {
      console.error('Upload error:', error);
      showMessage({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload post',
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setCaption('');
  };

  const renderImagePickerButtons = () => (
    <View style={styles.imagePickerContainer}>
      <TouchableOpacity
        style={[styles.imagePickerButton, isUploading && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={isUploading}
      >
        <Icon name="images-outline" size={48} color={theme.colors.primary} />
        <Text style={styles.imagePickerText}>Choose from Gallery</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.imagePickerButton, isUploading && styles.buttonDisabled]}
        onPress={takePhoto}
        disabled={isUploading}
      >
        <Icon name="camera-outline" size={48} color={theme.colors.primary} />
        <Text style={styles.imagePickerText}>Take a Photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectedImage = () => (
    <View style={styles.selectedImageContainer}>
      <Image 
        source={{ uri: image as string }} 
        style={styles.selectedImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={removeImage}
        disabled={isUploading}
      >
        <Icon name="close-circle" size={30} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View 
        style={[
          styles.progressBar, 
          { width: `${uploadProgress}%` }
        ]} 
      />
      <Text style={styles.progressText}>
        Uploading... {Math.round(uploadProgress)}%
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.addPostContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Image Selection */}
      {!image ? renderImagePickerButtons() : renderSelectedImage()}

      {/* Caption Input */}
      {image && (
        <>
          <TextInput
            style={[styles.input, styles.captionInput]}
            placeholder="Write a caption..."
            placeholderTextColor={theme.colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            maxLength={2200}
            editable={!isUploading}
            textAlignVertical="top"
          />

          {/* Character Count */}
          <Text style={[styles.captionCount, { color: theme.colors.textSecondary }]}>
            {caption.length}/2200
          </Text>

          {/* Upload Progress */}
          {isUploading && renderProgress()}

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!caption.trim() || isUploading) && styles.buttonDisabled
            ]}
            onPress={handleUpload}
            disabled={!caption.trim() || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Share Post</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
