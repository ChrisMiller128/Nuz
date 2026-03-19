import prisma from '../prisma';

export interface DeathHeatmapEntry {
  routeName: string;
  deathCount: number;
  gameTitle: string;
}

export interface RunAnalytics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  completionRate: number;
  avgDeathsPerRun: number;
  totalDeaths: number;
  totalEncounters: number;
  totalPlayTimeHours: number;
  deathsByRoute: DeathHeatmapEntry[];
  deathsByGame: { gameTitle: string; deaths: number }[];
  encountersByStatus: { status: string; count: number }[];
  badgeProgression: { badgeNumber: number; avgRunsToReach: number }[];
  runsOverTime: { month: string; count: number }[];
}

export async function getUserAnalytics(userId: string): Promise<RunAnalytics> {
  const [
    totalRuns,
    completedRuns,
    failedRuns,
    deathAgg,
    encounterCount,
    playTimeAgg,
  ] = await Promise.all([
    prisma.run.count({ where: { userId } }),
    prisma.run.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.run.count({ where: { userId, status: 'FAILED' } }),
    prisma.run.aggregate({ where: { userId }, _sum: { deathCount: true }, _avg: { deathCount: true } }),
    prisma.encounter.count({ where: { run: { userId } } }),
    prisma.run.aggregate({ where: { userId }, _sum: { playTimeSeconds: true } }),
  ]);

  // Deaths by route (heatmap data)
  const deadPokemon = await prisma.pokemonEntry.findMany({
    where: { run: { userId }, status: 'DEAD', diedAtRoute: { not: null } },
    select: {
      diedAtRoute: true,
      run: { select: { game: { select: { title: true } } } },
    },
  });

  const routeDeathMap = new Map<string, { count: number; game: string }>();
  for (const p of deadPokemon) {
    const key = p.diedAtRoute!;
    const existing = routeDeathMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      routeDeathMap.set(key, { count: 1, game: p.run.game.title });
    }
  }

  const deathsByRoute: DeathHeatmapEntry[] = Array.from(routeDeathMap.entries())
    .map(([routeName, data]) => ({
      routeName,
      deathCount: data.count,
      gameTitle: data.game,
    }))
    .sort((a, b) => b.deathCount - a.deathCount)
    .slice(0, 30);

  // Deaths by game
  const gameDeaths = await prisma.run.groupBy({
    by: ['gameId'],
    where: { userId },
    _sum: { deathCount: true },
  });
  const games = await prisma.game.findMany({
    where: { id: { in: gameDeaths.map(g => g.gameId) } },
    select: { id: true, title: true },
  });
  const gameMap = new Map(games.map(g => [g.id, g.title]));
  const deathsByGame = gameDeaths
    .map(g => ({ gameTitle: gameMap.get(g.gameId) || 'Unknown', deaths: g._sum.deathCount ?? 0 }))
    .sort((a, b) => b.deaths - a.deaths);

  // Encounters by status
  const encounterGroups = await prisma.encounter.groupBy({
    by: ['status'],
    where: { run: { userId } },
    _count: true,
  });
  const encountersByStatus = encounterGroups.map(g => ({
    status: g.status,
    count: g._count,
  }));

  return {
    totalRuns,
    completedRuns,
    failedRuns,
    completionRate: totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0,
    avgDeathsPerRun: Math.round(deathAgg._avg.deathCount ?? 0),
    totalDeaths: deathAgg._sum.deathCount ?? 0,
    totalEncounters: encounterCount,
    totalPlayTimeHours: Math.round(Number(playTimeAgg._sum.playTimeSeconds ?? 0) / 3600),
    deathsByRoute,
    deathsByGame,
    encountersByStatus,
    badgeProgression: [],
    runsOverTime: [],
  };
}
