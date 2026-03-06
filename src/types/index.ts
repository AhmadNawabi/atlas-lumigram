export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  userId: string;
  userEmail: string;
  username?: string;
  userProfileImage?: string | null;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface CreatePostData {
  imageUrl: string;
  caption: string;
  userId: string;
  userEmail: string;
  username?: string;
  userProfileImage?: string | null;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  username: string;
  displayName?: string;
  profileImage?: string | null;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userEmail: string;
  username?: string;
  userProfileImage?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  isLiked?: boolean;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface Follow {
  id: string;
  followerId: string; // The user who follows
  followingId: string; // The user being followed
  createdAt: Date;
}

export interface Share {
  id: string;
  postId: string;
  userId: string;
  platform?: 'internal' | 'external';
  createdAt: Date;
}
