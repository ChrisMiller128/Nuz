import prisma from '../prisma';

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'GENERAL' | 'COMPLETION' | 'COMBAT' | 'COLLECTION' | 'CHALLENGE' | 'SOCIAL';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  points: number;
  hidden?: boolean;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  userId: string;
  runId?: string;
  runStatus?: string;
  deathCount?: number;
  rulesPreset?: string;
  currentBadges?: number;
  totalCompletedRuns?: number;
  totalRuns?: number;
  hasShinyEncounter?: boolean;
  isDeathless?: boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: 'first_completion',
    name: 'Champion',
    description: 'Complete your first Nuzlocke run',
    icon: '🏆',
    category: 'COMPLETION',
    rarity: 'COMMON',
    points: 50,
    check: (ctx) => ctx.runStatus === 'COMPLETED' && (ctx.totalCompletedRuns ?? 0) >= 1,
  },
  {
    key: 'deathless',
    name: 'Flawless Victory',
    description: 'Complete a run without losing a single Pokémon',
    icon: '💎',
    category: 'COMBAT',
    rarity: 'LEGENDARY',
    points: 500,
    check: (ctx) => ctx.runStatus === 'COMPLETED' && ctx.deathCount === 0,
  },
  {
    key: 'hardcore_completion',
    name: 'Ironman',
    description: 'Complete a Hardcore Nuzlocke run',
    icon: '💀',
    category: 'CHALLENGE',
    rarity: 'EPIC',
    points: 200,
    check: (ctx) => ctx.runStatus === 'COMPLETED' && ctx.rulesPreset === 'HARDCORE',
  },
  {
    key: 'first_wipe',
    name: 'Wiped Out',
    description: 'Experience your first team wipe',
    icon: '☠️',
    category: 'GENERAL',
    rarity: 'COMMON',
    points: 10,
    check: (ctx) => ctx.runStatus === 'FAILED',
  },
  {
    key: 'shiny_encounter',
    name: 'Shiny Hunter',
    description: 'Encounter a shiny Pokémon during a run',
    icon: '✨',
    category: 'COLLECTION',
    rarity: 'RARE',
    points: 100,
    check: (ctx) => ctx.hasShinyEncounter === true,
  },
  {
    key: 'five_completions',
    name: 'Veteran Trainer',
    description: 'Complete 5 Nuzlocke runs',
    icon: '⭐',
    category: 'COMPLETION',
    rarity: 'UNCOMMON',
    points: 100,
    check: (ctx) => (ctx.totalCompletedRuns ?? 0) >= 5,
  },
  {
    key: 'ten_completions',
    name: 'Nuzlocke Master',
    description: 'Complete 10 Nuzlocke runs',
    icon: '👑',
    category: 'COMPLETION',
    rarity: 'RARE',
    points: 250,
    check: (ctx) => (ctx.totalCompletedRuns ?? 0) >= 10,
  },
  {
    key: 'full_badges',
    name: 'Badge Collector',
    description: 'Earn all 8 badges in a single run',
    icon: '🏅',
    category: 'COMPLETION',
    rarity: 'UNCOMMON',
    points: 75,
    check: (ctx) => (ctx.currentBadges ?? 0) >= 8,
  },
  {
    key: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Complete a run after losing 10+ Pokémon',
    icon: '🔥',
    category: 'COMBAT',
    rarity: 'RARE',
    points: 150,
    check: (ctx) => ctx.runStatus === 'COMPLETED' && (ctx.deathCount ?? 0) >= 10,
  },
  {
    key: 'challenge_complete',
    name: 'Challenger',
    description: 'Complete a community challenge run',
    icon: '🎯',
    category: 'CHALLENGE',
    rarity: 'UNCOMMON',
    points: 100,
    check: () => false, // checked separately via challenge system
  },
  {
    key: 'share_run',
    name: 'Show & Tell',
    description: 'Share a completed run publicly',
    icon: '📢',
    category: 'SOCIAL',
    rarity: 'COMMON',
    points: 25,
    check: () => false, // checked when sharing
  },
  {
    key: 'three_deaths_one_route',
    name: 'Route of Doom',
    description: 'Lose 3 or more Pokémon on the same route across runs',
    icon: '💀',
    category: 'COMBAT',
    rarity: 'UNCOMMON',
    points: 50,
    hidden: true,
    check: () => false,
  },
];

export async function ensureAchievementsSeeded(): Promise<void> {
  for (const def of ACHIEVEMENT_DEFS) {
    await prisma.achievement.upsert({
      where: { key: def.key },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        rarity: def.rarity,
        points: def.points,
        hidden: def.hidden ?? false,
      },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        rarity: def.rarity,
        points: def.points,
        hidden: def.hidden ?? false,
      },
    });
  }
}

export async function evaluateAchievements(ctx: AchievementContext): Promise<string[]> {
  const unlocked: string[] = [];

  const existing = await prisma.userAchievement.findMany({
    where: { userId: ctx.userId },
    select: { achievement: { select: { key: true } } },
  });
  const alreadyUnlocked = new Set(existing.map(e => e.achievement.key));

  for (const def of ACHIEVEMENT_DEFS) {
    if (alreadyUnlocked.has(def.key)) continue;
    if (!def.check(ctx)) continue;

    const achievement = await prisma.achievement.findUnique({ where: { key: def.key } });
    if (!achievement) continue;

    await prisma.userAchievement.create({
      data: {
        userId: ctx.userId,
        achievementId: achievement.id,
        sourceRunId: ctx.runId,
      },
    });
    unlocked.push(def.key);
  }

  return unlocked;
}

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });
}

export async function getAllAchievements() {
  return prisma.achievement.findMany({
    where: { hidden: false },
    orderBy: [{ category: 'asc' }, { points: 'desc' }],
  });
}
