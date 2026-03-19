import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, notFound, serverError, success, serializeBigInt } from '@/lib/api-helpers';
import { saveFile, readFile, StoragePaths, validateFileSize, computeChecksum } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const formData = await req.formData();
    const runId = formData.get('runId') as string;
    const slotNumber = parseInt(formData.get('slotNumber') as string || '0', 10);
    const isAutosave = formData.get('isAutosave') === 'true';
    const file = formData.get('saveFile') as File | null;

    if (!runId) return badRequest('runId is required');
    if (!file) return badRequest('saveFile is required');

    const run = await prisma.run.findFirst({
      where: { id: runId, userId: user.id },
      include: { generatedRom: true },
    });
    if (!run) return notFound('Run not found');

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateFileSize(buffer.length, 'save')) {
      return badRequest('Save file too large');
    }

    const { storagePath, fileSize, checksum } = await saveFile(
      StoragePaths.saves,
      user.id,
      `run_${runId}_slot${slotNumber}.sav`,
      buffer
    );

    const saveState = await prisma.saveState.upsert({
      where: { runId_slotNumber: { runId, slotNumber } },
      create: {
        runId,
        userId: user.id,
        generatedRomId: run.generatedRomId,
        slotNumber,
        isAutosave,
        storagePath,
        fileName: file.name || `save_slot${slotNumber}.sav`,
        fileSize: BigInt(fileSize),
        checksum,
      },
      update: {
        storagePath,
        fileName: file.name || `save_slot${slotNumber}.sav`,
        fileSize: BigInt(fileSize),
        checksum,
        isAutosave,
      },
    });

    await prisma.run.update({
      where: { id: runId },
      data: { lastPlayedAt: new Date() },
    });

    return success(serializeBigInt(saveState), 201);
  } catch (error) {
    console.error('Error saving state:', error);
    return serverError('Failed to save state');
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const runId = req.nextUrl.searchParams.get('runId');
    if (!runId) return badRequest('runId is required');

    const run = await prisma.run.findFirst({ where: { id: runId, userId: user.id } });
    if (!run) return notFound('Run not found');

    const saves = await prisma.saveState.findMany({
      where: { runId, userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return success(serializeBigInt(saves));
  } catch (error) {
    console.error('Error fetching saves:', error);
    return serverError();
  }
}
