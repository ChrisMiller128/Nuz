import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const [
      totalRuns,
      activeRuns,
      completedRuns,
      failedRuns,
      deathStats,
      encounterCount,
      playTimeStats,
      generatedRomsCount,
      recentRuns,
    ] = await Promise.all([
      prisma.run.count({ where: { userId: user.id } }),
      prisma.run.count({ where: { userId: user.id, status: 'ACTIVE' } }),
      prisma.run.count({ where: { userId: user.id, status: 'COMPLETED' } }),
      prisma.run.count({ where: { userId: user.id, status: 'FAILED' } }),
      prisma.run.aggregate({ where: { userId: user.id }, _sum: { deathCount: true } }),
      prisma.encounter.count({
        where: { run: { userId: user.id } },
      }),
      prisma.run.aggregate({ where: { userId: user.id }, _sum: { playTimeSeconds: true } }),
      prisma.generatedRom.count({ where: { userId: user.id } }),
      prisma.run.findMany({
        where: { userId: user.id },
        include: {
          game: { select: { title: true, platform: true, coverArt: true } },
          generatedRom: { select: { id: true, seed: true, fileName: true } },
          _count: { select: { pokemonEntries: true, encounters: true } },
        },
        orderBy: [{ lastPlayedAt: 'desc' }, { createdAt: 'desc' }],
        take: 12,
      }),
    ]);

    return success(serializeBigInt({
      stats: {
        totalRuns,
        activeRuns,
        completedRuns,
        failedRuns,
        totalDeaths: deathStats._sum.deathCount ?? 0,
        totalEncounters: encounterCount,
        totalPlayTime: Number(playTimeStats._sum.playTimeSeconds ?? 0),
        generatedRoms: generatedRomsCount,
      },
      recentRuns,
    }));
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return serverError();
  }
}
