// React stub for testing
import { vi } from 'vitest';

export const Fragment = Symbol('Fragment');
export const Children = {};

// useState returns a tuple [state, setState]
export const useState = vi.fn((initialValue: any) => {
  return [initialValue, vi.fn((val: any) => {
    // Update the state if needed
  })];
});

export const useEffect = vi.fn((effect, deps) => {
  // Call the effect immediately for testing
  const cleanup = effect();
  return cleanup;
});

export const useRef = vi.fn((initialValue = null) => ({ current: initialValue }));

export const useCallback = vi.fn((callback) => callback);

export const useMemo = vi.fn((callback) => callback());

export const useContext = vi.fn();

export const useReducer = vi.fn((reducer, initialState) => [initialState, vi.fn()]);

export const useLayoutEffect = vi.fn((effect, deps) => {
  const cleanup = effect();
  return cleanup;
});

export const useImperativeHandle = vi.fn();

export const createContext = vi.fn();

export const createRef = vi.fn();

export const forwardRef = vi.fn((comp) => comp);

export const memo = vi.fn((comp) => comp);

export default {
  Fragment,
  Children,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  createContext,
  createRef,
  forwardRef,
  memo,
};
