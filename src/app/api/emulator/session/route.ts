import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, serverError, success, serializeBigInt } from '@/lib/api-helpers';
import { fileExists } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const runId = req.nextUrl.searchParams.get('runId');
    if (!runId) return notFound('runId is required');

    const run = await prisma.run.findFirst({
      where: { id: runId, userId: user.id },
      include: {
        game: true,
        generatedRom: true,
        saveStates: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!run) return notFound('Run not found');

    const romExists = await fileExists(run.generatedRom.storagePath);

    const latestSave = run.saveStates[0];
    let saveExists = false;
    if (latestSave) {
      saveExists = await fileExists(latestSave.storagePath);
    }

    await prisma.run.update({
      where: { id: runId },
      data: { lastPlayedAt: new Date() },
    });

    return success(serializeBigInt({
      runId: run.id,
      runName: run.name,
      platform: run.game.platform,
      gameTitle: run.game.title,
      romUrl: romExists ? `/api/generated-roms/${run.generatedRomId}/download` : null,
      saveStateUrl: latestSave && saveExists ? `/api/saves/${latestSave.id}/download` : null,
      romReady: romExists,
      generatedRomId: run.generatedRomId,
      seed: run.generatedRom.seed,
    }));
  } catch (error) {
    console.error('Error creating emulator session:', error);
    return serverError();
  }
}
