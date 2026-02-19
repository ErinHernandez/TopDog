// Stub for firebase/auth and @firebase/auth
export const getAuth = () => ({});
export const signInWithEmailAndPassword = async () => ({ user: { uid: 'test-uid', email: 'test@test.com' } });
export const createUserWithEmailAndPassword = async () => ({ user: { uid: 'test-uid', email: 'test@test.com' } });
export const signOut = async () => {};
export const onAuthStateChanged = () => () => {};
export const signInWithPopup = async () => ({ user: { uid: 'test-uid' } });
export const sendPasswordResetEmail = async () => {};
export const updateProfile = async () => {};
export const GoogleAuthProvider = class {};
export const connectAuthEmulator = () => {};
export default { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
