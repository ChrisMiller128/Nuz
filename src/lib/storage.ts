import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), 'storage');

export const StoragePaths = {
  baseRoms: process.env.STORAGE_BASE_ROMS || path.join(STORAGE_ROOT, 'base-roms'),
  generatedRoms: process.env.STORAGE_GENERATED_ROMS || path.join(STORAGE_ROOT, 'generated-roms'),
  saves: process.env.STORAGE_SAVES || path.join(STORAGE_ROOT, 'saves'),
  screenshots: process.env.STORAGE_SCREENSHOTS || path.join(STORAGE_ROOT, 'screenshots'),
  tmp: process.env.STORAGE_TMP || path.join(STORAGE_ROOT, 'tmp'),
};

export async function ensureStorageDirs(): Promise<void> {
  for (const dir of Object.values(StoragePaths)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function getUserStoragePath(basePath: string, userId: string): string {
  return path.join(basePath, userId);
}

export async function saveFile(
  basePath: string,
  userId: string,
  fileName: string,
  data: Buffer
): Promise<{ storagePath: string; fileSize: number; checksum: string }> {
  const userDir = getUserStoragePath(basePath, userId);
  await fs.mkdir(userDir, { recursive: true });

  const uniqueName = `${Date.now()}_${fileName}`;
  const storagePath = path.join(userDir, uniqueName);

  await fs.writeFile(storagePath, data);

  return {
    storagePath,
    fileSize: data.length,
    checksum: computeChecksum(data),
  };
}

export async function readFile(storagePath: string): Promise<Buffer> {
  return fs.readFile(storagePath);
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await fs.unlink(storagePath);
  } catch {
    // File may already be deleted
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const MAX_ROM_SIZE = parseInt(process.env.MAX_ROM_SIZE || '67108864', 10); // 64MB
const MAX_SAVE_SIZE = parseInt(process.env.MAX_SAVE_SIZE || '16777216', 10); // 16MB

export function validateFileSize(size: number, type: 'rom' | 'save'): boolean {
  const max = type === 'rom' ? MAX_ROM_SIZE : MAX_SAVE_SIZE;
  return size > 0 && size <= max;
}

const ALLOWED_ROM_EXTENSIONS = ['.gb', '.gbc', '.gba', '.nds', '.zip'];
const ALLOWED_SAVE_EXTENSIONS = ['.sav', '.srm', '.dsv', '.sta', '.ss0', '.ss1', '.ss2'];

export function validateFileExtension(fileName: string, type: 'rom' | 'save'): boolean {
  const ext = path.extname(fileName).toLowerCase();
  const allowed = type === 'rom' ? ALLOWED_ROM_EXTENSIONS : ALLOWED_SAVE_EXTENSIONS;
  return allowed.includes(ext);
}
