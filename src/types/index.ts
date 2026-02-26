export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
  favoritesCount: number;
  commentsCount: number;
  isFavorited?: boolean;
}

export interface CreatePostData {
  imageUrl: string;
  caption: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  profileImage?: string | null;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface Favorite {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userEmail: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}