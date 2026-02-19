// Stub for firebase-admin/firestore
const mockDoc = {
  exists: true,
  data: () => ({}),
  id: 'test-doc',
  ref: { update: async () => {}, delete: async () => {}, set: async () => {} },
  get: async () => mockDoc,
};
const mockCollection = {
  doc: () => mockDoc.ref,
  where: () => mockCollection,
  orderBy: () => mockCollection,
  limit: () => mockCollection,
  get: async () => ({ docs: [], empty: true, size: 0, forEach: () => {} }),
  add: async () => mockDoc.ref,
};
export const getFirestore = () => ({
  collection: () => mockCollection,
  doc: () => mockDoc.ref,
  runTransaction: async (fn: any) => fn({ get: async () => mockDoc, set: () => {}, update: () => {}, delete: () => {} }),
  batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} }),
});
export const FieldValue = {
  serverTimestamp: () => new Date(),
  increment: (n: number) => n,
  arrayUnion: (...args: any[]) => args,
  arrayRemove: (...args: any[]) => args,
  delete: () => undefined,
};
export const Timestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000, nanoseconds: 0 }),
  fromDate: (d: Date) => ({ toDate: () => d, seconds: d.getTime() / 1000, nanoseconds: 0 }),
};
export default { getFirestore, FieldValue, Timestamp };
