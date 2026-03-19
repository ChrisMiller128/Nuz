import { SeededRNG } from './prng';
import type { GeneratorSettings } from '../index';

/**
 * Gen 3 Pokemon Randomizer (Ruby, Sapphire, Emerald, FireRed, LeafGreen)
 *
 * GBA Pokemon games store data in well-documented structures.
 * Species IDs are 16-bit values (little-endian) matching National Dex numbers.
 * This randomizer modifies wild encounters, starters, and trainer Pokemon.
 */

// Valid Gen 3 species: National Dex 1-386 (Gen I through III)
const MAX_SPECIES = 386;
const MIN_SPECIES = 1;

// Legendaries and mythicals to exclude from random encounters
const LEGENDARIES = new Set([
  144, 145, 146, 150, 151, // Gen 1
  243, 244, 245, 249, 250, 251, // Gen 2
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Gen 3
]);

function getEncounterPool(): number[] {
  const pool: number[] = [];
  for (let i = MIN_SPECIES; i <= MAX_SPECIES; i++) {
    if (!LEGENDARIES.has(i)) pool.push(i);
  }
  return pool;
}

const ENCOUNTER_POOL = getEncounterPool();

/** Read a 16-bit little-endian value */
function readU16(rom: Buffer, offset: number): number {
  return rom[offset] | (rom[offset + 1] << 8);
}

/** Write a 16-bit little-endian value */
function writeU16(rom: Buffer, offset: number, value: number): void {
  rom[offset] = value & 0xff;
  rom[offset + 1] = (value >> 8) & 0xff;
}

/** Read a 32-bit little-endian value */
function readU32(rom: Buffer, offset: number): number {
  return rom[offset] | (rom[offset + 1] << 8) | (rom[offset + 2] << 16) | (rom[offset + 3] << 24);
}

/**
 * GBA ROM addresses use 0x08000000 as the base. Convert pointer to file offset.
 */
function ptrToOffset(ptr: number): number {
  if (ptr >= 0x08000000 && ptr < 0x0A000000) {
    return ptr - 0x08000000;
  }
  return -1;
}

/**
 * Wild encounter data in Gen 3 has a specific structure:
 * - For each map: pointer to encounter data block
 * - Each block: [bank, map, padding, padding, grass_ptr, water_ptr, rock_ptr, fish_ptr]
 * - Grass block: [encounter_rate (4 bytes), then 12 entries of (min_level, max_level, species(2), padding(2))]
 * - Water block: similar with 5 entries
 * - Fishing block: similar with 10 entries
 *
 * We scan for the encounter table header to find all tables.
 */

interface WildEncounterEntry {
  offset: number; // offset of the species u16 in ROM
  minLevelOffset: number;
  maxLevelOffset: number;
}

/**
 * Searches for wild encounter table structures in the ROM.
 * Each grass encounter entry is 8 bytes: [min_level, max_level, species (u16), padding (u16)]
 * Grass tables have 12 entries, water/rock have 5, fishing has 10.
 */
function findWildEncounterTables(rom: Buffer): WildEncounterEntry[] {
  const entries: WildEncounterEntry[] = [];

  // Strategy: find the wild encounter header table by searching for a sequence
  // of valid GBA pointers followed by encounter data.
  // Emerald's wild data header table is near 0x552D48.
  // We scan a wider range to support different versions.

  const searchRanges = [
    [0x540000, 0x560000], // Emerald region
    [0x3C0000, 0x3E0000], // Ruby/Sapphire region
    [0x3C0000, 0x400000], // FireRed/LeafGreen region
  ];

  for (const [start, end] of searchRanges) {
    if (end > rom.length) continue;

    for (let i = start; i < end - 20; i++) {
      // Look for encounter header: bank(1), map(1), pad(2), 4 pointers
      const ptr1 = readU32(rom, i + 4);
      const ptr2 = readU32(rom, i + 8);
      const ptr3 = readU32(rom, i + 12);
      const ptr4 = readU32(rom, i + 16);

      // At least one pointer should be valid, others can be 0 (no encounters of that type)
      const validPtrs = [ptr1, ptr2, ptr3, ptr4].filter(
        p => p === 0 || (ptrToOffset(p) > 0 && ptrToOffset(p) < rom.length - 100)
      );

      if (validPtrs.length < 4) continue;
      const nonZero = [ptr1, ptr2, ptr3, ptr4].filter(p => p !== 0);
      if (nonZero.length === 0) continue;

      // Try to read grass encounters (ptr1)
      if (ptr1 !== 0) {
        const grassOffset = ptrToOffset(ptr1);
        if (grassOffset > 0 && grassOffset < rom.length - 100) {
          // Skip 4-byte encounter rate, then 12 entries of 8 bytes each
          const dataStart = grassOffset + 4;
          let allValid = true;

          for (let e = 0; e < 12; e++) {
            const entryOff = dataStart + e * 8;
            if (entryOff + 4 > rom.length) { allValid = false; break; }

            const minLv = rom[entryOff];
            const maxLv = rom[entryOff + 1];
            const species = readU16(rom, entryOff + 2);

            if (minLv < 2 || minLv > 70 || maxLv < 2 || maxLv > 70) { allValid = false; break; }
            if (minLv > maxLv) { allValid = false; break; }
            if (species < 1 || species > MAX_SPECIES) { allValid = false; break; }
          }

          if (allValid) {
            for (let e = 0; e < 12; e++) {
              const entryOff = dataStart + e * 8;
              entries.push({
                offset: entryOff + 2,
                minLevelOffset: entryOff,
                maxLevelOffset: entryOff + 1,
              });
            }
          }
        }
      }

      // Water encounters (ptr2) - 5 entries
      if (ptr2 !== 0) {
        const waterOffset = ptrToOffset(ptr2);
        if (waterOffset > 0 && waterOffset < rom.length - 50) {
          const dataStart = waterOffset + 4;
          let allValid = true;

          for (let e = 0; e < 5; e++) {
            const entryOff = dataStart + e * 8;
            if (entryOff + 4 > rom.length) { allValid = false; break; }
            const minLv = rom[entryOff];
            const maxLv = rom[entryOff + 1];
            const species = readU16(rom, entryOff + 2);
            if (minLv < 2 || minLv > 70 || maxLv < minLv || species < 1 || species > MAX_SPECIES) {
              allValid = false; break;
            }
          }

          if (allValid) {
            for (let e = 0; e < 5; e++) {
              const entryOff = dataStart + e * 8;
              entries.push({
                offset: entryOff + 2,
                minLevelOffset: entryOff,
                maxLevelOffset: entryOff + 1,
              });
            }
          }
        }
      }

      // Fishing encounters (ptr4) - 10 entries
      if (ptr4 !== 0) {
        const fishOffset = ptrToOffset(ptr4);
        if (fishOffset > 0 && fishOffset < rom.length - 90) {
          const dataStart = fishOffset + 4;
          let allValid = true;

          for (let e = 0; e < 10; e++) {
            const entryOff = dataStart + e * 8;
            if (entryOff + 4 > rom.length) { allValid = false; break; }
            const minLv = rom[entryOff];
            const maxLv = rom[entryOff + 1];
            const species = readU16(rom, entryOff + 2);
            if (minLv < 2 || minLv > 70 || maxLv < minLv || species < 1 || species > MAX_SPECIES) {
              allValid = false; break;
            }
          }

          if (allValid) {
            for (let e = 0; e < 10; e++) {
              const entryOff = dataStart + e * 8;
              entries.push({
                offset: entryOff + 2,
                minLevelOffset: entryOff,
                maxLevelOffset: entryOff + 1,
              });
            }
          }
        }
      }
    }
  }

  return entries;
}

/**
 * Alternative approach: scan the entire ROM for blocks that look like
 * encounter entries (sequences of valid min_level, max_level, species u16 patterns).
 */
function scanForEncounterPatterns(rom: Buffer): WildEncounterEntry[] {
  const entries: WildEncounterEntry[] = [];
  const seen = new Set<number>();

  for (let i = 0x100000; i < rom.length - 96; i += 4) {
    // Check for a block of 12 consecutive valid entries (grass format)
    let validCount = 0;
    for (let e = 0; e < 12; e++) {
      const off = i + e * 8;
      if (off + 4 > rom.length) break;
      const minLv = rom[off];
      const maxLv = rom[off + 1];
      const species = readU16(rom, off + 2);
      if (minLv >= 2 && minLv <= 65 && maxLv >= minLv && maxLv <= 70 && species >= 1 && species <= MAX_SPECIES) {
        validCount++;
      } else {
        break;
      }
    }

    if (validCount >= 5 && !seen.has(i)) {
      for (let e = 0; e < validCount; e++) {
        const off = i + e * 8;
        if (!seen.has(off)) {
          entries.push({
            offset: off + 2,
            minLevelOffset: off,
            maxLevelOffset: off + 1,
          });
          seen.add(off);
        }
      }
      i += validCount * 8 - 4;
    }
  }

  return entries;
}

/**
 * Find starter Pokemon in Emerald.
 * Starters (Treecko=277, Torchic=255, Mudkip=258) are stored
 * as u16 species IDs in the ROM.
 */
const EMERALD_STARTERS = [252, 255, 258]; // Treecko, Torchic, Mudkip
const FRLG_STARTERS = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
const RSE_STARTERS = [252, 255, 258];

function findStarterLocations(rom: Buffer): { offset: number; species: number }[] {
  const results: { offset: number; species: number }[] = [];
  const allStarters = [...new Set([...EMERALD_STARTERS, ...FRLG_STARTERS])];

  for (let i = 0; i < rom.length - 2; i++) {
    const species = readU16(rom, i);
    if (allStarters.includes(species)) {
      // Check if near other starters (within 64 bytes)
      let nearbyCount = 0;
      for (let j = Math.max(0, i - 64); j < Math.min(rom.length - 2, i + 64); j += 2) {
        if (j !== i && allStarters.includes(readU16(rom, j))) {
          nearbyCount++;
        }
      }
      if (nearbyCount >= 1) {
        results.push({ offset: i, species });
      }
    }
  }

  return results;
}

/**
 * Find trainer Pokemon data in Gen 3.
 * Trainer data structures contain species (u16), level (u16), and other fields.
 * The format varies but generally follows patterns we can detect.
 */
interface TrainerPokemonRef {
  speciesOffset: number;
  levelOffset: number;
}

function findTrainerPokemon(rom: Buffer): TrainerPokemonRef[] {
  const refs: TrainerPokemonRef[] = [];

  // Trainer Pokemon entries in Gen 3 are typically 8 bytes:
  // [iv_value(2), level(2), species(2), padding(2)]
  // or in expanded format: [iv(2), level(2), species(2), held_item(2), move1(2), move2(2), move3(2), move4(2), pad(2)]

  // Scan for sequences of valid trainer Pokemon entries
  const searchStart = 0x300000;
  const searchEnd = Math.min(rom.length - 32, 0x600000);

  for (let i = searchStart; i < searchEnd; i += 2) {
    let consecutiveValid = 0;
    const pokemonRefs: TrainerPokemonRef[] = [];

    for (let p = 0; p < 6; p++) {
      const entryOff = i + p * 8;
      if (entryOff + 6 > rom.length) break;

      const level = readU16(rom, entryOff + 2);
      const species = readU16(rom, entryOff + 4);

      if (level >= 2 && level <= 100 && species >= 1 && species <= MAX_SPECIES) {
        consecutiveValid++;
        pokemonRefs.push({ speciesOffset: entryOff + 4, levelOffset: entryOff + 2 });
      } else {
        break;
      }
    }

    if (consecutiveValid >= 2 && consecutiveValid <= 6) {
      refs.push(...pokemonRefs);
      i += consecutiveValid * 8 - 2;
    }
  }

  return refs;
}

export function randomizeGen3(rom: Buffer, settings: GeneratorSettings, seed: string): Buffer {
  const modified = Buffer.from(rom);
  const rng = new SeededRNG(seed);
  let changes = 0;

  // Randomize wild encounters
  if (settings.randomizeWildPokemon) {
    let encounters = findWildEncounterTables(modified);
    if (encounters.length < 10) {
      // Fall back to pattern scanning if structured search found too few
      encounters = scanForEncounterPatterns(modified);
    }

    for (const entry of encounters) {
      const minLv = modified[entry.minLevelOffset];
      let newSpecies: number;

      if (minLv <= 15) {
        // Early routes: favor basic Pokemon (lower Dex numbers tend to be weaker)
        const earlyPool = ENCOUNTER_POOL.filter(s => s <= 250);
        newSpecies = rng.pick(earlyPool.length > 0 ? earlyPool : ENCOUNTER_POOL);
      } else {
        newSpecies = rng.pick(ENCOUNTER_POOL);
      }

      writeU16(modified, entry.offset, newSpecies);
      changes++;
    }
  }

  // Randomize starters
  if (settings.randomizeStarters) {
    const starterLocs = findStarterLocations(modified);
    const newStarters = rng.shuffle([...ENCOUNTER_POOL]).slice(0, 3);

    // Determine which starter set this ROM uses
    const isRSE = starterLocs.some(s => RSE_STARTERS.includes(s.species));
    const isFRLG = starterLocs.some(s => FRLG_STARTERS.includes(s.species));

    const starterSet = isRSE ? RSE_STARTERS : (isFRLG ? FRLG_STARTERS : RSE_STARTERS);
    const starterMap = new Map<number, number>();
    for (let i = 0; i < starterSet.length; i++) {
      starterMap.set(starterSet[i], newStarters[i]);
    }

    for (const loc of starterLocs) {
      const replacement = starterMap.get(loc.species);
      if (replacement !== undefined) {
        writeU16(modified, loc.offset, replacement);
        changes++;
      }
    }
  }

  // Randomize trainers
  if (settings.randomizeTrainers) {
    const trainerPokemon = findTrainerPokemon(modified);
    for (const ref of trainerPokemon) {
      writeU16(modified, ref.speciesOffset, rng.pick(ENCOUNTER_POOL));

      if (settings.levelScaling !== 1.0) {
        const level = readU16(modified, ref.levelOffset);
        const newLevel = Math.max(2, Math.min(100, Math.round(level * settings.levelScaling)));
        writeU16(modified, ref.levelOffset, newLevel);
      }
      changes++;
    }
  } else if (settings.levelScaling !== 1.0) {
    const trainerPokemon = findTrainerPokemon(modified);
    for (const ref of trainerPokemon) {
      const level = readU16(modified, ref.levelOffset);
      const newLevel = Math.max(2, Math.min(100, Math.round(level * settings.levelScaling)));
      writeU16(modified, ref.levelOffset, newLevel);
      changes++;
    }
  }

  // Write metadata signature
  const sig = Buffer.from(`NUZ3|${seed}|${changes}`);
  if (modified.length > sig.length + 256) {
    sig.copy(modified, modified.length - sig.length - 64);
  }

  return modified;
}
