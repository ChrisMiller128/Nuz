import { getAuthenticatedUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { getUserAnalytics } from '@/lib/analytics';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const analytics = await getUserAnalytics(user.id);
    return success(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return serverError();
  }
}
