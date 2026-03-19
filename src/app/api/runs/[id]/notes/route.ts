import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const noteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  noteType: z.enum(['GENERAL', 'MILESTONE', 'DEATH', 'BADGE', 'STRATEGY']).default('GENERAL'),
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
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const maxOrder = await prisma.runNote.aggregate({
      where: { runId },
      _max: { order: true },
    });

    const note = await prisma.runNote.create({
      data: {
        runId,
        ...parsed.data,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return success(note, 201);
  } catch (error) {
    console.error('Error adding note:', error);
    return serverError();
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id: runId } = await params;
    const run = await prisma.run.findFirst({ where: { id: runId, userId: user.id } });
    if (!run) return notFound('Run not found');

    const notes = await prisma.runNote.findMany({
      where: { runId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return success(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return serverError();
  }
}
