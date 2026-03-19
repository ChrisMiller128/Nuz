import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const discordSchema = z.object({
  webhookUrl: z.string().url().startsWith('https://discord.com/api/webhooks/'),
  isActive: z.boolean().default(true),
  notifyRunStart: z.boolean().default(true),
  notifyBadge: z.boolean().default(true),
  notifyDeath: z.boolean().default(true),
  notifyCompletion: z.boolean().default(true),
  notifyShiny: z.boolean().default(true),
  notifyWipe: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const integration = await prisma.discordIntegration.findUnique({
      where: { userId: user.id },
    });

    return success(integration ? {
      ...integration,
      webhookUrl: integration.webhookUrl ? '••••••' + integration.webhookUrl.slice(-8) : null,
    } : null);
  } catch (error) {
    console.error('Error fetching discord integration:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = discordSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const integration = await prisma.discordIntegration.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...parsed.data },
      update: parsed.data,
    });

    return success({
      ...integration,
      webhookUrl: '••••••' + integration.webhookUrl.slice(-8),
    });
  } catch (error) {
    console.error('Error saving discord integration:', error);
    return serverError();
  }
}

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    await prisma.discordIntegration.deleteMany({ where: { userId: user.id } });
    return success({ deleted: true });
  } catch (error) {
    console.error('Error deleting discord integration:', error);
    return serverError();
  }
}
