// React DOM stub for testing
export const createPortal = (element: any) => element;
export const createRoot = vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() }));
export const render = vi.fn();
export const hydrate = vi.fn();
export const unmountComponentAtNode = vi.fn();
export const findDOMNode = vi.fn();
export default {
  createPortal,
  createRoot,
  render,
  hydrate,
  unmountComponentAtNode,
  findDOMNode,
};
