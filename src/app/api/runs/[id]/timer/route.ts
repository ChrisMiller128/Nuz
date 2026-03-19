import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'start' | 'pause' | 'resume' | 'split' | 'reset'

    const run = await prisma.run.findFirst({ where: { id, userId: user.id } });
    if (!run) return notFound('Run not found');

    const now = new Date();
    let update: Record<string, unknown> = {};

    switch (action) {
      case 'start':
        update = { timerStartedAt: now, timerPausedAt: null, timerElapsedMs: BigInt(0), timerSplits: [] };
        break;
      case 'pause':
        if (run.timerStartedAt && !run.timerPausedAt) {
          const elapsed = BigInt(now.getTime() - run.timerStartedAt.getTime()) + run.timerElapsedMs;
          update = { timerPausedAt: now, timerElapsedMs: elapsed, timerStartedAt: null };
        }
        break;
      case 'resume':
        update = { timerStartedAt: now, timerPausedAt: null };
        break;
      case 'split': {
        const currentElapsed = run.timerStartedAt
          ? BigInt(now.getTime() - run.timerStartedAt.getTime()) + run.timerElapsedMs
          : run.timerElapsedMs;
        const splits = (run.timerSplits as Array<{ label: string; elapsedMs: number }>) || [];
        splits.push({ label: body.label || `Split ${splits.length + 1}`, elapsedMs: Number(currentElapsed) });
        update = { timerSplits: splits };
        break;
      }
      case 'reset':
        update = { timerStartedAt: null, timerPausedAt: null, timerElapsedMs: BigInt(0), timerSplits: [] };
        break;
      default:
        return badRequest('Invalid action. Use: start, pause, resume, split, reset');
    }

    const updated = await prisma.run.update({
      where: { id },
      data: update,
      select: { timerStartedAt: true, timerPausedAt: true, timerElapsedMs: true, timerSplits: true },
    });

    return success(serializeBigInt(updated));
  } catch (error) {
    console.error('Error updating timer:', error);
    return serverError();
  }
}
