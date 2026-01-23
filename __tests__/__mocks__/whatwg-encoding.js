/**
 * Mock for whatwg-encoding package
 * Prevents ESM/CJS compatibility issues in Jest
 */

module.exports = {
  decode: (buffer, encoding) => {
    if (typeof buffer === 'string') return buffer;
    return buffer.toString(encoding || 'utf-8');
  },
  encode: (string, encoding) => {
    return Buffer.from(string, encoding || 'utf-8');
  },
  labelToName: (label) => {
    return label.toLowerCase().replace(/[^a-z0-9]/g, '');
  },
  isSupported: () => true,
};
