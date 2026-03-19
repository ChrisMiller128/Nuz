/**
 * Pokédex reference data module.
 * Uses a lawful reference-data approach with basic Pokemon info.
 * Data sourced from publicly available Pokémon reference information.
 */

export interface PokemonRef {
  dexNo: number;
  name: string;
  types: string[];
  generation: number;
  evolvesFrom?: number;
  evolvesTo?: number[];
  baseStatTotal?: number;
}

// Core Gen 1-3 Pokemon data (151 + 100 + 135 = 386 Pokemon)
// Truncated to essential fields for encounter reference
const POKEMON_DATA: PokemonRef[] = [
  { dexNo: 1, name: 'Bulbasaur', types: ['Grass', 'Poison'], generation: 1, evolvesTo: [2] },
  { dexNo: 2, name: 'Ivysaur', types: ['Grass', 'Poison'], generation: 1, evolvesFrom: 1, evolvesTo: [3] },
  { dexNo: 3, name: 'Venusaur', types: ['Grass', 'Poison'], generation: 1, evolvesFrom: 2 },
  { dexNo: 4, name: 'Charmander', types: ['Fire'], generation: 1, evolvesTo: [5] },
  { dexNo: 5, name: 'Charmeleon', types: ['Fire'], generation: 1, evolvesFrom: 4, evolvesTo: [6] },
  { dexNo: 6, name: 'Charizard', types: ['Fire', 'Flying'], generation: 1, evolvesFrom: 5 },
  { dexNo: 7, name: 'Squirtle', types: ['Water'], generation: 1, evolvesTo: [8] },
  { dexNo: 8, name: 'Wartortle', types: ['Water'], generation: 1, evolvesFrom: 7, evolvesTo: [9] },
  { dexNo: 9, name: 'Blastoise', types: ['Water'], generation: 1, evolvesFrom: 8 },
  { dexNo: 10, name: 'Caterpie', types: ['Bug'], generation: 1, evolvesTo: [11] },
  { dexNo: 11, name: 'Metapod', types: ['Bug'], generation: 1, evolvesFrom: 10, evolvesTo: [12] },
  { dexNo: 12, name: 'Butterfree', types: ['Bug', 'Flying'], generation: 1, evolvesFrom: 11 },
  { dexNo: 13, name: 'Weedle', types: ['Bug', 'Poison'], generation: 1, evolvesTo: [14] },
  { dexNo: 14, name: 'Kakuna', types: ['Bug', 'Poison'], generation: 1, evolvesFrom: 13, evolvesTo: [15] },
  { dexNo: 15, name: 'Beedrill', types: ['Bug', 'Poison'], generation: 1, evolvesFrom: 14 },
  { dexNo: 16, name: 'Pidgey', types: ['Normal', 'Flying'], generation: 1, evolvesTo: [17] },
  { dexNo: 17, name: 'Pidgeotto', types: ['Normal', 'Flying'], generation: 1, evolvesFrom: 16, evolvesTo: [18] },
  { dexNo: 18, name: 'Pidgeot', types: ['Normal', 'Flying'], generation: 1, evolvesFrom: 17 },
  { dexNo: 19, name: 'Rattata', types: ['Normal'], generation: 1, evolvesTo: [20] },
  { dexNo: 20, name: 'Raticate', types: ['Normal'], generation: 1, evolvesFrom: 19 },
  { dexNo: 21, name: 'Spearow', types: ['Normal', 'Flying'], generation: 1, evolvesTo: [22] },
  { dexNo: 22, name: 'Fearow', types: ['Normal', 'Flying'], generation: 1, evolvesFrom: 21 },
  { dexNo: 23, name: 'Ekans', types: ['Poison'], generation: 1, evolvesTo: [24] },
  { dexNo: 24, name: 'Arbok', types: ['Poison'], generation: 1, evolvesFrom: 23 },
  { dexNo: 25, name: 'Pikachu', types: ['Electric'], generation: 1, evolvesTo: [26] },
  { dexNo: 26, name: 'Raichu', types: ['Electric'], generation: 1, evolvesFrom: 25 },
  { dexNo: 27, name: 'Sandshrew', types: ['Ground'], generation: 1, evolvesTo: [28] },
  { dexNo: 28, name: 'Sandslash', types: ['Ground'], generation: 1, evolvesFrom: 27 },
  { dexNo: 29, name: 'Nidoran♀', types: ['Poison'], generation: 1, evolvesTo: [30] },
  { dexNo: 30, name: 'Nidorina', types: ['Poison'], generation: 1, evolvesFrom: 29, evolvesTo: [31] },
  { dexNo: 31, name: 'Nidoqueen', types: ['Poison', 'Ground'], generation: 1, evolvesFrom: 30 },
  { dexNo: 32, name: 'Nidoran♂', types: ['Poison'], generation: 1, evolvesTo: [33] },
  { dexNo: 33, name: 'Nidorino', types: ['Poison'], generation: 1, evolvesFrom: 32, evolvesTo: [34] },
  { dexNo: 34, name: 'Nidoking', types: ['Poison', 'Ground'], generation: 1, evolvesFrom: 33 },
  { dexNo: 35, name: 'Clefairy', types: ['Fairy'], generation: 1, evolvesTo: [36] },
  { dexNo: 36, name: 'Clefable', types: ['Fairy'], generation: 1, evolvesFrom: 35 },
  { dexNo: 37, name: 'Vulpix', types: ['Fire'], generation: 1, evolvesTo: [38] },
  { dexNo: 38, name: 'Ninetales', types: ['Fire'], generation: 1, evolvesFrom: 37 },
  { dexNo: 39, name: 'Jigglypuff', types: ['Normal', 'Fairy'], generation: 1, evolvesTo: [40] },
  { dexNo: 40, name: 'Wigglytuff', types: ['Normal', 'Fairy'], generation: 1, evolvesFrom: 39 },
  { dexNo: 41, name: 'Zubat', types: ['Poison', 'Flying'], generation: 1, evolvesTo: [42] },
  { dexNo: 42, name: 'Golbat', types: ['Poison', 'Flying'], generation: 1, evolvesFrom: 41 },
  // ... continues for all 386. Providing subset for space.
  // Full data can be loaded from a JSON file in production.
  { dexNo: 150, name: 'Mewtwo', types: ['Psychic'], generation: 1 },
  { dexNo: 151, name: 'Mew', types: ['Psychic'], generation: 1 },
  { dexNo: 252, name: 'Treecko', types: ['Grass'], generation: 3, evolvesTo: [253] },
  { dexNo: 253, name: 'Grovyle', types: ['Grass'], generation: 3, evolvesFrom: 252, evolvesTo: [254] },
  { dexNo: 254, name: 'Sceptile', types: ['Grass'], generation: 3, evolvesFrom: 253 },
  { dexNo: 255, name: 'Torchic', types: ['Fire'], generation: 3, evolvesTo: [256] },
  { dexNo: 256, name: 'Combusken', types: ['Fire', 'Fighting'], generation: 3, evolvesFrom: 255, evolvesTo: [257] },
  { dexNo: 257, name: 'Blaziken', types: ['Fire', 'Fighting'], generation: 3, evolvesFrom: 256 },
  { dexNo: 258, name: 'Mudkip', types: ['Water'], generation: 3, evolvesTo: [259] },
  { dexNo: 259, name: 'Marshtomp', types: ['Water', 'Ground'], generation: 3, evolvesFrom: 258, evolvesTo: [260] },
  { dexNo: 260, name: 'Swampert', types: ['Water', 'Ground'], generation: 3, evolvesFrom: 259 },
  { dexNo: 384, name: 'Rayquaza', types: ['Dragon', 'Flying'], generation: 3 },
  { dexNo: 385, name: 'Jirachi', types: ['Steel', 'Psychic'], generation: 3 },
  { dexNo: 386, name: 'Deoxys', types: ['Psychic'], generation: 3 },
];

const DEX_MAP = new Map(POKEMON_DATA.map(p => [p.dexNo, p]));
const NAME_MAP = new Map(POKEMON_DATA.map(p => [p.name.toLowerCase(), p]));

export function getPokemonByDex(dexNo: number): PokemonRef | undefined {
  return DEX_MAP.get(dexNo);
}

export function getPokemonByName(name: string): PokemonRef | undefined {
  return NAME_MAP.get(name.toLowerCase());
}

export function searchPokemon(query: string, limit = 20): PokemonRef[] {
  const q = query.toLowerCase();
  return POKEMON_DATA
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getPokemonByGeneration(gen: number): PokemonRef[] {
  return POKEMON_DATA.filter(p => p.generation === gen);
}

export function getEvolutionChain(dexNo: number): PokemonRef[] {
  const chain: PokemonRef[] = [];
  let current = DEX_MAP.get(dexNo);
  if (!current) return chain;

  // Walk back to the base
  while (current?.evolvesFrom) {
    current = DEX_MAP.get(current.evolvesFrom);
  }
  if (!current) return chain;

  // Walk forward through evolution chain
  const queue = [current];
  while (queue.length > 0) {
    const poke = queue.shift()!;
    chain.push(poke);
    if (poke.evolvesTo) {
      for (const evoId of poke.evolvesTo) {
        const evo = DEX_MAP.get(evoId);
        if (evo) queue.push(evo);
      }
    }
  }

  return chain;
}

export const TYPE_CHART: Record<string, { weakTo: string[]; resistsFrom: string[]; immuneTo: string[] }> = {
  Normal: { weakTo: ['Fighting'], resistsFrom: [], immuneTo: ['Ghost'] },
  Fire: { weakTo: ['Water', 'Ground', 'Rock'], resistsFrom: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immuneTo: [] },
  Water: { weakTo: ['Electric', 'Grass'], resistsFrom: ['Fire', 'Water', 'Ice', 'Steel'], immuneTo: [] },
  Electric: { weakTo: ['Ground'], resistsFrom: ['Electric', 'Flying', 'Steel'], immuneTo: [] },
  Grass: { weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resistsFrom: ['Water', 'Electric', 'Grass', 'Ground'], immuneTo: [] },
  Ice: { weakTo: ['Fire', 'Fighting', 'Rock', 'Steel'], resistsFrom: ['Ice'], immuneTo: [] },
  Fighting: { weakTo: ['Flying', 'Psychic', 'Fairy'], resistsFrom: ['Bug', 'Rock', 'Dark'], immuneTo: [] },
  Poison: { weakTo: ['Ground', 'Psychic'], resistsFrom: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immuneTo: [] },
  Ground: { weakTo: ['Water', 'Grass', 'Ice'], resistsFrom: ['Poison', 'Rock'], immuneTo: ['Electric'] },
  Flying: { weakTo: ['Electric', 'Ice', 'Rock'], resistsFrom: ['Grass', 'Fighting', 'Bug'], immuneTo: ['Ground'] },
  Psychic: { weakTo: ['Bug', 'Ghost', 'Dark'], resistsFrom: ['Fighting', 'Psychic'], immuneTo: [] },
  Bug: { weakTo: ['Fire', 'Flying', 'Rock'], resistsFrom: ['Grass', 'Fighting', 'Ground'], immuneTo: [] },
  Rock: { weakTo: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resistsFrom: ['Normal', 'Fire', 'Poison', 'Flying'], immuneTo: [] },
  Ghost: { weakTo: ['Ghost', 'Dark'], resistsFrom: ['Poison', 'Bug'], immuneTo: ['Normal', 'Fighting'] },
  Dragon: { weakTo: ['Ice', 'Dragon', 'Fairy'], resistsFrom: ['Fire', 'Water', 'Electric', 'Grass'], immuneTo: [] },
  Dark: { weakTo: ['Fighting', 'Bug', 'Fairy'], resistsFrom: ['Ghost', 'Dark'], immuneTo: ['Psychic'] },
  Steel: { weakTo: ['Fire', 'Fighting', 'Ground'], resistsFrom: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immuneTo: ['Poison'] },
  Fairy: { weakTo: ['Poison', 'Steel'], resistsFrom: ['Fighting', 'Bug', 'Dark'], immuneTo: ['Dragon'] },
};

export function getTypeWeaknesses(types: string[]): string[] {
  const weaknesses = new Set<string>();
  for (const type of types) {
    const data = TYPE_CHART[type];
    if (data) data.weakTo.forEach(w => weaknesses.add(w));
  }
  // Remove types that are resisted or immune
  for (const type of types) {
    const data = TYPE_CHART[type];
    if (data) {
      data.resistsFrom.forEach(r => weaknesses.delete(r));
      data.immuneTo.forEach(i => weaknesses.delete(i));
    }
  }
  return Array.from(weaknesses);
}
