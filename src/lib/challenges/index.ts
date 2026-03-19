import prisma from '../prisma';
import { serializeBigInt } from '../api-helpers';

export async function getActiveChalllenges() {
  const now = new Date();
  return prisma.challenge.findMany({
    where: {
      isActive: true,
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } },
      ],
    },
    include: {
      game: { select: { title: true, platform: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getChallengeLeaderboard(challengeId: string, limit = 50) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { game: true },
  });
  if (!challenge) return null;

  const entries = await prisma.challengeEntry.findMany({
    where: {
      challengeId,
      status: 'COMPLETED',
    },
    include: {
      user: { select: { username: true, avatarUrl: true } },
      run: {
        select: {
          name: true,
          deathCount: true,
          playTimeSeconds: true,
          currentBadges: true,
          completedAt: true,
        },
      },
    },
    orderBy: getOrderByForMetric(challenge.rankMetric),
    take: limit,
  });

  return { challenge: serializeBigInt(challenge), entries: serializeBigInt(entries) };
}

function getOrderByForMetric(metric: string) {
  switch (metric) {
    case 'COMPLETION_TIME':
      return { completionMs: 'asc' as const };
    case 'DEATH_COUNT':
      return { deathCount: 'asc' as const };
    case 'BADGE_SPEED':
      return { completionMs: 'asc' as const };
    case 'ATTEMPTS':
      return { submittedAt: 'asc' as const };
    default:
      return { completionMs: 'asc' as const };
  }
}

export async function submitChallengeEntry(params: {
  challengeId: string;
  userId: string;
  runId: string;
}) {
  const { challengeId, userId, runId } = params;

  const run = await prisma.run.findFirst({
    where: { id: runId, userId },
  });
  if (!run) throw new Error('Run not found');

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge || !challenge.isActive) throw new Error('Challenge not active');

  return prisma.challengeEntry.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: {
      challengeId,
      userId,
      runId,
      deathCount: run.deathCount,
      badgeCount: run.currentBadges,
      status: run.status,
      completionMs: run.status === 'COMPLETED' ? run.timerElapsedMs : null,
    },
    update: {
      deathCount: run.deathCount,
      badgeCount: run.currentBadges,
      status: run.status,
      completionMs: run.status === 'COMPLETED' ? run.timerElapsedMs : null,
    },
  });
}
