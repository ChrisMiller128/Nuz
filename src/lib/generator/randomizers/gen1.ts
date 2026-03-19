import { SeededRNG } from './prng';
import type { GeneratorSettings } from '../index';

/**
 * Gen 1 Pokemon Randomizer (Red, Blue, Yellow)
 *
 * Pokemon Red/Blue use "internal IDs" that differ from Pokedex numbers.
 * This randomizer modifies wild encounters, starters, and trainer Pokemon
 * by scanning for known data structures in the ROM binary.
 */

// All 151 valid Gen 1 internal species IDs (decimal)
// Mapped from the well-known Gen 1 internal ID table
const VALID_GEN1_SPECIES: number[] = [
  0x99, // Bulbasaur
  0x09, // Ivysaur
  0x9A, // Venusaur
  0xB0, // Charmander
  0xB2, // Charmeleon
  0xB4, // Charizard
  0xB1, // Squirtle
  0xB3, // Wartortle
  0x1C, // Blastoise
  0x7B, // Caterpie
  0x7C, // Metapod
  0x7D, // Butterfree
  0x70, // Weedle
  0x71, // Kakuna
  0x72, // Beedrill
  0x24, // Pidgey
  0x96, // Pidgeotto
  0x97, // Pidgeot
  0xA5, // Rattata
  0xA6, // Raticate
  0x05, // Spearow
  0x23, // Fearow
  0x6C, // Ekans
  0x2D, // Arbok
  0x54, // Pikachu
  0x55, // Raichu
  0x60, // Sandshrew
  0x61, // Sandslash
  0x0F, // Nidoran♀
  0xA8, // Nidorina
  0x10, // Nidoqueen
  0x03, // Nidoran♂
  0xA7, // Nidorino
  0x07, // Nidoking
  0x04, // Clefairy
  0x8E, // Clefable
  0x52, // Vulpix
  0x53, // Ninetales
  0x64, // Jigglypuff
  0x65, // Wigglytuff
  0x6B, // Zubat
  0x82, // Golbat
  0xB9, // Oddish
  0xBA, // Gloom
  0xBB, // Vileplume
  0x6D, // Paras
  0x2E, // Parasect
  0x41, // Venonat
  0x77, // Venomoth
  0x3B, // Diglett
  0x76, // Dugtrio
  0x4D, // Meowth
  0x90, // Persian
  0x2F, // Psyduck
  0x80, // Golduck
  0x39, // Mankey
  0x75, // Primeape
  0x21, // Growlithe
  0x14, // Arcanine
  0x47, // Poliwag
  0x6E, // Poliwhirl
  0x6F, // Poliwrath
  0x94, // Abra
  0x26, // Kadabra
  0x95, // Alakazam
  0x6A, // Machop
  0x29, // Machoke
  0x7E, // Machamp
  0xBC, // Bellsprout
  0xBD, // Weepinbell
  0xBE, // Victreebel
  0x18, // Tentacool
  0x9B, // Tentacruel
  0xA9, // Geodude
  0x27, // Graveler
  0x31, // Golem
  0xA3, // Ponyta
  0xA4, // Rapidash
  0x25, // Slowpoke
  0x08, // Slowbro
  0xAD, // Magnemite
  0x36, // Magneton
  0x40, // Farfetch'd
  0x46, // Doduo
  0x74, // Dodrio
  0x3A, // Seel
  0x78, // Dewgong
  0x0D, // Grimer
  0x88, // Muk
  0x17, // Shellder
  0x8B, // Cloyster
  0x19, // Gastly
  0x93, // Haunter
  0x0E, // Gengar
  0x22, // Onix
  0x30, // Drowzee
  0x81, // Hypno
  0x4E, // Krabby
  0x8A, // Kingler
  0x06, // Voltorb
  0x8D, // Electrode
  0x0C, // Exeggcute
  0x0A, // Exeggutor
  0x11, // Cubone
  0x91, // Marowak
  0x2B, // Hitmonlee
  0x2C, // Hitmonchan
  0x0B, // Lickitung
  0x37, // Koffing
  0x8F, // Weezing
  0x12, // Rhyhorn
  0x01, // Rhydon
  0x28, // Chansey
  0x1E, // Tangela
  0x02, // Kangaskhan
  0x5C, // Horsea
  0x5D, // Seadra
  0x9D, // Goldeen
  0x9E, // Seaking
  0x1B, // Staryu
  0x98, // Starmie
  0x2A, // Mr. Mime
  0x1A, // Scyther
  0x48, // Jynx
  0x35, // Electabuzz
  0x33, // Magmar
  0x1D, // Pinsir
  0x3C, // Tauros
  0x85, // Magikarp
  0x16, // Gyarados
  0x13, // Lapras
  0x4C, // Ditto
  0x66, // Eevee
  0x69, // Vaporeon
  0x68, // Jolteon
  0x67, // Flareon
  0xAA, // Porygon
  0x62, // Omanyte
  0x63, // Omastar
  0x5A, // Kabuto
  0x5B, // Kabutops
  0xAB, // Aerodactyl
  0x84, // Snorlax
  0x4A, // Articuno
  0x4B, // Zapdos
  0x49, // Moltres
  0x58, // Dratini
  0x59, // Dragonair
  0x42, // Dragonite
  0x83, // Mewtwo
  0x15, // Mew
];

// Non-legendary species for encounters (exclude legendaries and Mew)
const LEGENDARY_IDS = [0x4A, 0x4B, 0x49, 0x83, 0x15]; // Articuno, Zapdos, Moltres, Mewtwo, Mew
const ENCOUNTER_SPECIES = VALID_GEN1_SPECIES.filter(id => !LEGENDARY_IDS.includes(id));

// Starter internal IDs
const BULBASAUR = 0x99;
const CHARMANDER = 0xB0;
const SQUIRTLE = 0xB1;

// Fully evolved starters (for rival's final team)
const VENUSAUR = 0x9A;
const CHARIZARD = 0xB4;
const BLASTOISE = 0x1C;

const STARTERS = [BULBASAUR, CHARMANDER, SQUIRTLE];
const EVOLVED_STARTERS = [VENUSAUR, CHARIZARD, BLASTOISE];

function isValidSpecies(id: number): boolean {
  return VALID_GEN1_SPECIES.includes(id);
}

/**
 * Scans for wild encounter tables in a Gen 1 ROM.
 * Format: [rate (1-255)] [level, species] x10
 * Total: 21 bytes. Rate of 0 means no encounters (1 byte only).
 */
function findEncounterTables(rom: Buffer): number[] {
  const offsets: number[] = [];
  const minAddr = 0xC000;
  const maxAddr = Math.min(rom.length - 21, 0x18000);

  for (let i = minAddr; i < maxAddr; i++) {
    const rate = rom[i];
    if (rate === 0 || rate > 50) continue;

    let valid = true;
    let validSpeciesCount = 0;

    for (let j = 0; j < 10; j++) {
      const level = rom[i + 1 + j * 2];
      const species = rom[i + 2 + j * 2];

      if (level < 2 || level > 70) { valid = false; break; }
      if (!isValidSpecies(species)) { valid = false; break; }
      validSpeciesCount++;
    }

    if (valid && validSpeciesCount === 10) {
      offsets.push(i);
      i += 20; // skip past this table
    }
  }

  return offsets;
}

/**
 * Finds starter Pokemon references in the ROM.
 * Searches for the pattern where all three starters appear near each other
 * in the Prof Oak's lab scripting data.
 */
function findStarterOffsets(rom: Buffer): { offset: number; species: number }[] {
  const results: { offset: number; species: number }[] = [];

  for (let i = 0x18000; i < rom.length - 2; i++) {
    const val = rom[i];
    if (STARTERS.includes(val)) {
      // Check if another starter is nearby (within 32 bytes)
      let nearbyStarters = 0;
      for (let j = Math.max(0, i - 32); j < Math.min(rom.length, i + 32); j++) {
        if (j !== i && STARTERS.includes(rom[j])) {
          nearbyStarters++;
        }
      }
      if (nearbyStarters >= 1) {
        results.push({ offset: i, species: val });
      }
    }
  }

  return results;
}

/**
 * Finds trainer Pokemon in the ROM.
 * Gen 1 trainer data format: [species, level] pairs terminated by 0x00
 * Located roughly between 0x39000 and 0x3A600 in Red.
 */
function findTrainerData(rom: Buffer): { offset: number; length: number }[] {
  const trainers: { offset: number; length: number }[] = [];
  const minAddr = 0x38000;
  const maxAddr = Math.min(rom.length - 10, 0x3C000);

  let i = minAddr;
  while (i < maxAddr) {
    // Look for potential trainer Pokemon list: pairs of (species, level) ending with 0xFF
    let pairCount = 0;
    let j = i;
    let valid = true;

    while (j < maxAddr && rom[j] !== 0x00) {
      const species = rom[j];
      const level = rom[j + 1];

      if (!isValidSpecies(species) || level < 2 || level > 70) {
        valid = false;
        break;
      }

      pairCount++;
      j += 2;

      if (pairCount > 6) { valid = false; break; }
    }

    if (valid && pairCount >= 1 && pairCount <= 6 && rom[j] === 0x00) {
      trainers.push({ offset: i, length: pairCount });
      i = j + 1;
    } else {
      i++;
    }
  }

  return trainers;
}

export function randomizeGen1(rom: Buffer, settings: GeneratorSettings, seed: string): Buffer {
  const modified = Buffer.from(rom);
  const rng = new SeededRNG(seed);
  let changes = 0;

  // Randomize wild encounters
  if (settings.randomizeWildPokemon) {
    const tables = findEncounterTables(modified);
    for (const tableOffset of tables) {
      for (let j = 0; j < 10; j++) {
        const speciesOffset = tableOffset + 2 + j * 2;
        const originalLevel = modified[tableOffset + 1 + j * 2];

        // Pick a random species, weighted slightly by level
        let newSpecies: number;
        if (originalLevel <= 15) {
          // Early game: prefer basic Pokemon (first half of list)
          const pool = ENCOUNTER_SPECIES.slice(0, Math.floor(ENCOUNTER_SPECIES.length * 0.6));
          newSpecies = rng.pick(pool);
        } else if (originalLevel <= 35) {
          newSpecies = rng.pick(ENCOUNTER_SPECIES);
        } else {
          // Late game: allow all Pokemon
          newSpecies = rng.pick(ENCOUNTER_SPECIES);
        }

        modified[speciesOffset] = newSpecies;
        changes++;
      }
    }
  }

  // Randomize starters
  if (settings.randomizeStarters) {
    const starterRefs = findStarterOffsets(modified);

    // Choose 3 random non-legendary Pokemon as new starters
    const newStarters = rng.shuffle([...ENCOUNTER_SPECIES]).slice(0, 3);

    // Map old starter -> new starter
    const starterMap = new Map<number, number>();
    starterMap.set(BULBASAUR, newStarters[0]);
    starterMap.set(CHARMANDER, newStarters[1]);
    starterMap.set(SQUIRTLE, newStarters[2]);

    for (const ref of starterRefs) {
      const mapped = starterMap.get(ref.species);
      if (mapped !== undefined) {
        modified[ref.offset] = mapped;
        changes++;
      }
    }

    // Also replace evolved starters if found (for rival's team)
    const evolvedMap = new Map<number, number>();
    evolvedMap.set(VENUSAUR, newStarters[0]);
    evolvedMap.set(CHARIZARD, newStarters[1]);
    evolvedMap.set(BLASTOISE, newStarters[2]);

    for (let i = 0x38000; i < Math.min(rom.length, 0x3C000); i++) {
      const mapped = evolvedMap.get(modified[i]);
      if (mapped !== undefined) {
        const nextByte = modified[i + 1];
        if (nextByte >= 30 && nextByte <= 70) {
          modified[i] = mapped;
          changes++;
        }
      }
    }
  }

  // Randomize trainer Pokemon
  if (settings.randomizeTrainers) {
    const trainers = findTrainerData(modified);
    for (const trainer of trainers) {
      for (let j = 0; j < trainer.length; j++) {
        const speciesOffset = trainer.offset + j * 2;
        const level = modified[speciesOffset + 1];
        modified[speciesOffset] = rng.pick(ENCOUNTER_SPECIES);
        // Apply level scaling
        if (settings.levelScaling !== 1.0) {
          const newLevel = Math.max(2, Math.min(100, Math.round(level * settings.levelScaling)));
          modified[speciesOffset + 1] = newLevel;
        }
        changes++;
      }
    }
  } else if (settings.levelScaling !== 1.0) {
    // Just scale levels without randomizing species
    const trainers = findTrainerData(modified);
    for (const trainer of trainers) {
      for (let j = 0; j < trainer.length; j++) {
        const levelOffset = trainer.offset + j * 2 + 1;
        const level = modified[levelOffset];
        modified[levelOffset] = Math.max(2, Math.min(100, Math.round(level * settings.levelScaling)));
        changes++;
      }
    }
  }

  // Write metadata signature
  const sig = Buffer.from(`NUZ1|${seed}|${changes}`);
  if (modified.length > sig.length + 256) {
    sig.copy(modified, modified.length - sig.length - 64);
  }

  return modified;
}
