// Stub for sharp — used only during vitest
const mockSharp: any = () => ({
  metadata: async () => ({ width: 100, height: 100, format: 'png', channels: 4 }),
  resize: () => mockSharp(),
  toFormat: () => mockSharp(),
  toBuffer: async () => Buffer.from(''),
  png: () => mockSharp(),
  jpeg: () => mockSharp(),
  webp: () => mockSharp(),
  tiff: () => mockSharp(),
  avif: () => mockSharp(),
  raw: () => mockSharp(),
  flatten: () => mockSharp(),
  composite: () => mockSharp(),
  extract: () => mockSharp(),
  trim: () => mockSharp(),
  rotate: () => mockSharp(),
  flip: () => mockSharp(),
  flop: () => mockSharp(),
  sharpen: () => mockSharp(),
  blur: () => mockSharp(),
  gamma: () => mockSharp(),
  negate: () => mockSharp(),
  normalize: () => mockSharp(),
  greyscale: () => mockSharp(),
  grayscale: () => mockSharp(),
  toColorspace: () => mockSharp(),
  ensureAlpha: () => mockSharp(),
  removeAlpha: () => mockSharp(),
  extend: () => mockSharp(),
  clone: () => mockSharp(),
  pipe: () => mockSharp(),
});
mockSharp.cache = () => {};
mockSharp.concurrency = () => {};
mockSharp.simd = () => {};
export default mockSharp;
