/**
 * Vitest global setup
 * Installs browser API mocks required by TopDog Studio
 */
import { installCanvasMocks } from './canvas-mock';
import { vi } from 'vitest';

// Install canvas mocks before all tests
installCanvasMocks();

// Mock React and React DOM modules if not available
try {
  require.resolve('react');
} catch {
  vi.mock('react', () => ({
    default: { Fragment: Symbol('Fragment') },
    Fragment: Symbol('Fragment'),
    useState: vi.fn(),
    useEffect: vi.fn(),
    useRef: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
    useContext: vi.fn(),
    useReducer: vi.fn(),
    useLayoutEffect: vi.fn(),
    useImperativeHandle: vi.fn(),
    createContext: vi.fn(),
    createRef: vi.fn(),
    forwardRef: vi.fn(),
    memo: vi.fn(),
  }), { virtual: true });
}

try {
  require.resolve('react/jsx-dev-runtime');
} catch {
  vi.mock('react/jsx-dev-runtime', () => ({
    default: { Fragment: Symbol('Fragment') },
    Fragment: Symbol('Fragment'),
    jsxDEV: vi.fn(),
  }), { virtual: true });
}

// Add Blob.arrayBuffer() polyfill for jsdom compatibility
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function() {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Add Blob.text() polyfill for jsdom compatibility
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = async function() {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// Add File.arrayBuffer() polyfill for jsdom compatibility
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function() {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Add File.text() polyfill for jsdom compatibility
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = async function() {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// Suppress console.warn/error in tests unless TEST_VERBOSE is set
if (!process.env.TEST_VERBOSE) {
  const noop = () => {};
  global.console.warn = noop;
}
