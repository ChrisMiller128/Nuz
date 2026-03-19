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

    const saveState = await prisma.saveState.findFirst({
      where: { id, userId: user.id },
    });
    if (!saveState) return notFound('Save state not found');

    const exists = await fileExists(saveState.storagePath);
    if (!exists) return notFound('Save file not found on disk');

    const data = await readFile(saveState.storagePath);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${saveState.fileName}"`,
        'Content-Length': data.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading save:', error);
    return serverError();
  }
}
