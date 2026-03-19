import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const run = await prisma.run.findFirst({
      where: { id, userId: user.id },
      include: {
        game: {
          include: { baseRoms: { select: { id: true, fileName: true, fileSize: true, version: true } } },
        },
        generatedRom: {
          select: {
            id: true,
            seed: true,
            fileName: true,
            checksum: true,
            generatorSettingsJson: true,
            createdAt: true,
          },
        },
        pokemonEntries: { orderBy: { order: 'asc' } },
        encounters: { orderBy: { order: 'asc' } },
        badgeProgress: { orderBy: { badgeNumber: 'asc' } },
        runNotes: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] },
        saveStates: {
          select: { id: true, slotNumber: true, isAutosave: true, fileSize: true, createdAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!run) return notFound('Run not found');

    return success(serializeBigInt(run));
  } catch (error) {
    console.error('Error fetching run:', error);
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.run.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound('Run not found');

    const allowedFields = [
      'name', 'status', 'currentBadges', 'deathCount',
      'playTimeSeconds', 'lastPlayedAt', 'completedAt', 'failedAt',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.status === 'FAILED' && !updateData.failedAt) {
      updateData.failedAt = new Date();
    }
    if (body.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const run = await prisma.run.update({
      where: { id },
      data: updateData,
    });

    return success(serializeBigInt(run));
  } catch (error) {
    console.error('Error updating run:', error);
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const existing = await prisma.run.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound('Run not found');

    await prisma.run.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error('Error deleting run:', error);
    return serverError();
  }
}
