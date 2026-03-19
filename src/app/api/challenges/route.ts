import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success, serializeBigInt } from '@/lib/api-helpers';
import { getActiveChalllenges, getChallengeLeaderboard } from '@/lib/challenges';

export async function GET(req: NextRequest) {
  try {
    const challengeId = req.nextUrl.searchParams.get('id');

    if (challengeId) {
      const leaderboard = await getChallengeLeaderboard(challengeId);
      if (!leaderboard) return badRequest('Challenge not found');
      return success(serializeBigInt(leaderboard));
    }

    const challenges = await getActiveChalllenges();
    return success(serializeBigInt(challenges));
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return serverError();
  }
}
