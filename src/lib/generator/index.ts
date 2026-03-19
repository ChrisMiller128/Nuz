import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { computeChecksum, StoragePaths, getUserStoragePath } from '../storage';
import prisma from '../prisma';
import { randomizeGen1 } from './randomizers/gen1';
import { randomizeGen3 } from './randomizers/gen3';

export interface GeneratorSettings {
  randomizeStarters: boolean;
  randomizeWildPokemon: boolean;
  randomizeTrainers: boolean;
  randomizeItems: boolean;
  randomizeMoves: boolean;
  randomizeAbilities: boolean;
  randomizeTMs: boolean;
  evolutionChanges: 'none' | 'random' | 'similar-strength';
  typeEffectiveness: 'vanilla' | 'random' | 'inverse';
  levelScaling: number; // multiplier, e.g. 1.0 = normal, 1.5 = 50% harder
  minCatchRate: number; // 0-255, higher = easier to catch
  expModifier: number; // multiplier for exp gain
  impossibleEvosRemoved: boolean;
  updateMoves: boolean;
  starterPreference: 'random' | 'balanced' | 'strong' | 'custom';
  customStarterIds?: number[];
}

export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  randomizeStarters: false,
  randomizeWildPokemon: false,
  randomizeTrainers: false,
  randomizeItems: false,
  randomizeMoves: false,
  randomizeAbilities: false,
  randomizeTMs: false,
  evolutionChanges: 'none',
  typeEffectiveness: 'vanilla',
  levelScaling: 1.0,
  minCatchRate: 0,
  expModifier: 1.0,
  impossibleEvosRemoved: false,
  updateMoves: false,
  starterPreference: 'random',
};

export const PRESET_CONFIGS: Record<string, Partial<GeneratorSettings>> = {
  classic: {
    randomizeStarters: false,
    randomizeWildPokemon: false,
    randomizeTrainers: false,
    levelScaling: 1.0,
  },
  randomized: {
    randomizeStarters: true,
    randomizeWildPokemon: true,
    randomizeTrainers: true,
    randomizeItems: true,
    levelScaling: 1.0,
  },
  hardcore: {
    randomizeStarters: false,
    randomizeWildPokemon: false,
    randomizeTrainers: false,
    levelScaling: 1.3,
    minCatchRate: 0,
    expModifier: 0.8,
  },
  chaosRandomized: {
    randomizeStarters: true,
    randomizeWildPokemon: true,
    randomizeTrainers: true,
    randomizeItems: true,
    randomizeMoves: true,
    randomizeAbilities: true,
    randomizeTMs: true,
    evolutionChanges: 'random',
    levelScaling: 1.2,
  },
};

function generateSeed(): string {
  return crypto.randomBytes(8).toString('hex');
}

type Platform = 'GB' | 'GBC' | 'GBA' | 'NDS';

/**
 * Applies real Pokemon randomization to a ROM buffer based on the platform.
 * Uses platform-specific randomizers that understand the ROM data structures
 * for each generation of Pokemon games.
 *
 * - Gen 1 (GB/GBC): Modifies wild encounter tables, starters, trainer Pokemon
 * - Gen 3 (GBA): Modifies wild encounter tables, starters, trainer Pokemon
 * - Gen 4/5 (NDS): Falls back to signature-only (complex compressed formats)
 */
function applyGeneratorModifications(
  romBuffer: Buffer,
  settings: GeneratorSettings,
  seed: string,
  platform: Platform
): Buffer {
  switch (platform) {
    case 'GB':
    case 'GBC':
      return randomizeGen1(romBuffer, settings, seed);
    case 'GBA':
      return randomizeGen3(romBuffer, settings, seed);
    case 'NDS':
    default: {
      // NDS ROMs use compressed overlays; real randomization requires
      // decompression support. For now, write a metadata signature only.
      const modified = Buffer.from(romBuffer);
      const sig = Buffer.from(`NUZN|${seed}|0`);
      if (modified.length > sig.length + 256) {
        sig.copy(modified, modified.length - sig.length - 64);
      }
      return modified;
    }
  }
}

export interface GenerateRomResult {
  generatedRomId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  seed: string;
  settings: GeneratorSettings;
}

export async function generateRom(params: {
  userId: string;
  baseRomId: string;
  runId?: string;
  settings: GeneratorSettings;
  seed?: string;
  generatorProfileId?: string;
}): Promise<GenerateRomResult> {
  const { userId, baseRomId, settings, generatorProfileId } = params;
  const seed = params.seed || generateSeed();

  const baseRom = await prisma.baseRom.findUnique({
    where: { id: baseRomId },
    include: { game: true },
  });

  if (!baseRom) {
    throw new Error('Base ROM not found');
  }

  // Read the base ROM file
  let romBuffer: Buffer;
  try {
    romBuffer = await fs.readFile(baseRom.storagePath);
  } catch {
    throw new Error(`Base ROM file not found at ${baseRom.storagePath}. Please upload the ROM file first.`);
  }

  const platform = baseRom.game.platform as Platform;

  // Apply real Pokemon randomization based on platform
  const modifiedRom = applyGeneratorModifications(romBuffer, settings, seed, platform);

  // Compute checksum of the generated ROM
  const checksum = computeChecksum(modifiedRom);

  // Generate file name
  const ext = path.extname(baseRom.fileName) || '.gb';
  const safeName = baseRom.game.slug.replace(/[^a-z0-9-]/g, '');
  const fileName = `${safeName}_nuzlocke_${seed.slice(0, 8)}${ext}`;

  // Save to user's generated ROM storage
  const userDir = getUserStoragePath(StoragePaths.generatedRoms, userId);
  await fs.mkdir(userDir, { recursive: true });
  const storagePath = path.join(userDir, fileName);
  await fs.writeFile(storagePath, modifiedRom);

  // Create database record
  const generatedRom = await prisma.generatedRom.create({
    data: {
      userId,
      baseRomId,
      generatorProfileId: generatorProfileId || null,
      generatorSettingsJson: settings as object,
      seed,
      checksum,
      storagePath,
      fileName,
      fileSize: BigInt(modifiedRom.length),
      status: 'READY',
    },
  });

  return {
    generatedRomId: generatedRom.id,
    storagePath,
    fileName,
    fileSize: modifiedRom.length,
    checksum,
    seed,
    settings,
  };
}

export async function getGeneratedRom(generatedRomId: string, userId: string) {
  const rom = await prisma.generatedRom.findFirst({
    where: { id: generatedRomId, userId },
    include: { baseRom: { include: { game: true } } },
  });

  if (!rom) {
    throw new Error('Generated ROM not found or access denied');
  }

  return rom;
}

export async function getUserGeneratedRoms(userId: string) {
  return prisma.generatedRom.findMany({
    where: { userId },
    include: { baseRom: { include: { game: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
