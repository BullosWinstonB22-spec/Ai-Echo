import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleAuthProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';
import { DEFAULT_PROFILE } from './storageService';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Listen to auth state transitions
  public subscribeToAuthState(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      callback(firebaseUser);
    });
  }

  // Get current user immediately
  public getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Sign up with Email and Password
  public async signUpWithEmail(name: string, email: string, pass: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = userCredential.user;

    // Update display name in Firebase Auth
    if (name.trim()) {
      await updateProfile(user, {
        displayName: name.trim(),
      });
    }

    // Provision user document in Firestore: users/{user.uid}
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name.trim() || user.displayName || 'User',
        email: user.email || email.trim(),
        avatar: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: DEFAULT_PROFILE.preferences,
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }

    return user;
  }

  // Sign in with Email and Password
  public async signInWithEmail(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return userCredential.user;
  }

  // Sign in with Google Popup
  public async signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleAuthProvider);
    const user = userCredential.user;

    // Ensure document exists
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }

    return user;
  }

  // Send Password Reset Email
  public async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  // Logout cleanly
  public async logout(): Promise<void> {
    await signOut(auth);
  }

  // Fetch or initialize user profile from Firestore users/{uid}
  public async fetchUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return {
          name: data.name || auth.currentUser?.displayName || DEFAULT_PROFILE.name,
          email: data.email || auth.currentUser?.email || DEFAULT_PROFILE.email,
          avatarUrl: data.avatar || auth.currentUser?.photoURL || DEFAULT_PROFILE.avatarUrl,
          preferences: {
            ...DEFAULT_PROFILE.preferences,
            ...(data.preferences || {}),
          },
          memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : DEFAULT_PROFILE.memberSince,
          totalQueries: data.totalQueries || DEFAULT_PROFILE.totalQueries,
        };
      }
    } catch (err) {
      console.warn('Could not read user profile from cloud Firestore:', err);
    }

    return {
      name: auth.currentUser?.displayName || DEFAULT_PROFILE.name,
      email: auth.currentUser?.email || DEFAULT_PROFILE.email,
      avatarUrl: auth.currentUser?.photoURL || DEFAULT_PROFILE.avatarUrl,
      preferences: DEFAULT_PROFILE.preferences,
      memberSince: DEFAULT_PROFILE.memberSince,
      totalQueries: DEFAULT_PROFILE.totalQueries,
    };
  }

  // Update profile details
  public async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (auth.currentUser && profile.name) {
      try {
        await updateProfile(auth.currentUser, { displayName: profile.name });
      } catch (e) {
        console.warn('Could not update Auth displayName:', e);
      }
    }

    const userDocRef = doc(db, 'users', uid);
    try {
      await setDoc(userDocRef, {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatarUrl,
        preferences: profile.preferences,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  }

  // Map Firebase Auth error codes to friendly strings
  public static getFriendlyErrorMessage(err: any): string {
    if (!err) return 'An unexpected error occurred.';
    const code = (err as AuthError)?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify and try again.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again or reset your password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return err.message || 'Authentication error. Please check your network and try again.';
    }
  }
}

export const authService = AuthService.getInstance();
