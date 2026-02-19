// Stub for firebase-admin/storage
export const getStorage = () => ({
  bucket: () => ({
    file: () => ({
      save: async () => {},
      download: async () => [Buffer.from('')],
      delete: async () => {},
      exists: async () => [true],
      getSignedUrl: async () => ['https://storage.example.com/test'],
      makePublic: async () => {},
      getMetadata: async () => [{ size: 0, contentType: 'image/png' }],
    }),
    upload: async () => {},
  }),
});
export default { getStorage };
