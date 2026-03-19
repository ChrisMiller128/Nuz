import prisma from '@/lib/prisma';
import { serverError, success, serializeBigInt } from '@/lib/api-helpers';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        baseRoms: {
          select: { id: true, fileName: true, fileSize: true, version: true },
        },
        _count: { select: { runs: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return success(serializeBigInt(games));
  } catch (error) {
    console.error('Error fetching library:', error);
    return serverError();
  }
}
