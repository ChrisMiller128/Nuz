import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success, serializeBigInt } from '@/lib/api-helpers';
import { generateRom, DEFAULT_GENERATOR_SETTINGS, PRESET_CONFIGS } from '@/lib/generator';
import { z } from 'zod';

const generateSchema = z.object({
  baseRomId: z.string(),
  seed: z.string().optional(),
  preset: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  generatorProfileId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { baseRomId, seed, preset, settings, generatorProfileId } = parsed.data;

    const baseRom = await prisma.baseRom.findUnique({ where: { id: baseRomId } });
    if (!baseRom) return badRequest('Base ROM not found');

    let finalSettings = { ...DEFAULT_GENERATOR_SETTINGS };
    if (preset && PRESET_CONFIGS[preset]) {
      finalSettings = { ...finalSettings, ...PRESET_CONFIGS[preset] };
    }
    if (settings) {
      finalSettings = { ...finalSettings, ...settings } as typeof finalSettings;
    }

    const result = await generateRom({
      userId: user.id,
      baseRomId,
      settings: finalSettings,
      seed,
      generatorProfileId,
    });

    return success(serializeBigInt(result), 201);
  } catch (error) {
    console.error('Error generating ROM:', error);
    return serverError('Failed to generate ROM');
  }
}

export async function GET() {
  try {
    return success({
      presets: Object.entries(PRESET_CONFIGS).map(([key, config]) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        settings: config,
      })),
      defaultSettings: DEFAULT_GENERATOR_SETTINGS,
    });
  } catch (error) {
    console.error('Error fetching generator config:', error);
    return serverError();
  }
}
