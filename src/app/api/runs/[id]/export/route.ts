import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized, notFound, serverError, serializeBigInt } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

const EXPORT_VERSION = 1;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const run = await prisma.run.findFirst({
      where: { id, userId: user.id },
      include: {
        game: { select: { title: true, slug: true, platform: true, generation: true } },
        generatedRom: {
          select: { seed: true, generatorSettingsJson: true, generatorProvider: true, checksum: true },
        },
        pokemonEntries: { orderBy: { order: 'asc' } },
        encounters: { orderBy: { order: 'asc' } },
        badgeProgress: { orderBy: { badgeNumber: 'asc' } },
        runNotes: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!run) return notFound('Run not found');

    const exportData = {
      exportVersion: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'nuzlocke-hub',
      run: {
        name: run.name,
        status: run.status,
        rulesPreset: run.rulesPreset,
        customRulesJson: run.customRulesJson,
        duplicateClause: run.duplicateClause,
        shinyClause: run.shinyClause,
        staticEncounters: run.staticEncounters,
        giftPokemon: run.giftPokemon,
        currentBadges: run.currentBadges,
        deathCount: run.deathCount,
        playTimeSeconds: Number(run.playTimeSeconds),
        starterChoice: run.starterChoice,
        completedAt: run.completedAt,
        failedAt: run.failedAt,
        createdAt: run.createdAt,
      },
      game: run.game,
      generator: {
        seed: run.generatedRom.seed,
        settings: run.generatedRom.generatorSettingsJson,
        provider: run.generatedRom.generatorProvider,
        romChecksum: run.generatedRom.checksum,
      },
      pokemon: run.pokemonEntries.map(p => ({
        nickname: p.nickname,
        species: p.species,
        dexNo: p.dexNo,
        level: p.level,
        status: p.status,
        location: p.location,
        metRoute: p.metRoute,
        metLevel: p.metLevel,
        nature: p.nature,
        ability: p.ability,
        causeOfDeath: p.causeOfDeath,
        diedToTrainer: p.diedToTrainer,
        diedAtRoute: p.diedAtRoute,
        diedAtLevel: p.diedAtLevel,
        notes: p.notes,
      })),
      encounters: run.encounters.map(e => ({
        routeName: e.routeName,
        pokemonName: e.pokemonName,
        pokemonLevel: e.pokemonLevel,
        pokemonDexNo: e.pokemonDexNo,
        status: e.status,
        isStatic: e.isStatic,
        isGift: e.isGift,
        isShiny: e.isShiny,
        notes: e.notes,
      })),
      badges: run.badgeProgress.map(b => ({
        badgeName: b.badgeName,
        badgeNumber: b.badgeNumber,
        gymLeader: b.gymLeader,
        levelCap: b.levelCap,
        obtained: b.obtained,
        obtainedAt: b.obtainedAt,
      })),
      notes: run.runNotes.map(n => ({
        title: n.title,
        content: n.content,
        noteType: n.noteType,
        createdAt: n.createdAt,
      })),
    };

    const json = JSON.stringify(serializeBigInt(exportData), null, 2);
    const filename = `nuzlocke-hub-run-${run.name.replace(/[^a-z0-9]/gi, '-')}.json`;

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting run:', error);
    return serverError();
  }
}
