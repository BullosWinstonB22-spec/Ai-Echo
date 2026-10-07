import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Construct dynamic/authorized authDomain format safely
const getAuthorizedAuthDomain = () => {
  if (firebaseConfig.authDomain) {
    return firebaseConfig.authDomain;
  }
  if (firebaseConfig.projectId) {
    return `${firebaseConfig.projectId}.firebaseapp.com`;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return '';
};

const safeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: getAuthorizedAuthDomain(),
};

let firebaseApp: FirebaseApp;
let firestoreDb: Firestore;
let authInstance: Auth;

try {
  if (!getApps().length) {
    firebaseApp = initializeApp(safeFirebaseConfig);
  } else {
    firebaseApp = getApp();
  }
} catch (err) {
  console.warn('Firebase app initialization fallback:', err);
  firebaseApp = getApp();
}

// Pass database ID if named database is provisioned
try {
  if (safeFirebaseConfig.firestoreDatabaseId) {
    firestoreDb = getFirestore(firebaseApp, safeFirebaseConfig.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(firebaseApp);
  }
} catch (err) {
  console.warn('Firestore initialization fallback:', err);
  firestoreDb = getFirestore(firebaseApp);
}

// Initialize Auth safely
try {
  authInstance = getAuth(firebaseApp);
} catch (err) {
  console.warn('Auth initialization fallback:', err);
  authInstance = getAuth();
}

export const auth = authInstance;
export const db = firestoreDb;

// Initialize Google Auth Provider safely
export const googleAuthProvider = new GoogleAuthProvider();
try {
  googleAuthProvider.setCustomParameters({
    prompt: 'select_account',
  });
} catch (err) {
  console.warn('Google auth provider custom parameters error:', err);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let currentUserUID: string | null = null;

export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth && auth.currentUser) {
    currentUserUID = auth.currentUser.uid;
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            currentUserUID = user.uid;
          }
          unsubscribe();
          resolve(user);
        },
        (error) => {
          console.warn('Auth state change error:', error);
          resolve(null);
        }
      );
    } catch (err) {
      console.warn('Auth state listener exception:', err);
      resolve(null);
    }
  });
}

export function getCurrentUserUID(): string {
  try {
    if (auth && auth.currentUser) {
      currentUserUID = auth.currentUser.uid;
      return auth.currentUser.uid;
    }
  } catch (e) {
    // ignore
  }
  if (currentUserUID) {
    return currentUserUID;
  }
  return 'anonymous_guest';
}

