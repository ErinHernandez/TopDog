// Stub for firebase-admin/auth
export const getAuth = () => ({
  verifyIdToken: async () => ({ uid: 'test-uid', email: 'test@test.com' }),
  getUser: async () => ({ uid: 'test-uid', email: 'test@test.com' }),
  createUser: async () => ({ uid: 'test-uid' }),
  deleteUser: async () => {},
  updateUser: async () => ({ uid: 'test-uid' }),
  listUsers: async () => ({ users: [] }),
});
export default { getAuth };
