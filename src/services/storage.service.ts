import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

class StorageService {
  /**
   * Upload an image to Firebase Storage with compression
   */
  async uploadImage(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Validate inputs
      if (!uri) throw new Error('No image URI provided');
      if (!path) throw new Error('No storage path provided');

      // Compress and optimize image
      const compressedImage = await this.compressImage(uri);
      
      // Convert to blob
      const response = await fetch(compressedImage.uri);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      
      // Validate blob
      if (blob.size === 0) throw new Error('Image blob is empty');
      if (blob.size > 10 * 1024 * 1024) throw new Error('Image too large (max 10MB)');

      // Create storage reference
      const timestamp = Date.now();
      const filename = `image_${timestamp}.jpg`;
      const fullPath = `${path}/${filename}`;
      const storageRef = ref(storage, fullPath);
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            let errorMessage = 'Failed to upload image';
            
            if (error.code === 'storage/unauthorized') {
              errorMessage = 'You are not authorized to upload images';
            } else if (error.code === 'storage/canceled') {
              errorMessage = 'Upload was canceled';
            } else if (error.code === 'storage/quota-exceeded') {
              errorMessage = 'Storage quota exceeded';
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload successful:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Storage service error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload image');
    }
  }

  /**
   * Compress image for optimal upload
   */
  private async compressImage(uri: string) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result;
    } catch (error) {
      console.error('Image compression error:', error);
      // Return original if compression fails
      return { uri };
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(url: string): Promise<void> {
    try {
      if (!url) return;

      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Generate a unique filename
   */
  generateFilename(prefix: string = 'image'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.jpg`;
  }
}

export const storageService = new StorageService();
