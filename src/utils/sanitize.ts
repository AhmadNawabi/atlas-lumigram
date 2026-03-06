import { Post } from '../types';

/**
 * Checks if a value is a Firebase increment object
 */
export const isIncrementObject = (value: any): boolean => {
  return value && typeof value === 'object' && 'type' in value && value.type === 'increment';
};

/**
 * Ensures a value is a safe number for rendering
 */
export const ensureNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value;
  if (isIncrementObject(value)) {
    console.warn('⚠️ Increment object detected, replacing with', defaultValue);
    return defaultValue;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Sanitizes a post object to ensure all fields are render-safe
 */
export const sanitizePost = (post: any): Post => {
  if (!post) return post;
  
  const sanitized = { ...post };
  
  // Fields that should always be numbers
  const numberFields = ['likesCount', 'commentsCount', 'sharesCount', 'favoritesCount'];
  
  numberFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = ensureNumber(sanitized[field]);
    }
  });
  
  // Ensure dates are Date objects
  if (sanitized.createdAt && !(sanitized.createdAt instanceof Date)) {
    try {
      sanitized.createdAt = new Date(sanitized.createdAt);
    } catch {
      sanitized.createdAt = new Date();
    }
  }
  
  return sanitized as Post;
};

/**
 * Sanitizes an array of posts
 */
export const sanitizePosts = (posts: any[]): Post[] => {
  return posts.map(sanitizePost);
};
