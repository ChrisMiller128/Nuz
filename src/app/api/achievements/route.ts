import { getAuthenticatedUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { getUserAchievements, getAllAchievements } from '@/lib/achievements';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const [userAchievements, allAchievements] = await Promise.all([
      getUserAchievements(user.id),
      getAllAchievements(),
    ]);

    const unlockedKeys = new Set(userAchievements.map(ua => ua.achievement.key));
    const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

    return success({
      unlocked: userAchievements,
      all: allAchievements.map(a => ({
        ...a,
        isUnlocked: unlockedKeys.has(a.key),
      })),
      totalPoints,
      unlockedCount: userAchievements.length,
      totalCount: allAchievements.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return serverError();
  }
}
