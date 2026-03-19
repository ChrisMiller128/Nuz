import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const addPokemonSchema = z.object({
  nickname: z.string().min(1).max(30),
  species: z.string().min(1).max(30),
  level: z.number().int().min(1).max(100).default(5),
  status: z.enum(['ALIVE', 'DEAD', 'RELEASED']).default('ALIVE'),
  location: z.enum(['PARTY', 'BOX', 'GRAVEYARD']).default('PARTY'),
  metRoute: z.string().optional(),
  metLevel: z.number().int().optional(),
  nature: z.string().optional(),
  ability: z.string().optional(),
  notes: z.string().optional(),
});

const updatePokemonSchema = z.object({
  id: z.string(),
  nickname: z.string().optional(),
  level: z.number().int().optional(),
  status: z.enum(['ALIVE', 'DEAD', 'RELEASED']).optional(),
  location: z.enum(['PARTY', 'BOX', 'GRAVEYARD']).optional(),
  causeOfDeath: z.string().optional(),
  diedToTrainer: z.string().optional(),
  diedAtRoute: z.string().optional(),
  diedAtLevel: z.number().int().optional(),
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
    const parsed = addPokemonSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const maxOrder = await prisma.pokemonEntry.aggregate({
      where: { runId },
      _max: { order: true },
    });

    const pokemon = await prisma.pokemonEntry.create({
      data: {
        runId,
        ...parsed.data,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    if (parsed.data.status === 'DEAD' || parsed.data.location === 'GRAVEYARD') {
      await prisma.run.update({
        where: { id: runId },
        data: { deathCount: { increment: 1 } },
      });
    }

    return success(pokemon, 201);
  } catch (error) {
    console.error('Error adding pokemon:', error);
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
    const parsed = updatePokemonSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { id: pokemonId, ...updateData } = parsed.data;

    const existing = await prisma.pokemonEntry.findFirst({
      where: { id: pokemonId, runId },
    });
    if (!existing) return notFound('Pokemon not found');

    const wasDead = existing.status === 'DEAD';
    const willBeDead = updateData.status === 'DEAD';
    if (!wasDead && willBeDead) {
      await prisma.run.update({
        where: { id: runId },
        data: { deathCount: { increment: 1 } },
      });
      if (!updateData.location) {
        updateData.location = 'GRAVEYARD';
      }
    }

    const pokemon = await prisma.pokemonEntry.update({
      where: { id: pokemonId },
      data: updateData,
    });

    return success(pokemon);
  } catch (error) {
    console.error('Error updating pokemon:', error);
    return serverError();
  }
}
