import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const teamPlanSchema = z.object({
  name: z.string().min(1).max(100),
  gameSlug: z.string().optional(),
  notes: z.string().max(2000).optional(),
  slots: z.array(z.object({
    species: z.string(),
    dexNo: z.number().optional(),
    nickname: z.string().optional(),
    role: z.string().optional(),
    notes: z.string().optional(),
    types: z.array(z.string()).optional(),
  })).max(6),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const plans = await prisma.teamPlan.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return success(plans);
  } catch (error) {
    console.error('Error fetching team plans:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = teamPlanSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const plan = await prisma.teamPlan.create({
      data: {
        userId: user.id,
        ...parsed.data,
      },
    });

    return success(plan, 201);
  } catch (error) {
    console.error('Error creating team plan:', error);
    return serverError();
  }
}
