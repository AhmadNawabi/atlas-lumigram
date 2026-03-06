import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  AuthError,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

class AuthService {
  async register(email: string, password: string, username?: string): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Generate username from email if not provided
      const displayName = username || email.split('@')[0];
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName,
      });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: displayName,
        displayName: displayName,
        profileImage: null,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });
      
      // Create initial profile document
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        email: user.email,
        username: displayName,
        displayName: displayName,
        profileImage: null,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
      });
      
      console.log('User registered successfully:', user.uid);
      return user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Registration error:', authError.code, authError.message);
      throw new Error(this.getErrorMessage(authError.code));
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError.code);
      throw new Error(this.getErrorMessage(authError.code));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please register first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Please login instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  }
}

export const authService = new AuthService();
