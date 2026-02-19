// Stub for firebase/firestore
export const getFirestore = () => ({});
export const collection = () => ({});
export const doc = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const getDocs = async () => ({ docs: [], empty: true, size: 0, forEach: () => {} });
export const setDoc = async () => {};
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const addDoc = async () => ({ id: 'test-doc' });
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const startAfter = () => ({});
export const onSnapshot = () => () => {};
export const serverTimestamp = () => new Date();
export const connectFirestoreEmulator = () => {};
export const writeBatch = () => ({
  update: () => {},
  delete: () => {},
  commit: async () => {},
});
export const getCountFromServer = async () => ({ data: () => ({ count: 0 }) });
export default { getFirestore };
