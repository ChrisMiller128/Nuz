import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { saveFile, StoragePaths } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id: runId } = await params;

    const run = await prisma.run.findFirst({
      where: { id: runId, userId: user.id },
    });
    if (!run) return notFound('Run not found');

    const formData = await req.formData();
    const file = formData.get('screenshot') as File | null;
    const slotNumber = parseInt(formData.get('slotNumber') as string || '0', 10);

    if (!file) return badRequest('screenshot file is required');
    if (file.size > 2 * 1024 * 1024) return badRequest('Screenshot must be under 2MB');

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath } = await saveFile(
      StoragePaths.screenshots,
      user.id,
      `run_${runId}_slot${slotNumber}.png`,
      buffer
    );

    // Update the save state with the screenshot path
    const saveState = await prisma.saveState.findUnique({
      where: { runId_slotNumber: { runId, slotNumber } },
    });

    if (saveState) {
      await prisma.saveState.update({
        where: { id: saveState.id },
        data: {
          screenshotPath: storagePath,
          screenshotUrl: `/api/runs/${runId}/screenshot?slot=${slotNumber}`,
        },
      });
    }

    return success({ screenshotPath: storagePath });
  } catch (error) {
    console.error('Error saving screenshot:', error);
    return serverError();
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;
    const slot = parseInt(req.nextUrl.searchParams.get('slot') || '0', 10);

    const saveState = await prisma.saveState.findUnique({
      where: { runId_slotNumber: { runId, slotNumber: slot } },
    });

    if (!saveState?.screenshotPath) return notFound('No screenshot');

    const { readFile, fileExists } = await import('@/lib/storage');
    if (!(await fileExists(saveState.screenshotPath))) return notFound('Screenshot file missing');

    const data = await readFile(saveState.screenshotPath);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving screenshot:', error);
    return serverError();
  }
}
