import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const presetSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  gameId: z.string().optional(),
  settingsJson: z.record(z.unknown()),
  tags: z.array(z.string()).max(10).default([]),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const gameId = req.nextUrl.searchParams.get('gameId');
    const tag = req.nextUrl.searchParams.get('tag');
    const sort = req.nextUrl.searchParams.get('sort') || 'popular';

    const where: Record<string, unknown> = { isPublished: true };
    if (gameId) where.gameId = gameId;
    if (tag) where.tags = { has: tag };

    const orderBy = sort === 'newest'
      ? { createdAt: 'desc' as const }
      : { usageCount: 'desc' as const };

    const presets = await prisma.communityPreset.findMany({
      where,
      include: {
        author: { select: { username: true } },
        game: { select: { title: true, platform: true } },
        _count: { select: { votes: true } },
      },
      orderBy,
      take: 50,
    });

    return success(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = presetSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const preset = await prisma.communityPreset.create({
      data: {
        authorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        gameId: parsed.data.gameId,
        settingsJson: parsed.data.settingsJson as object,
        tags: parsed.data.tags,
        isPublished: parsed.data.isPublished,
      },
    });

    return success(preset, 201);
  } catch (error) {
    console.error('Error creating preset:', error);
    return serverError();
  }
}
