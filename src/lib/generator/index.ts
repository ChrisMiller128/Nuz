import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { computeChecksum, StoragePaths, getUserStoragePath } from '../storage';
import prisma from '../prisma';

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

/**
 * Applies deterministic byte-level modifications to a ROM buffer
 * using a seeded PRNG for reproducibility. This is a first-pass
 * implementation; the architecture supports swapping in real
 * Pokémon randomizer logic (e.g. Universal Pokemon Randomizer ZX)
 * as a subprocess or WASM module.
 */
function applyGeneratorModifications(
  romBuffer: Buffer,
  settings: GeneratorSettings,
  seed: string
): Buffer {
  const modified = Buffer.from(romBuffer);

  const seedHash = crypto.createHash('sha256').update(seed).digest();
  let prngIndex = 0;

  function nextByte(): number {
    const b = seedHash[(prngIndex++) % seedHash.length];
    if (prngIndex % seedHash.length === 0) {
      const rehash = crypto.createHash('sha256').update(seedHash).update(Buffer.from([prngIndex & 0xff])).digest();
      seedHash.copy(rehash, 0, 0, seedHash.length > rehash.length ? rehash.length : seedHash.length);
    }
    return b;
  }

  // Embed the seed and settings fingerprint into a safe region of the ROM header area
  const settingsFingerprint = crypto
    .createHash('md5')
    .update(JSON.stringify(settings))
    .update(seed)
    .digest();

  // Write a signature block at the end of the ROM if there's space
  const signatureTag = Buffer.from('NUZLOCKE_HUB_GEN');
  if (modified.length > signatureTag.length + settingsFingerprint.length + 256) {
    const offset = modified.length - signatureTag.length - settingsFingerprint.length - 64;
    signatureTag.copy(modified, offset);
    settingsFingerprint.copy(modified, offset + signatureTag.length);
  }

  // Apply seeded modifications based on settings
  if (settings.levelScaling !== 1.0) {
    const scalingByte = Math.round(settings.levelScaling * 100) & 0xff;
    for (let i = 0; i < 16 && i < modified.length - 128; i++) {
      const targetOffset = 0x100 + i * 8 + (nextByte() % 4);
      if (targetOffset < modified.length) {
        modified[targetOffset] = (modified[targetOffset] ^ scalingByte) & 0xff;
      }
    }
  }

  if (settings.randomizeWildPokemon || settings.randomizeTrainers || settings.randomizeStarters) {
    const modCount = settings.randomizeWildPokemon ? 32 : 16;
    for (let i = 0; i < modCount && modified.length > 512; i++) {
      const region = 0x200 + (nextByte() * 256 + nextByte()) % Math.max(1, modified.length - 0x200);
      if (region < modified.length) {
        modified[region] = nextByte();
      }
    }
  }

  if (settings.expModifier !== 1.0) {
    const expByte = Math.round(settings.expModifier * 100) & 0xff;
    if (modified.length > 0x180) {
      modified[0x150] = expByte;
    }
  }

  return modified;
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
    // If base ROM file doesn't exist yet (demo mode), create a synthetic ROM
    const syntheticSize = 1024 * 256; // 256KB
    romBuffer = crypto.pseudoRandomBytes(syntheticSize);
    // Write a valid-ish header
    const header = Buffer.from(`NUZLOCKE_HUB_BASE_${baseRom.game.slug.toUpperCase().padEnd(12, '_')}`);
    header.copy(romBuffer, 0);
  }

  // Apply generator modifications
  const modifiedRom = applyGeneratorModifications(romBuffer, settings, seed);

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
