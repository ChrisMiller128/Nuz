import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { notFound, serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const run = await prisma.run.findFirst({
      where: { shareSlug: slug, isPublic: true },
      include: {
        user: { select: { username: true } },
        game: { select: { title: true, platform: true } },
        generatedRom: { select: { seed: true, generatorSettingsJson: true } },
        pokemonEntries: { orderBy: { order: 'asc' } },
        encounters: { orderBy: { order: 'asc' } },
        badgeProgress: { orderBy: { badgeNumber: 'asc' } },
        runNotes: {
          where: { noteType: { in: ['MILESTONE', 'BADGE', 'GENERAL'] } },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!run) return notFound('Shared run not found');

    // Expose tracker data only — no ROM downloads or save paths
    return success(serializeBigInt({
      name: run.name,
      username: run.user.username,
      status: run.status,
      rulesPreset: run.rulesPreset,
      gameTitle: run.game.title,
      platform: run.game.platform,
      seed: run.generatedRom.seed,
      currentBadges: run.currentBadges,
      deathCount: run.deathCount,
      playTimeSeconds: run.playTimeSeconds,
      completedAt: run.completedAt,
      failedAt: run.failedAt,
      createdAt: run.createdAt,
      pokemonEntries: run.pokemonEntries,
      encounters: run.encounters,
      badgeProgress: run.badgeProgress,
      highlights: run.runNotes,
    }));
  } catch (error) {
    console.error('Error fetching shared run:', error);
    return serverError();
  }
}
