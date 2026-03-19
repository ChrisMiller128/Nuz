import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const run = await prisma.run.findFirst({ where: { id, userId: user.id } });
    if (!run) return notFound('Run not found');
    if (run.status !== 'COMPLETED' && run.status !== 'FAILED') {
      return badRequest('Only completed or failed runs can be shared');
    }

    const isPublic = body.isPublic !== false;
    let shareSlug = run.shareSlug;

    if (isPublic && !shareSlug) {
      shareSlug = `${run.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${crypto.randomBytes(4).toString('hex')}`;
    }

    const updated = await prisma.run.update({
      where: { id },
      data: { isPublic, shareSlug: isPublic ? shareSlug : null },
    });

    return success({
      isPublic: updated.isPublic,
      shareSlug: updated.shareSlug,
      shareUrl: updated.shareSlug ? `/share/${updated.shareSlug}` : null,
    });
  } catch (error) {
    console.error('Error sharing run:', error);
    return serverError();
  }
}
