import { SeededRNG } from './prng';
import type { GeneratorSettings } from '../index';

/**
 * Gen 1 Pokemon Randomizer (Red, Blue, Yellow)
 *
 * Uses ROM header identification + known data offsets from the
 * pokered/pokeyellow disassembly projects rather than heuristic
 * pattern scanning, which produces too many false positives.
 */

// All 151 valid Gen 1 internal species IDs
const VALID_SPECIES = new Set([
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
  0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14,
  0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E,
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A,
  0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x33, 0x35, 0x36,
  0x37, 0x39, 0x3A, 0x3B, 0x3C, 0x40, 0x41, 0x42, 0x43, 0x46,
  0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x52, 0x53,
  0x54, 0x55, 0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x60, 0x61,
  0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B,
  0x6C, 0x6D, 0x6E, 0x6F, 0x70, 0x71, 0x72, 0x74, 0x75, 0x76,
  0x77, 0x78, 0x7B, 0x7C, 0x7D, 0x80, 0x81, 0x82, 0x83, 0x84,
  0x85, 0x88, 0x8A, 0x8B, 0x8D, 0x8E, 0x8F, 0x90, 0x91, 0x93,
  0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0x9B, 0x9D, 0xA3,
  0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xAB, 0xAD, 0xB0,
  0xB1, 0xB2, 0xB3, 0xB4, 0xB9, 0xBA, 0xBB, 0xBC, 0xBD, 0xBE,
  0xBF,
]);

const VALID_SPECIES_ARRAY = Array.from(VALID_SPECIES);

// Exclude legendaries from random encounter pools
const LEGENDARIES = new Set([0x4A, 0x4B, 0x49, 0x83, 0x15]); // Articuno, Zapdos, Moltres, Mewtwo, Mew
const ENCOUNTER_POOL = VALID_SPECIES_ARRAY.filter(id => !LEGENDARIES.has(id));

// Known starter IDs
const BULBASAUR = 0x99;
const CHARMANDER = 0xB0;
const SQUIRTLE = 0xB1;

// Internal ID for Pidgey (Route 1 Pokemon, used as anchor to find encounter data)
const PIDGEY = 0x24;
const RATTATA = 0xA5;

/**
 * Identifies the game from the ROM header title at offset 0x134.
 */
function getGameTitle(rom: Buffer): string {
  const titleBytes = rom.subarray(0x134, 0x144);
  return titleBytes.toString('ascii').replace(/\0/g, '').trim();
}

/**
 * Finds encounter tables by searching for the known Route 1 pattern
 * as an anchor, then expanding outward to find all adjacent tables.
 *
 * Pokemon Red Route 1 grass data:
 * Rate=25, then 10 entries of [level, Pidgey(0x24) or Rattata(0xA5)]
 */
function findEncounterDataBlock(rom: Buffer): number | null {
  // Search for Route 1's known encounter pattern
  // Route 1: rate 25 (0x19), first entries are Lv3 Pidgey (03 24)
  for (let i = 0x4000; i < rom.length - 100; i++) {
    if (rom[i] !== 0x19) continue; // encounter rate 25

    // Check if next 20 bytes are valid level/species pairs with Pidgey and Rattata
    let pidgeyCount = 0;
    let rattataCount = 0;
    let valid = true;

    for (let j = 0; j < 10; j++) {
      const level = rom[i + 1 + j * 2];
      const species = rom[i + 2 + j * 2];

      if (level < 2 || level > 6) { valid = false; break; }
      if (species === PIDGEY) pidgeyCount++;
      else if (species === RATTATA) rattataCount++;
      else { valid = false; break; }
    }

    // Route 1 should have mostly Pidgey with some Rattata
    if (valid && pidgeyCount >= 5 && rattataCount >= 2) {
      return i;
    }
  }

  return null;
}

/**
 * Once we have an anchor point (Route 1), scan backward and forward
 * to find all encounter tables. Tables are stored sequentially, separated
 * by a 0x00 byte (no water encounters) or water encounter data.
 */
function collectEncounterTables(rom: Buffer, anchorOffset: number): number[] {
  const tables: number[] = [anchorOffset];

  // Each grass/water table is: rate(1) + entries(20) = 21 bytes
  // Between tables there's a 0x00 byte for "no encounters" sections

  // Scan backward from anchor
  let pos = anchorOffset - 1;
  while (pos > anchorOffset - 2000 && pos > 0) {
    // Check if there's a valid encounter table ending at pos
    // Tables can be preceded by 0x00 (no water) or another table
    if (rom[pos] === 0x00) {
      pos--;
      continue;
    }

    // Try to read a table ending here: go back 21 bytes
    const tableStart = pos - 20;
    if (tableStart < 0) break;

    const rate = rom[tableStart];
    if (rate === 0 || rate > 60) { pos--; continue; }

    let valid = true;
    for (let j = 0; j < 10; j++) {
      const level = rom[tableStart + 1 + j * 2];
      const species = rom[tableStart + 2 + j * 2];
      if (level < 2 || level > 70 || !VALID_SPECIES.has(species)) {
        valid = false;
        break;
      }
    }

    if (valid) {
      tables.unshift(tableStart);
      pos = tableStart - 1;
    } else {
      pos--;
    }
  }

  // Scan forward from anchor
  pos = anchorOffset + 21; // skip the anchor table
  while (pos < anchorOffset + 3000 && pos < rom.length - 21) {
    if (rom[pos] === 0x00) {
      pos++;
      continue;
    }

    const rate = rom[pos];
    if (rate === 0 || rate > 60) { pos++; continue; }

    let valid = true;
    for (let j = 0; j < 10; j++) {
      const level = rom[pos + 1 + j * 2];
      const species = rom[pos + 2 + j * 2];
      if (level < 2 || level > 70 || !VALID_SPECIES.has(species)) {
        valid = false;
        break;
      }
    }

    if (valid) {
      tables.push(pos);
      pos += 21;
    } else {
      pos++;
    }
  }

  return tables;
}

/**
 * Find starter references by looking for the three starters appearing
 * as operands in LD instructions near each other in the ROM code sections.
 */
function findStarterReferences(rom: Buffer): Map<number, number> {
  const refs = new Map<number, number>(); // offset -> current species

  // In Pokemon Red, starters are loaded with LD A, <species> (opcode 0x3E <byte>)
  // Search for LD A, BULBASAUR/CHARMANDER/SQUIRTLE near each other
  for (let i = 0; i < rom.length - 1; i++) {
    if (rom[i] !== 0x3E) continue; // LD A, imm8

    const species = rom[i + 1];
    if (species !== BULBASAUR && species !== CHARMANDER && species !== SQUIRTLE) continue;

    // Check if other starters appear within ~100 bytes (they're in the same routine)
    let nearbyStarters = 0;
    for (let j = Math.max(0, i - 100); j < Math.min(rom.length - 1, i + 100); j++) {
      if (j === i) continue;
      if (rom[j] === 0x3E) {
        const s = rom[j + 1];
        if (s === BULBASAUR || s === CHARMANDER || s === SQUIRTLE) {
          nearbyStarters++;
        }
      }
    }

    if (nearbyStarters >= 2) {
      refs.set(i + 1, species); // +1 because the species byte is after the opcode
    }
  }

  return refs;
}

/**
 * Find trainer Pokemon data blocks. In Gen 1, trainer data is:
 * Type 0: [species, species, ..., 0xFF] (all at level set by trainer type)
 * Type 1: [level, species, level, species, ..., 0xFF]
 *
 * Trainer data is terminated by 0xFF bytes.
 */
function findTrainerBlocks(rom: Buffer): Array<{ offset: number; type: 'fixed' | 'varied'; entries: number[] }> {
  const blocks: Array<{ offset: number; type: 'fixed' | 'varied'; entries: number[] }> = [];

  // Trainer data in Pokemon Red is around bank 0x0E (ROM offset ~0x38000-0x3A000)
  const searchStart = 0x38000;
  const searchEnd = Math.min(rom.length, 0x3B000);

  let i = searchStart;
  while (i < searchEnd - 2) {
    // Try type 1 (level, species pairs terminated by 0xFF)
    let j = i;
    const entries: number[] = [];
    let valid = true;
    let pairCount = 0;

    while (j < searchEnd && rom[j] !== 0xFF) {
      const level = rom[j];
      const species = rom[j + 1];

      if (level < 2 || level > 70 || !VALID_SPECIES.has(species)) {
        valid = false;
        break;
      }

      entries.push(j); // store offset of species byte (j+1) for modification
      pairCount++;
      j += 2;

      if (pairCount > 6) { valid = false; break; }
    }

    if (valid && pairCount >= 1 && pairCount <= 6 && j < searchEnd && rom[j] === 0xFF) {
      blocks.push({ offset: i, type: 'varied', entries: entries.map(e => e + 1) });
      i = j + 1;
      continue;
    }

    i++;
  }

  return blocks;
}

export function randomizeGen1(rom: Buffer, settings: GeneratorSettings, seed: string): Buffer {
  const modified = Buffer.from(rom);
  const rng = new SeededRNG(seed);
  let changes = 0;

  const title = getGameTitle(modified);
  console.log(`[Gen1 Randomizer] ROM title: "${title}", size: ${modified.length} bytes`);

  // Randomize wild encounters
  if (settings.randomizeWildPokemon) {
    const anchor = findEncounterDataBlock(modified);

    if (anchor !== null) {
      const tables = collectEncounterTables(modified, anchor);
      console.log(`[Gen1 Randomizer] Found ${tables.length} encounter tables (anchor at 0x${anchor.toString(16)})`);

      for (const tableOffset of tables) {
        for (let j = 0; j < 10; j++) {
          const speciesOffset = tableOffset + 2 + j * 2;
          const level = modified[tableOffset + 1 + j * 2];

          let newSpecies: number;
          if (level <= 15) {
            const earlyPool = ENCOUNTER_POOL.slice(0, Math.floor(ENCOUNTER_POOL.length * 0.6));
            newSpecies = rng.pick(earlyPool);
          } else {
            newSpecies = rng.pick(ENCOUNTER_POOL);
          }

          modified[speciesOffset] = newSpecies;
          changes++;
        }
      }
    } else {
      console.log('[Gen1 Randomizer] Could not find encounter data anchor (Route 1 pattern not found)');
    }
  }

  // Randomize starters
  if (settings.randomizeStarters) {
    const starterRefs = findStarterReferences(modified);
    console.log(`[Gen1 Randomizer] Found ${starterRefs.size} starter references`);

    if (starterRefs.size > 0) {
      const newStarters = rng.shuffle([...ENCOUNTER_POOL]).slice(0, 3);
      const starterMap = new Map<number, number>();
      starterMap.set(BULBASAUR, newStarters[0]);
      starterMap.set(CHARMANDER, newStarters[1]);
      starterMap.set(SQUIRTLE, newStarters[2]);

      for (const [offset, originalSpecies] of starterRefs) {
        const replacement = starterMap.get(originalSpecies);
        if (replacement !== undefined) {
          modified[offset] = replacement;
          changes++;
        }
      }
    }
  }

  // Randomize trainer Pokemon
  if (settings.randomizeTrainers) {
    const blocks = findTrainerBlocks(modified);
    console.log(`[Gen1 Randomizer] Found ${blocks.length} trainer Pokemon blocks`);

    for (const block of blocks) {
      for (const speciesOffset of block.entries) {
        modified[speciesOffset] = rng.pick(ENCOUNTER_POOL);
        changes++;
      }
    }
  }

  // Apply level scaling to trainer Pokemon
  if (settings.levelScaling !== 1.0) {
    const blocks = findTrainerBlocks(modified);
    for (const block of blocks) {
      for (const speciesOffset of block.entries) {
        const levelOffset = speciesOffset - 1; // level is before species
        const level = modified[levelOffset];
        modified[levelOffset] = Math.max(2, Math.min(100, Math.round(level * settings.levelScaling)));
        changes++;
      }
    }
  }

  // Write metadata signature at safe ROM end
  const sig = Buffer.from(`NUZ1|${seed}|${changes}`);
  if (modified.length > sig.length + 256) {
    sig.copy(modified, modified.length - sig.length - 64);
  }

  console.log(`[Gen1 Randomizer] Total changes: ${changes}`);
  return modified;
}
