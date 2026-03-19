import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success, serializeBigInt } from '@/lib/api-helpers';
import { generateRom, DEFAULT_GENERATOR_SETTINGS } from '@/lib/generator';
import { z } from 'zod';

const createRunSchema = z.object({
  name: z.string().min(1).max(100),
  gameId: z.string(),
  baseRomId: z.string(),
  rulesPreset: z.enum(['CLASSIC', 'HARDCORE', 'CUSTOM']),
  starterChoice: z.string().optional(),
  duplicateClause: z.boolean().default(true),
  shinyClause: z.boolean().default(false),
  staticEncounters: z.boolean().default(true),
  giftPokemon: z.enum(['ALLOWED', 'FIRST_ONLY', 'BANNED']).default('ALLOWED'),
  generatorSettings: z.record(z.unknown()).optional(),
  seed: z.string().optional(),
  generatorProfileId: z.string().optional(),
  customRulesJson: z.record(z.boolean()).optional(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const runs = await prisma.run.findMany({
      where: { userId: user.id },
      include: {
        game: { select: { title: true, platform: true, coverArt: true } },
        generatedRom: { select: { id: true, seed: true, fileName: true } },
        _count: { select: { pokemonEntries: true, encounters: true } },
      },
      orderBy: [{ lastPlayedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return success(serializeBigInt(runs));
  } catch (error) {
    console.error('Error fetching runs:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = createRunSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const data = parsed.data;

    const game = await prisma.game.findUnique({ where: { id: data.gameId } });
    if (!game) return badRequest('Game not found');

    const baseRom = await prisma.baseRom.findFirst({
      where: { id: data.baseRomId, gameId: data.gameId },
    });
    if (!baseRom) return badRequest('Base ROM not found for this game');

    const settings = { ...DEFAULT_GENERATOR_SETTINGS, ...data.generatorSettings };

    const genResult = await generateRom({
      userId: user.id,
      baseRomId: data.baseRomId,
      settings,
      seed: data.seed,
      generatorProfileId: data.generatorProfileId,
    });

    const run = await prisma.run.create({
      data: {
        userId: user.id,
        gameId: data.gameId,
        baseRomId: data.baseRomId,
        generatedRomId: genResult.generatedRomId,
        name: data.name,
        rulesPreset: data.rulesPreset,
        customRulesJson: data.customRulesJson || undefined,
        starterChoice: data.starterChoice,
        duplicateClause: data.duplicateClause,
        shinyClause: data.shinyClause,
        staticEncounters: data.staticEncounters,
        giftPokemon: data.giftPokemon,
      },
      include: {
        game: true,
        generatedRom: true,
      },
    });

    return success(serializeBigInt(run), 201);
  } catch (error) {
    console.error('Error creating run:', error);
    return serverError('Failed to create run');
  }
}
