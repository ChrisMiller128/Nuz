/**
 * Emulator adapter abstraction layer.
 *
 * Each platform family (GB/GBC, GBA, NDS) can be backed by a different
 * open-source emulator. The adapter pattern keeps integration modular
 * and replaceable.
 *
 * Recommended open-source emulators:
 * - GB/GBC: GameBoy-Online / binjgb (JS)
 * - GBA: mGBA / VisualBoyAdvance-M (via mGBA WASM build)
 * - NDS: DeSmuME / melonDS (WASM builds in progress)
 *
 * For the browser integration, we use EmulatorJS which provides
 * a unified wrapper around RetroArch cores compiled to WASM.
 */

export type EmulatorPlatform = 'GB' | 'GBC' | 'GBA' | 'NDS';

export interface EmulatorConfig {
  platform: EmulatorPlatform;
  romUrl: string;
  saveStateUrl?: string;
  controls: ControlMapping;
  autoSaveInterval?: number; // seconds
  enableSound: boolean;
  screenScale: number;
}

export interface ControlMapping {
  up: string;
  down: string;
  left: string;
  right: string;
  a: string;
  b: string;
  start: string;
  select: string;
  l?: string;
  r?: string;
  x?: string;
  y?: string;
}

export const DEFAULT_KEYBOARD_CONTROLS: ControlMapping = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'x',
  b: 'z',
  start: 'Enter',
  select: 'Shift',
  l: 'a',
  r: 's',
  x: 'd',
  y: 'c',
};

export function getCoreForPlatform(platform: EmulatorPlatform): string {
  switch (platform) {
    case 'GB':
    case 'GBC':
      return 'gambatte';
    case 'GBA':
      return 'mgba';
    case 'NDS':
      return 'melonds';
    default:
      return 'gambatte';
  }
}

export function getPlatformDisplayName(platform: EmulatorPlatform): string {
  switch (platform) {
    case 'GB': return 'Game Boy';
    case 'GBC': return 'Game Boy Color';
    case 'GBA': return 'Game Boy Advance';
    case 'NDS': return 'Nintendo DS';
    default: return platform;
  }
}

export function getPlatformColor(platform: EmulatorPlatform): string {
  switch (platform) {
    case 'GB': return '#9bbc0f';
    case 'GBC': return '#8b5cf6';
    case 'GBA': return '#7b68ee';
    case 'NDS': return '#1e90ff';
    default: return '#e94560';
  }
}

export function getEmulatorJSConfig(config: EmulatorConfig) {
  return {
    EJS_player: '#emulator-container',
    EJS_core: getCoreForPlatform(config.platform),
    EJS_gameUrl: config.romUrl,
    EJS_pathtodata: 'https://cdn.emulatorjs.org/stable/data/',
    EJS_startOnLoaded: true,
    EJS_oldCores: false,
    EJS_biosUrl: '',
    EJS_color: '#e94560',
    EJS_backgroundColor: '#0f0f1a',
    EJS_fullscreenOnLoaded: false,
    EJS_alignToCenter: true,
    ...(config.saveStateUrl ? { EJS_loadStateURL: config.saveStateUrl } : {}),
  };
}

export interface SaveStateData {
  data: ArrayBuffer;
  timestamp: number;
  slot: number;
  isAutosave: boolean;
}

export interface EmulatorCallbacks {
  onSaveState: (data: SaveStateData) => Promise<void>;
  onLoadState: (slot: number) => Promise<ArrayBuffer | null>;
  onAutoSave: (data: SaveStateData) => Promise<void>;
  onScreenshot: (imageData: Blob) => Promise<void>;
}
