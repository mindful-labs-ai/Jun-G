declare module 'gifenc' {
  export type RGBA = Uint8Array | Uint8ClampedArray;
  export type Palette = number[][]; // [r,g,b] or [r,g,b,a]

  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  }

  export function quantize(rgba: RGBA, maxColors: number, options?: QuantizeOptions): Palette;
  export function applyPalette(rgba: RGBA, palette: Palette, format?: 'rgb565' | 'rgb444' | 'rgba4444'): Uint8Array;

  export interface GIFEncoderInstance {
    writeFrame(
      indexed: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: Palette;
        first?: boolean;
        transparent?: boolean;
        transparentIndex?: number;
        delay?: number;     // ms
        repeat?: number;    // -1 once, 0 forever
        dispose?: number;   // advanced
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    writeHeader(): void;
    reset(): void;
    readonly buffer: ArrayBuffer;
    readonly stream: {
      writeByte(b: number): void;
      writeBytes(arr: Uint8Array, offset?: number, byteLength?: number): void;
    };
  }

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance;

  export function nearestColorIndex(palette: Palette, pixel: number[]): number;
  export function nearestColorIndexWithDistance(palette: Palette, pixel: number[]): [number, number];
}