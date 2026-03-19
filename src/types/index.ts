import { Platform, RunStatus, RulesPreset, EncounterStatus, PokemonStatus, PokemonLocation, GiftRule, NoteType, GeneratedRomStatus } from '@prisma/client';

export type { Platform, RunStatus, RulesPreset, EncounterStatus, PokemonStatus, PokemonLocation, GiftRule, NoteType, GeneratedRomStatus };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface GameWithBaseRoms {
  id: string;
  title: string;
  slug: string;
  platform: Platform;
  generation: number;
  region: string;
  description: string | null;
  coverArt: string | null;
  baseRoms: BaseRomInfo[];
}

export interface BaseRomInfo {
  id: string;
  fileName: string;
  fileSize: bigint;
  version: string;
}

export interface RunSummary {
  id: string;
  name: string;
  status: RunStatus;
  rulesPreset: RulesPreset;
  currentBadges: number;
  deathCount: number;
  lastPlayedAt: Date | null;
  createdAt: Date;
  game: {
    title: string;
    platform: Platform;
    coverArt: string | null;
  };
  generatedRom: {
    id: string;
    seed: string;
    fileName: string;
  };
  _count: {
    pokemonEntries: number;
    encounters: number;
  };
}

export interface RunDetail {
  id: string;
  name: string;
  status: RunStatus;
  rulesPreset: RulesPreset;
  customRulesJson: Record<string, boolean> | null;
  starterChoice: string | null;
  duplicateClause: boolean;
  shinyClause: boolean;
  staticEncounters: boolean;
  giftPokemon: GiftRule;
  currentBadges: number;
  deathCount: number;
  playTimeSeconds: bigint;
  lastPlayedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  game: GameWithBaseRoms;
  generatedRom: {
    id: string;
    seed: string;
    fileName: string;
    checksum: string;
    generatorSettingsJson: Record<string, unknown>;
    createdAt: Date;
  };
  pokemonEntries: PokemonEntryData[];
  encounters: EncounterData[];
  badgeProgress: BadgeProgressData[];
  runNotes: RunNoteData[];
  saveStates: SaveStateInfo[];
}

export interface PokemonEntryData {
  id: string;
  nickname: string;
  species: string;
  level: number;
  status: PokemonStatus;
  location: PokemonLocation;
  metRoute: string | null;
  metLevel: number | null;
  nature: string | null;
  ability: string | null;
  causeOfDeath: string | null;
  diedToTrainer: string | null;
  diedAtRoute: string | null;
  diedAtLevel: number | null;
  order: number;
  notes: string | null;
}

export interface EncounterData {
  id: string;
  routeName: string;
  pokemonName: string | null;
  pokemonLevel: number | null;
  status: EncounterStatus;
  isStatic: boolean;
  isGift: boolean;
  notes: string | null;
  order: number;
}

export interface BadgeProgressData {
  id: string;
  badgeName: string;
  badgeNumber: number;
  gymLeader: string | null;
  levelCap: number | null;
  obtained: boolean;
  obtainedAt: Date | null;
}

export interface RunNoteData {
  id: string;
  title: string | null;
  content: string;
  noteType: NoteType;
  order: number;
  createdAt: Date;
}

export interface SaveStateInfo {
  id: string;
  slotNumber: number;
  isAutosave: boolean;
  fileSize: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedRomSummary {
  id: string;
  fileName: string;
  fileSize: bigint;
  seed: string;
  checksum: string;
  status: GeneratedRomStatus;
  generatorSettingsJson: Record<string, unknown>;
  createdAt: Date;
  baseRom: {
    fileName: string;
    game: {
      title: string;
      platform: Platform;
    };
  };
}

export interface DashboardStats {
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalDeaths: number;
  totalEncounters: number;
  totalPlayTime: number;
  generatedRoms: number;
}

export interface NewRunFormData {
  name: string;
  gameId: string;
  baseRomId: string;
  rulesPreset: RulesPreset;
  starterChoice?: string;
  duplicateClause: boolean;
  shinyClause: boolean;
  staticEncounters: boolean;
  giftPokemon: GiftRule;
  generatorSettings: Record<string, unknown>;
  seed?: string;
  generatorProfileId?: string;
}
