// Stub for firebase/storage
export const getStorage = () => ({});
export const ref = () => ({});
export const uploadBytes = async () => ({ ref: {} });
export const uploadBytesResumable = () => ({ on: () => {}, snapshot: { ref: {} } });
export const getDownloadURL = async () => 'https://storage.example.com/test';
export const deleteObject = async () => {};
export const connectStorageEmulator = () => {};
export default { getStorage };
