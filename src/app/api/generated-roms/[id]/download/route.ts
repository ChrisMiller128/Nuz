import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { readFile, fileExists } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const rom = await prisma.generatedRom.findFirst({
      where: { id, userId: user.id },
    });
    if (!rom) return notFound('Generated ROM not found');

    const exists = await fileExists(rom.storagePath);
    if (!exists) return notFound('ROM file not found on disk');

    const data = await readFile(rom.storagePath);

    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${rom.fileName}"`,
        'Content-Length': data.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading ROM:', error);
    return serverError();
  }
}
