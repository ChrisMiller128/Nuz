/**
 * Universal Pokemon Randomizer ZX (UPR-ZX) Integration Module
 *
 * Architecture:
 * - UPR-ZX is a Java application that can randomize Pokemon ROMs
 * - This module wraps it as an external process that can be invoked
 * - The JAR location is configured via UPRZ_JAR_PATH env var
 * - Settings are translated from our format to UPR-ZX's CLI format
 *
 * Phase 1 (current):
 * - Wrapper architecture with settings translation
 * - Job model for async execution
 * - Clear error handling for missing/incompatible setups
 * - Falls back to builtin randomizer if UPR-ZX is not available
 *
 * Phase 2 (future):
 * - Download and install UPR-ZX automatically
 * - Full settings mapping for all UPR-ZX options
 * - Progress reporting via log parsing
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import prisma from '../prisma';
import { StoragePaths } from '../storage';
import type { GeneratorSettings } from './index';

const execFileAsync = promisify(execFile);

const UPRZ_JAR_PATH = process.env.UPRZ_JAR_PATH || '/opt/nuzlocke-hub/tools/PokeRandoZX.jar';
const JAVA_PATH = process.env.JAVA_PATH || 'java';

export interface UPRZConfig {
  jarPath: string;
  javaPath: string;
  available: boolean;
  version?: string;
}

export async function checkUPRZAvailability(): Promise<UPRZConfig> {
  const config: UPRZConfig = {
    jarPath: UPRZ_JAR_PATH,
    javaPath: JAVA_PATH,
    available: false,
  };

  try {
    await fs.access(UPRZ_JAR_PATH);
  } catch {
    return config;
  }

  try {
    const { stdout } = await execFileAsync(JAVA_PATH, ['-version'], { timeout: 5000 });
    config.version = stdout.trim().split('\n')[0];
    config.available = true;
  } catch {
    // Java not available
  }

  return config;
}

/**
 * Translates our GeneratorSettings to a UPR-ZX compatible settings object.
 * UPR-ZX uses a serialized settings file (.rnqs format).
 * For CLI invocation, we generate a temporary settings file.
 */
export function translateSettingsToUPRZ(settings: GeneratorSettings): Record<string, unknown> {
  return {
    randomizeStarters: settings.randomizeStarters,
    randomizeWildPokemon: settings.randomizeWildPokemon,
    randomizeTrainerPokes: settings.randomizeTrainers,
    randomizeStaticPokemon: false,
    randomizeItems: settings.randomizeItems,
    randomizeMovePower: settings.randomizeMoves,
    randomizeAbilities: settings.randomizeAbilities,
    randomizeTMHMCompat: settings.randomizeTMs,
    updateMoves: settings.updateMoves,
    removeImpossibleEvos: settings.impossibleEvosRemoved,
    changeMinCatchRate: settings.minCatchRate > 0,
    minCatchRateValue: settings.minCatchRate,
  };
}

/**
 * Invokes UPR-ZX to randomize a ROM.
 * Returns the path to the randomized ROM file.
 */
export async function invokeUPRZ(params: {
  inputRomPath: string;
  outputRomPath: string;
  settings: GeneratorSettings;
  seed: string;
  generatedRomId: string;
}): Promise<{ success: boolean; log: string; error?: string }> {
  const config = await checkUPRZAvailability();

  if (!config.available) {
    return {
      success: false,
      log: '',
      error: `UPR-ZX not available. JAR: ${config.jarPath}, Java: ${config.javaPath}`,
    };
  }

  // Update job status
  await prisma.generatorJob.upsert({
    where: { generatedRomId: params.generatedRomId },
    create: {
      generatedRomId: params.generatedRomId,
      provider: 'uprz',
      status: 'RUNNING',
      startedAt: new Date(),
    },
    update: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  // Write settings to temp file
  const settingsPath = path.join(StoragePaths.tmp, `uprz_settings_${params.generatedRomId}.json`);
  const uprzSettings = translateSettingsToUPRZ(params.settings);
  await fs.writeFile(settingsPath, JSON.stringify(uprzSettings, null, 2));

  try {
    const { stdout, stderr } = await execFileAsync(
      config.javaPath,
      [
        '-jar', config.jarPath,
        'cli',
        '-i', params.inputRomPath,
        '-o', params.outputRomPath,
        '-s', settingsPath,
        '-seed', params.seed,
      ],
      { timeout: 120000 } // 2 minute timeout
    );

    const log = `${stdout}\n${stderr}`;

    await prisma.generatorJob.update({
      where: { generatedRomId: params.generatedRomId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progress: 100,
        logOutput: log.slice(0, 10000),
      },
    });

    return { success: true, log };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    await prisma.generatorJob.update({
      where: { generatedRomId: params.generatedRomId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: errMsg.slice(0, 2000),
      },
    });

    return { success: false, log: '', error: errMsg };
  } finally {
    try { await fs.unlink(settingsPath); } catch {}
  }
}

/**
 * Returns supported platforms/games for UPR-ZX.
 * UPR-ZX supports Gen 1-5 (GB, GBC, GBA, NDS).
 */
export function getUPRZSupportedPlatforms(): string[] {
  return ['GB', 'GBC', 'GBA', 'NDS'];
}

export function isUPRZCompatible(platform: string): boolean {
  return getUPRZSupportedPlatforms().includes(platform);
}
