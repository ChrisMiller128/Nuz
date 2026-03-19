import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const roms = await prisma.generatedRom.findMany({
      where: { userId: user.id },
      include: {
        baseRom: {
          include: { game: { select: { title: true, platform: true, coverArt: true } } },
        },
        runs: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(serializeBigInt(roms));
  } catch (error) {
    console.error('Error fetching generated ROMs:', error);
    return serverError();
  }
}
