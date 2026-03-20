import { SeededRNG } from './prng';
import type { GeneratorSettings } from '../index';

/**
 * Gen 3 Pokemon Randomizer (Ruby, Sapphire, Emerald, FireRed, LeafGreen)
 *
 * Uses ROM header identification + targeted data searches rather
 * than broad heuristic scanning. GBA ROMs store encounter data
 * in well-documented pointer table structures.
 */

const MAX_SPECIES = 386;
const LEGENDARIES = new Set([
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
]);

const ENCOUNTER_POOL: number[] = [];
for (let i = 1; i <= MAX_SPECIES; i++) {
  if (!LEGENDARIES.has(i)) ENCOUNTER_POOL.push(i);
}

function readU16(rom: Buffer, offset: number): number {
  return rom[offset] | (rom[offset + 1] << 8);
}

function writeU16(rom: Buffer, offset: number, value: number): void {
  rom[offset] = value & 0xff;
  rom[offset + 1] = (value >> 8) & 0xff;
}

function readU32(rom: Buffer, offset: number): number {
  return (rom[offset] | (rom[offset + 1] << 8) | (rom[offset + 2] << 16) | (rom[offset + 3] << 24)) >>> 0;
}

function ptrToOffset(ptr: number): number {
  if (ptr >= 0x08000000 && ptr < 0x0A000000) return ptr - 0x08000000;
  return -1;
}

function getGameCode(rom: Buffer): string {
  return rom.subarray(0xAC, 0xB0).toString('ascii');
}

/**
 * Known wild encounter table header pointers for specific games.
 * These point to the array of encounter set headers.
 */
const KNOWN_ENCOUNTER_TABLE_PTRS: Record<string, number> = {
  'BPEE': 0x552D48, // Emerald (USA)
  'BPEJ': 0x552D48, // Emerald (JPN)
  'AXVE': 0x3C9CB8, // Ruby (USA)
  'AXPE': 0x3C9D18, // Sapphire (USA)
  'BPRE': 0x3C9358, // FireRed (USA)
  'BPGE': 0x3C9874, // LeafGreen (USA)
};

interface EncounterSlot {
  speciesOffset: number;
  minLevelOffset: number;
  maxLevelOffset: number;
}

/**
 * Finds all encounter slots by following the encounter table pointer structure.
 * Each header: [bank(1), map(1), pad(2), grass_ptr(4), water_ptr(4), rock_ptr(4), fish_ptr(4)]
 */
function findEncounterSlots(rom: Buffer): EncounterSlot[] {
  const slots: EncounterSlot[] = [];
  const gameCode = getGameCode(rom);

  // Try known pointer first
  let headerTableOffset: number | null = KNOWN_ENCOUNTER_TABLE_PTRS[gameCode] ?? null;

  // If not known, search for the encounter table by looking for a sequence
  // of valid encounter headers
  if (!headerTableOffset || headerTableOffset >= rom.length) {
    headerTableOffset = searchForEncounterTable(rom);
  }

  if (!headerTableOffset) {
    console.log('[Gen3 Randomizer] Could not find encounter table pointer');
    return slots;
  }

  console.log(`[Gen3 Randomizer] Encounter table at 0x${headerTableOffset.toString(16)}`);

  // Each header is 20 bytes
  let offset = headerTableOffset;
  let tableCount = 0;

  while (offset + 20 <= rom.length && tableCount < 200) {
    const grassPtr = readU32(rom, offset + 4);
    const waterPtr = readU32(rom, offset + 8);
    const rockPtr = readU32(rom, offset + 12);
    const fishPtr = readU32(rom, offset + 16);

    // End of table marker (all zeros or invalid)
    if (grassPtr === 0 && waterPtr === 0 && rockPtr === 0 && fishPtr === 0) {
      // Check if next header is also all zeros (end of table)
      const nextGrass = readU32(rom, offset + 24);
      if (nextGrass === 0) break;
    }

    // Parse grass encounters (12 entries, each 8 bytes: minLv, maxLv, species(u16), pad(u16), pad(u16))
    if (grassPtr !== 0) {
      const grassOff = ptrToOffset(grassPtr);
      if (grassOff > 0 && grassOff + 100 < rom.length) {
        parseEncounterBlock(rom, grassOff, 12, slots);
      }
    }

    // Water encounters (5 entries)
    if (waterPtr !== 0) {
      const waterOff = ptrToOffset(waterPtr);
      if (waterOff > 0 && waterOff + 44 < rom.length) {
        parseEncounterBlock(rom, waterOff, 5, slots);
      }
    }

    // Rock smash encounters (5 entries)
    if (rockPtr !== 0) {
      const rockOff = ptrToOffset(rockPtr);
      if (rockOff > 0 && rockOff + 44 < rom.length) {
        parseEncounterBlock(rom, rockOff, 5, slots);
      }
    }

    // Fishing encounters (10 entries)
    if (fishPtr !== 0) {
      const fishOff = ptrToOffset(fishPtr);
      if (fishOff > 0 && fishOff + 84 < rom.length) {
        parseEncounterBlock(rom, fishOff, 10, slots);
      }
    }

    offset += 20;
    tableCount++;
  }

  return slots;
}

function parseEncounterBlock(rom: Buffer, blockOffset: number, entryCount: number, slots: EncounterSlot[]): void {
  // Skip 4-byte encounter rate, then parse entries
  // Each entry: minLevel(1), maxLevel(1), species(u16), padding(u16) = wrong
  // Actually: each entry is 4 bytes: minLevel(1), maxLevel(1), species(u16)
  const dataStart = blockOffset + 4;

  for (let e = 0; e < entryCount; e++) {
    const entryOff = dataStart + e * 4;
    if (entryOff + 4 > rom.length) break;

    const minLv = rom[entryOff];
    const maxLv = rom[entryOff + 1];
    const species = readU16(rom, entryOff + 2);

    if (minLv >= 2 && minLv <= 70 && maxLv >= minLv && maxLv <= 70 && species >= 1 && species <= MAX_SPECIES) {
      slots.push({
        speciesOffset: entryOff + 2,
        minLevelOffset: entryOff,
        maxLevelOffset: entryOff + 1,
      });
    }
  }
}

/**
 * Fallback: search for encounter table header by finding a sequence of
 * valid GBA pointers that form encounter headers.
 */
function searchForEncounterTable(rom: Buffer): number | null {
  // Look for 3+ consecutive valid encounter headers (20 bytes each)
  for (let i = 0x100000; i < rom.length - 80; i += 4) {
    let consecutiveValid = 0;

    for (let h = 0; h < 5; h++) {
      const off = i + h * 20;
      if (off + 20 > rom.length) break;

      const grassPtr = readU32(rom, off + 4);
      const waterPtr = readU32(rom, off + 8);

      const grassOff = ptrToOffset(grassPtr);
      const waterOff = waterPtr === 0 ? 0 : ptrToOffset(waterPtr);

      if (grassOff > 0 && grassOff < rom.length - 50 && (waterOff === 0 || (waterOff > 0 && waterOff < rom.length))) {
        // Validate the grass data looks like encounter entries
        const dataStart = grassOff + 4;
        if (dataStart + 48 < rom.length) {
          const minLv = rom[dataStart];
          const maxLv = rom[dataStart + 1];
          const species = readU16(rom, dataStart + 2);
          if (minLv >= 2 && minLv <= 60 && maxLv >= minLv && species >= 1 && species <= MAX_SPECIES) {
            consecutiveValid++;
          }
        }
      }
    }

    if (consecutiveValid >= 3) {
      return i;
    }
  }

  return null;
}

/**
 * Find starter Pokemon by searching for the three starters near each
 * other as u16 values in the ROM's script/data sections.
 */
const EMERALD_STARTERS = [252, 255, 258]; // Treecko, Torchic, Mudkip
const FRLG_STARTERS = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle

function findStarterLocations(rom: Buffer): Map<number, number> {
  const refs = new Map<number, number>();
  const gameCode = getGameCode(rom);
  const starters = gameCode.startsWith('BP') && (gameCode[2] === 'R' || gameCode[2] === 'G')
    ? FRLG_STARTERS
    : EMERALD_STARTERS;

  for (let i = 0; i < rom.length - 2; i += 2) {
    const val = readU16(rom, i);
    if (!starters.includes(val)) continue;

    // Check if other starters are nearby (within 32 bytes)
    let nearby = 0;
    for (let j = Math.max(0, i - 32); j < Math.min(rom.length - 2, i + 32); j += 2) {
      if (j !== i && starters.includes(readU16(rom, j))) nearby++;
    }

    if (nearby >= 1) {
      refs.set(i, val);
    }
  }

  return refs;
}

/**
 * Find trainer Pokemon. Gen 3 trainer entries vary by format:
 * - Standard: [ivs(2), level(2), species(2)]  (6 bytes per Pokemon)
 * - With moves: [ivs(2), level(2), species(2), move1(2), move2(2), move3(2), move4(2)] (16 bytes)
 */
function findTrainerPokemon(rom: Buffer): Array<{ speciesOffset: number; levelOffset: number }> {
  const results: Array<{ speciesOffset: number; levelOffset: number }> = [];
  const gameCode = getGameCode(rom);

  // Known trainer data offsets
  const trainerRanges: Record<string, [number, number]> = {
    'BPEE': [0x310030, 0x330000], // Emerald
    'AXVE': [0x1F0000, 0x210000], // Ruby
    'AXPE': [0x1F0000, 0x210000], // Sapphire
    'BPRE': [0x2397F4, 0x260000], // FireRed
    'BPGE': [0x2397F4, 0x260000], // LeafGreen
  };

  const range = trainerRanges[gameCode] || [0x200000, Math.min(rom.length, 0x400000)];

  // Scan for 6-byte trainer Pokemon entries (standard format)
  for (let i = range[0]; i < range[1] && i < rom.length - 12; i += 2) {
    let validCount = 0;
    const refs: Array<{ speciesOffset: number; levelOffset: number }> = [];

    for (let p = 0; p < 6; p++) {
      const entryOff = i + p * 8;
      if (entryOff + 6 > rom.length) break;

      const level = readU16(rom, entryOff + 2);
      const species = readU16(rom, entryOff + 4);

      if (level >= 2 && level <= 100 && species >= 1 && species <= MAX_SPECIES) {
        validCount++;
        refs.push({ speciesOffset: entryOff + 4, levelOffset: entryOff + 2 });
      } else {
        break;
      }
    }

    if (validCount >= 2 && validCount <= 6) {
      results.push(...refs);
      i += validCount * 8 - 2;
    }
  }

  return results;
}

export function randomizeGen3(rom: Buffer, settings: GeneratorSettings, seed: string): Buffer {
  const modified = Buffer.from(rom);
  const rng = new SeededRNG(seed);
  let changes = 0;

  const gameCode = getGameCode(modified);
  console.log(`[Gen3 Randomizer] Game code: "${gameCode}", size: ${modified.length} bytes`);

  // Randomize wild encounters
  if (settings.randomizeWildPokemon) {
    const slots = findEncounterSlots(modified);
    console.log(`[Gen3 Randomizer] Found ${slots.length} wild encounter slots`);

    for (const slot of slots) {
      const minLv = modified[slot.minLevelOffset];
      let newSpecies: number;
      if (minLv <= 15) {
        const earlyPool = ENCOUNTER_POOL.filter(s => s <= 250);
        newSpecies = rng.pick(earlyPool.length > 0 ? earlyPool : ENCOUNTER_POOL);
      } else {
        newSpecies = rng.pick(ENCOUNTER_POOL);
      }
      writeU16(modified, slot.speciesOffset, newSpecies);
      changes++;
    }
  }

  // Randomize starters
  if (settings.randomizeStarters) {
    const starterRefs = findStarterLocations(modified);
    console.log(`[Gen3 Randomizer] Found ${starterRefs.size} starter references`);

    if (starterRefs.size > 0) {
      const newStarters = rng.shuffle([...ENCOUNTER_POOL]).slice(0, 3);
      const starters = gameCode.startsWith('BP') && (gameCode[2] === 'R' || gameCode[2] === 'G')
        ? FRLG_STARTERS : EMERALD_STARTERS;

      const starterMap = new Map<number, number>();
      for (let i = 0; i < starters.length; i++) {
        starterMap.set(starters[i], newStarters[i]);
      }

      for (const [offset, original] of starterRefs) {
        const replacement = starterMap.get(original);
        if (replacement !== undefined) {
          writeU16(modified, offset, replacement);
          changes++;
        }
      }
    }
  }

  // Randomize trainers
  if (settings.randomizeTrainers) {
    const trainers = findTrainerPokemon(modified);
    console.log(`[Gen3 Randomizer] Found ${trainers.length} trainer Pokemon`);

    for (const ref of trainers) {
      writeU16(modified, ref.speciesOffset, rng.pick(ENCOUNTER_POOL));
      if (settings.levelScaling !== 1.0) {
        const level = readU16(modified, ref.levelOffset);
        writeU16(modified, ref.levelOffset, Math.max(2, Math.min(100, Math.round(level * settings.levelScaling))));
      }
      changes++;
    }
  } else if (settings.levelScaling !== 1.0) {
    const trainers = findTrainerPokemon(modified);
    for (const ref of trainers) {
      const level = readU16(modified, ref.levelOffset);
      writeU16(modified, ref.levelOffset, Math.max(2, Math.min(100, Math.round(level * settings.levelScaling))));
      changes++;
    }
  }

  const sig = Buffer.from(`NUZ3|${seed}|${changes}`);
  if (modified.length > sig.length + 256) {
    sig.copy(modified, modified.length - sig.length - 64);
  }

  console.log(`[Gen3 Randomizer] Total changes: ${changes}`);
  return modified;
}
