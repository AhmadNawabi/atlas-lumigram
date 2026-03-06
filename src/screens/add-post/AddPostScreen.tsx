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
  Linking,
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
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function AddPostScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload photos',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                }
              }
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
      }
    } catch (error) {
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
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                }
              }
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
      }
    } catch (error) {
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
      const filename = storageService.generateFilename('post');
      const storagePath = `posts/${user.uid}/${filename}`;

      const imageUrl = await storageService.uploadImage(
        image,
        storagePath,
        (progress) => {
          setUploadProgress(progress);
        }
      );

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

      // Reset form with animation
      scale.value = withSpring(0.8);
      opacity.value = withTiming(0);
      
      setTimeout(() => {
        setImage(null);
        setCaption('');
        setUploadProgress(0);
        navigation.goBack();
      }, 300);
      
    } catch (error) {
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
    scale.value = withSpring(0.8);
    opacity.value = withTiming(0);
    setTimeout(() => {
      setImage(null);
      setCaption('');
    }, 300);
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!image) {
    return (
      <View style={[styles.container, styles.addPostContainer]}>
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={styles.imagePickerContainer}
        >
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            <View style={styles.imagePickerIconContainer}>
              <Icon name="images-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.imagePickerText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={takePhoto}
            disabled={isUploading}
          >
            <View style={styles.imagePickerIconContainer}>
              <Icon name="camera-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.imagePickerText}>Take a Photo</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.addPostContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={SlideInDown.springify().damping(15)}
        exiting={SlideOutDown}
        style={styles.selectedImageContainer}
      >
        <Animated.View style={animatedImageStyle}>
          <Image 
            source={{ uri: image }} 
            style={styles.selectedImage}
            resizeMode="cover"
          />
        </Animated.View>
        
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={removeImage}
          disabled={isUploading}
        >
          <Icon name="close-circle" size={30} color={theme.colors.error} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        entering={FadeIn.delay(300).duration(500)}
        style={styles.captionSection}
      >
        <TextInput
          style={styles.captionInput}
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

        <Text style={[styles.captionCount, { color: theme.colors.textSecondary }]}>
          {caption.length}/2200
        </Text>

        {isUploading && (
          <Animated.View 
            entering={FadeIn}
            style={styles.progressContainer}
          >
            <View 
              style={[
                styles.progressBar, 
                { width: `${uploadProgress}%` }
              ]} 
            />
            <Text style={styles.progressText}>
              Uploading... {Math.round(uploadProgress)}%
            </Text>
          </Animated.View>
        )}

        <TouchableOpacity
          style={[
            styles.shareButton,
            (!caption.trim() || isUploading) && styles.buttonDisabled
          ]}
          onPress={handleUpload}
          disabled={!caption.trim() || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Share Post</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
