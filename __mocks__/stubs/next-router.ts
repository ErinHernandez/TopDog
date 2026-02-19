// Stub for next/router
export const useRouter = () => ({
  push: async () => true,
  replace: async () => true,
  reload: () => {},
  back: () => {},
  prefetch: async () => {},
  beforePopState: () => {},
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  isReady: true,
  isPreview: false,
  basePath: '',
  locale: 'en',
  events: { on: () => {}, off: () => {}, emit: () => {} },
});
export default { useRouter };
