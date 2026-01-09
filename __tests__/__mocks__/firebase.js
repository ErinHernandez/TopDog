/**
 * Firebase Mocks for Testing
 *
 * Provides mock implementations of Firebase services:
 * - Firebase App initialization
 * - Firestore database operations
 * - Authentication
 */

// Mock user for testing
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

// Mock admin user
export const mockAdminUser = {
  uid: 'admin-user-123',
  email: 'admin@example.com',
  displayName: 'Admin User',
  emailVerified: true,
};

// Mock Firebase App
export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-project.firebaseapp.com',
    projectId: 'mock-project',
  },
};

// Mock Firestore Document
export class MockFirestoreDocument {
  constructor(data, id = 'mock-doc-id') {
    this.data = data;
    this.id = id;
    this.ref = {
      id,
      path: `collection/${id}`,
    };
  }

  data() {
    return this.data;
  }

  get(field) {
    return this.data[field];
  }

  exists() {
    return this.data !== null;
  }
}

// Mock Firestore Collection
export class MockFirestoreCollection {
  constructor(documents = []) {
    this.documents = documents;
  }

  docs() {
    return this.documents;
  }

  forEach(callback) {
    this.documents.forEach(callback);
  }

  get size() {
    return this.documents.length;
  }

  get empty() {
    return this.documents.length === 0;
  }
}

// Mock Firestore Query
export const createMockFirestoreQuery = (returnData = []) => ({
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue(new MockFirestoreCollection(returnData)),
  onSnapshot: jest.fn((callback) => {
    callback(new MockFirestoreCollection(returnData));
    return jest.fn(); // unsubscribe function
  }),
});

// Mock Firestore Database
export const createMockFirestore = (mockData = {}) => ({
  collection: jest.fn((collectionName) => ({
    doc: jest.fn((docId) => ({
      get: jest.fn().mockResolvedValue(
        new MockFirestoreDocument(mockData[collectionName]?.[docId] || null, docId)
      ),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      onSnapshot: jest.fn((callback) => {
        callback(new MockFirestoreDocument(mockData[collectionName]?.[docId] || null, docId));
        return jest.fn(); // unsubscribe function
      }),
    })),
    add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: jest.fn().mockReturnValue(
      createMockFirestoreQuery(mockData[collectionName] || [])
    ),
    orderBy: jest.fn().mockReturnValue(
      createMockFirestoreQuery(mockData[collectionName] || [])
    ),
    limit: jest.fn().mockReturnValue(
      createMockFirestoreQuery(mockData[collectionName] || [])
    ),
    get: jest.fn().mockResolvedValue(
      new MockFirestoreCollection(mockData[collectionName] || [])
    ),
  })),
});

// Mock Firebase Auth
export const createMockAuth = (currentUser = null) => ({
  currentUser,
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({
    user: currentUser || mockUser,
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((callback) => {
    callback(currentUser);
    return jest.fn(); // unsubscribe function
  }),
  signInAnonymously: jest.fn().mockResolvedValue({
    user: { ...mockUser, isAnonymous: true },
  }),
});

// Mock Firebase Admin Auth
export const createMockAdminAuth = () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: mockUser.uid,
    email: mockUser.email,
  }),
  getUser: jest.fn().mockResolvedValue(mockUser),
  setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
  createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
});

// Mock Firebase modules
export const mockFirebase = {
  initializeApp: jest.fn().mockReturnValue(mockFirebaseApp),
  getApps: jest.fn().mockReturnValue([]),
  getFirestore: jest.fn().mockReturnValue(createMockFirestore()),
  getAuth: jest.fn().mockReturnValue(createMockAuth()),
};

// Helper to setup Firebase mocks
export const setupFirebaseMocks = (config = {}) => {
  const {
    currentUser = mockUser,
    firestoreData = {},
  } = config;

  jest.mock('firebase/app', () => ({
    initializeApp: mockFirebase.initializeApp,
    getApps: mockFirebase.getApps,
  }));

  jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn().mockReturnValue(createMockFirestore(firestoreData)),
    connectFirestoreEmulator: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  }));

  jest.mock('firebase/auth', () => ({
    getAuth: jest.fn().mockReturnValue(createMockAuth(currentUser)),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(),
  }));

  return {
    mockFirestore: createMockFirestore(firestoreData),
    mockAuth: createMockAuth(currentUser),
  };
};

export default {
  mockUser,
  mockAdminUser,
  mockFirebaseApp,
  createMockFirestore,
  createMockAuth,
  createMockAdminAuth,
  setupFirebaseMocks,
};
