import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

class StorageService {
  /**
   * Upload an image to Firebase Storage
   * @param uri - Local URI of the image
   * @param path - Storage path (e.g., 'posts/userId/timestamp')
   * @param onProgress - Optional progress callback
   * @returns Promise with download URL
   */
  async uploadImage(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Validate inputs
      if (!uri) {
        throw new Error('No image URI provided');
      }
      if (!path) {
        throw new Error('No storage path provided');
      }

      // Fetch the image and convert to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Image blob is empty');
      }

      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate and report progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            // Handle upload error
            console.error('Upload error:', error);
            let errorMessage = 'Failed to upload image';
            
            // Provide more specific error messages
            if (error.code === 'storage/unauthorized') {
              errorMessage = 'You are not authorized to upload images';
            } else if (error.code === 'storage/canceled') {
              errorMessage = 'Upload was canceled';
            } else if (error.code === 'storage/unknown') {
              errorMessage = 'An unknown error occurred during upload';
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
   * Delete an image from Firebase Storage
   * @param url - Full storage URL or path
   */
  async deleteImage(url: string): Promise<void> {
    try {
      if (!url) {
        console.warn('No URL provided for deletion');
        return;
      }

      // Create reference from URL
      const storageRef = ref(storage, url);
      
      // Delete the file
      await deleteObject(storageRef);
      console.log('Image deleted successfully');
    } catch (error) {
      // Log but don't throw - this is cleanup, we don't want to block the main operation
      console.error('Error deleting image:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('object-not-found')) {
          console.log('Image already deleted or not found');
        } else {
          console.error('Unexpected error during deletion:', error.message);
        }
      }
    }
  }

  /**
   * Extract filename from storage URL
   * @param url - Full storage URL
   * @returns Filename
   */
  getFileNameFromUrl(url: string): string {
    try {
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/\/([^/?]+)(\?|$)/);
      return matches ? matches[1] : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get the storage path from a full URL
   * @param url - Full storage URL
   * @returns Storage path
   */
  getPathFromUrl(url: string): string {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      if (url.startsWith(baseUrl)) {
        const pathPart = url.split('/o/')[1]?.split('?')[0];
        return pathPart ? decodeURIComponent(pathPart) : '';
      }
      return url;
    } catch (error) {
      return url;
    }
  }

  /**
   * Check if a file exists in storage
   * @param url - Full storage URL
   * @returns Promise<boolean>
   */
  async fileExists(url: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, url);
      await getDownloadURL(storageRef);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();
