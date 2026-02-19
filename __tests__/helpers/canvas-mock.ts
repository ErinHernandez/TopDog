/**
 * Canvas and OffscreenCanvas mocks for testing TopDog Studio
 * Provides minimal browser API mocks for Node.js test environment
 */

export class MockCanvasRenderingContext2D {
  canvas: any;
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  globalAlpha: number = 1;
  globalCompositeOperation: string = 'source-over';
  imageSmoothingEnabled: boolean = true;
  imageSmoothingQuality: string = 'low';
  font: string = '10px sans-serif';
  textAlign: string = 'start';
  textBaseline: string = 'alphabetic';
  shadowBlur: number = 0;
  shadowColor: string = 'rgba(0, 0, 0, 0)';
  shadowOffsetX: number = 0;
  shadowOffsetY: number = 0;
  lineCap: string = 'butt';
  lineJoin: string = 'miter';
  miterLimit: number = 10;

  private _imageData: ImageData | null = null;

  constructor(canvas: any) {
    this.canvas = canvas;
  }

  // Drawing methods
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  clearRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  arc(_x: number, _y: number, _r: number, _sa: number, _ea: number, _acw?: boolean): void {}
  arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _r: number): void {}
  ellipse(_x: number, _y: number, _rx: number, _ry: number, _rot: number, _sa: number, _ea: number, _acw?: boolean): void {}
  rect(_x: number, _y: number, _w: number, _h: number): void {}
  fill(_rule?: string): void {}
  stroke(): void {}
  clip(_rule?: string): void {}
  save(): void {}
  restore(): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  scale(_x: number, _y: number): void {}
  setTransform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {}
  resetTransform(): void {}
  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {}
  bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number): void {}
  isPointInPath(_x: number, _y: number): boolean { return false; }
  drawImage(..._args: any[]): void {}
  fillText(_text: string, _x: number, _y: number, _maxW?: number): void {}
  strokeText(_text: string, _x: number, _y: number, _maxW?: number): void {}
  measureText(text: string): { width: number } { return { width: text.length * 7 }; }

  createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number): any {
    return { addColorStop: () => {} };
  }

  createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number): any {
    return { addColorStop: () => {} };
  }

  createPattern(_img: any, _rep: string | null): any {
    return {};
  }

  getImageData(x: number, y: number, w: number, h: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    return { data, width: w, height: h, colorSpace: 'srgb' as any } as ImageData;
  }

  putImageData(_imageData: ImageData, _dx: number, _dy: number): void {}

  createImageData(w: number, h: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    return { data, width: w, height: h, colorSpace: 'srgb' as any } as ImageData;
  }

  getContextAttributes(): any {
    return { alpha: true, desynchronized: false };
  }

  toDataURL(_type?: string, _quality?: number): string {
    return 'data:image/png;base64,';
  }
}

export class MockOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(type: string): MockCanvasRenderingContext2D | null {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D(this);
    }
    return null;
  }

  convertToBlob(_options?: any): Promise<Blob> {
    return Promise.resolve(new Blob([], { type: 'image/png' }));
  }

  transferToImageBitmap(): any {
    return {};
  }
}

/**
 * Mock DOMParser for Node.js environment
 */
class MockDOMParser {
  parseFromString(xmlString: string, mimeType: string): Document {
    const doc = {
      documentElement: {
        tagName: 'svg',
      },
      querySelectorAll: (selector: string): any[] => {
        // Simple regex-based element counting for testing
        const elementRegex = /<[a-z][a-z0-9]*\s*(?:[^>]*?)>/gi;
        const matches = xmlString.match(elementRegex) || [];
        // Return an array-like object with length property
        return Array(matches.length).fill({});
      },
    } as any;

    // Check if XML is malformed
    if (xmlString.includes('parsererror') || !xmlString.includes('<')) {
      doc.documentElement.tagName = 'parsererror';
    }

    return doc;
  }
}

/**
 * Install canvas mocks into global scope
 */
export function installCanvasMocks(): void {
  (globalThis as any).OffscreenCanvas = MockOffscreenCanvas;
  (globalThis as any).OffscreenCanvasRenderingContext2D = MockCanvasRenderingContext2D;

  if (typeof HTMLCanvasElement === 'undefined') {
    (globalThis as any).HTMLCanvasElement = class MockHTMLCanvasElement {
      width = 300;
      height = 150;
      getContext(type: string): MockCanvasRenderingContext2D | null {
        if (type === '2d') return new MockCanvasRenderingContext2D(this);
        return null;
      }
      toDataURL() { return 'data:image/png;base64,'; }
      toBlob(cb: Function) { cb(new Blob()); }
    };
  }

  if (typeof ImageData === 'undefined') {
    (globalThis as any).ImageData = class MockImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      colorSpace: string = 'srgb';
      constructor(dataOrWidth: Uint8ClampedArray | number, heightOrWidth: number, height?: number) {
        if (dataOrWidth instanceof Uint8ClampedArray) {
          this.data = dataOrWidth;
          this.width = heightOrWidth;
          this.height = height || dataOrWidth.length / (heightOrWidth * 4);
        } else {
          this.width = dataOrWidth;
          this.height = heightOrWidth;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        }
      }
    };
  }

  if (typeof DOMParser === 'undefined') {
    (globalThis as any).DOMParser = MockDOMParser;
  }
}

/**
 * Remove canvas mocks from global scope
 */
export function removeCanvasMocks(): void {
  delete (globalThis as any).OffscreenCanvas;
  delete (globalThis as any).OffscreenCanvasRenderingContext2D;
}

/**
 * Create a test ImageData filled with a specific color
 */
export function createTestImageData(
  width: number,
  height: number,
  color: [number, number, number, number] = [0, 0, 0, 255]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { data, width, height, colorSpace: 'srgb' as any } as ImageData;
}

/**
 * Create a test ImageData with a known pattern for verification
 * Pattern: gradient from (0,0,0) to (255,255,255) across width
 */
export function createGradientImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const val = Math.round((x / (width - 1)) * 255);
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  return { data, width, height, colorSpace: 'srgb' as any } as ImageData;
}
