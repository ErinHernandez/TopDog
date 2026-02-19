// @testing-library/react stub
import { vi } from 'vitest';

export const render = vi.fn((component) => ({
  container: document.createElement('div'),
  unmount: vi.fn(),
  rerender: vi.fn(),
  debug: vi.fn(),
}));

export const screen = {
  getAllByRole: vi.fn(() => []),
  getByRole: vi.fn(),
  getByText: vi.fn(),
  getAllByText: vi.fn(),
  getByTestId: vi.fn(),
  getAllByTestId: vi.fn(),
  queryByRole: vi.fn(),
  queryAllByRole: vi.fn(),
  findByRole: vi.fn(),
  findAllByRole: vi.fn(),
};

export const within = vi.fn(() => screen);

export const waitFor = vi.fn(async (callback) => {
  callback();
});

export const fireEvent = {
  click: vi.fn(),
  change: vi.fn(),
  keyDown: vi.fn(),
  keyUp: vi.fn(),
  submit: vi.fn(),
};

export const userEvent = {
  click: vi.fn(),
  type: vi.fn(),
  tab: vi.fn(),
  keyboard: vi.fn(),
};

export const act = async (callback: () => void | Promise<void>) => {
  return callback();
};

export const renderHook = vi.fn((callback) => ({
  result: { current: callback() },
  rerender: vi.fn(),
  unmount: vi.fn(),
}));

export default {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  userEvent,
  act,
  renderHook,
};
