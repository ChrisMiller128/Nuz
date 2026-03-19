import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const addEncounterSchema = z.object({
  routeName: z.string().min(1).max(100),
  pokemonName: z.string().optional(),
  pokemonLevel: z.number().int().optional(),
  status: z.enum(['PENDING', 'CAUGHT', 'MISSED', 'FAILED', 'SKIPPED']).default('PENDING'),
  isStatic: z.boolean().default(false),
  isGift: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateEncounterSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'CAUGHT', 'MISSED', 'FAILED', 'SKIPPED']).optional(),
  pokemonName: z.string().optional(),
  pokemonLevel: z.number().int().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id: runId } = await params;
    const run = await prisma.run.findFirst({ where: { id: runId, userId: user.id } });
    if (!run) return notFound('Run not found');

    const body = await req.json();
    const parsed = addEncounterSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const maxOrder = await prisma.encounter.aggregate({
      where: { runId },
      _max: { order: true },
    });

    const encounter = await prisma.encounter.create({
      data: {
        runId,
        ...parsed.data,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return success(encounter, 201);
  } catch (error) {
    console.error('Error adding encounter:', error);
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

    const { id: runId } = await params;
    const run = await prisma.run.findFirst({ where: { id: runId, userId: user.id } });
    if (!run) return notFound('Run not found');

    const body = await req.json();
    const parsed = updateEncounterSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { id: encounterId, ...updateData } = parsed.data;

    const existing = await prisma.encounter.findFirst({
      where: { id: encounterId, runId },
    });
    if (!existing) return notFound('Encounter not found');

    const encounter = await prisma.encounter.update({
      where: { id: encounterId },
      data: updateData,
    });

    return success(encounter);
  } catch (error) {
    console.error('Error updating encounter:', error);
    return serverError();
  }
}
