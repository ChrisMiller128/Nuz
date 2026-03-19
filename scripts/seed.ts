import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed generator profiles
  const profiles = await Promise.all([
    prisma.generatorProfile.upsert({
      where: { id: 'profile-classic' },
      update: {},
      create: {
        id: 'profile-classic',
        name: 'Classic Nuzlocke',
        description: 'Standard Nuzlocke with no randomization',
        rulesPreset: 'CLASSIC',
        settingsJson: {
          randomizeStarters: false,
          randomizeWildPokemon: false,
          randomizeTrainers: false,
          levelScaling: 1.0,
        },
        isDefault: true,
      },
    }),
    prisma.generatorProfile.upsert({
      where: { id: 'profile-randomized' },
      update: {},
      create: {
        id: 'profile-randomized',
        name: 'Randomized Nuzlocke',
        description: 'Nuzlocke with randomized Pokémon, trainers, and items',
        rulesPreset: 'CLASSIC',
        settingsJson: {
          randomizeStarters: true,
          randomizeWildPokemon: true,
          randomizeTrainers: true,
          randomizeItems: true,
          levelScaling: 1.0,
        },
        isDefault: false,
      },
    }),
    prisma.generatorProfile.upsert({
      where: { id: 'profile-hardcore' },
      update: {},
      create: {
        id: 'profile-hardcore',
        name: 'Hardcore Nuzlocke',
        description: 'Increased difficulty with level scaling and reduced exp',
        rulesPreset: 'HARDCORE',
        settingsJson: {
          randomizeStarters: false,
          randomizeWildPokemon: false,
          randomizeTrainers: false,
          levelScaling: 1.3,
          expModifier: 0.8,
          minCatchRate: 0,
        },
        isDefault: false,
      },
    }),
  ]);
  console.log(`Created ${profiles.length} generator profiles`);

  // Seed games and base ROMs
  const games = [
    // Game Boy
    { title: 'Pokémon Red', slug: 'pokemon-red', platform: 'GB' as const, generation: 1, region: 'Kanto', description: 'The original Pokémon adventure in the Kanto region.', sortOrder: 1, ext: '.gb' },
    { title: 'Pokémon Blue', slug: 'pokemon-blue', platform: 'GB' as const, generation: 1, region: 'Kanto', description: 'Explore Kanto and catch all 151 Pokémon.', sortOrder: 2, ext: '.gb' },
    { title: 'Pokémon Yellow', slug: 'pokemon-yellow', platform: 'GB' as const, generation: 1, region: 'Kanto', description: 'Follow the anime storyline with Pikachu at your side.', sortOrder: 3, ext: '.gb' },

    // Game Boy Color
    { title: 'Pokémon Gold', slug: 'pokemon-gold', platform: 'GBC' as const, generation: 2, region: 'Johto', description: 'Journey through Johto with 100 new Pokémon.', sortOrder: 4, ext: '.gbc' },
    { title: 'Pokémon Silver', slug: 'pokemon-silver', platform: 'GBC' as const, generation: 2, region: 'Johto', description: 'Discover the mysteries of Johto and beyond.', sortOrder: 5, ext: '.gbc' },
    { title: 'Pokémon Crystal', slug: 'pokemon-crystal', platform: 'GBC' as const, generation: 2, region: 'Johto', description: 'The definitive Gen II experience with animated sprites.', sortOrder: 6, ext: '.gbc' },

    // Game Boy Advance
    { title: 'Pokémon Ruby', slug: 'pokemon-ruby', platform: 'GBA' as const, generation: 3, region: 'Hoenn', description: 'Explore the tropical Hoenn region.', sortOrder: 7, ext: '.gba' },
    { title: 'Pokémon Sapphire', slug: 'pokemon-sapphire', platform: 'GBA' as const, generation: 3, region: 'Hoenn', description: 'Dive into the ocean depths of Hoenn.', sortOrder: 8, ext: '.gba' },
    { title: 'Pokémon Emerald', slug: 'pokemon-emerald', platform: 'GBA' as const, generation: 3, region: 'Hoenn', description: 'The ultimate Hoenn adventure with the Battle Frontier.', sortOrder: 9, ext: '.gba' },
    { title: 'Pokémon FireRed', slug: 'pokemon-firered', platform: 'GBA' as const, generation: 3, region: 'Kanto', description: 'Kanto reimagined with Gen III mechanics.', sortOrder: 10, ext: '.gba' },
    { title: 'Pokémon LeafGreen', slug: 'pokemon-leafgreen', platform: 'GBA' as const, generation: 3, region: 'Kanto', description: 'Return to Kanto in enhanced color.', sortOrder: 11, ext: '.gba' },

    // Nintendo DS
    { title: 'Pokémon Diamond', slug: 'pokemon-diamond', platform: 'NDS' as const, generation: 4, region: 'Sinnoh', description: 'Explore the Sinnoh region on the DS.', sortOrder: 12, ext: '.nds' },
    { title: 'Pokémon Pearl', slug: 'pokemon-pearl', platform: 'NDS' as const, generation: 4, region: 'Sinnoh', description: 'Discover the myths of Sinnoh.', sortOrder: 13, ext: '.nds' },
    { title: 'Pokémon Platinum', slug: 'pokemon-platinum', platform: 'NDS' as const, generation: 4, region: 'Sinnoh', description: 'The definitive Sinnoh experience.', sortOrder: 14, ext: '.nds' },
    { title: 'Pokémon HeartGold', slug: 'pokemon-heartgold', platform: 'NDS' as const, generation: 4, region: 'Johto', description: 'Johto reimagined in full DS glory.', sortOrder: 15, ext: '.nds' },
    { title: 'Pokémon SoulSilver', slug: 'pokemon-soulsilver', platform: 'NDS' as const, generation: 4, region: 'Johto', description: 'The beloved Johto journey remastered.', sortOrder: 16, ext: '.nds' },
    { title: 'Pokémon Black', slug: 'pokemon-black', platform: 'NDS' as const, generation: 5, region: 'Unova', description: 'A bold new Pokémon adventure in Unova.', sortOrder: 17, ext: '.nds' },
    { title: 'Pokémon White', slug: 'pokemon-white', platform: 'NDS' as const, generation: 5, region: 'Unova', description: 'Explore Unova with entirely new Pokémon.', sortOrder: 18, ext: '.nds' },
    { title: 'Pokémon Black 2', slug: 'pokemon-black2', platform: 'NDS' as const, generation: 5, region: 'Unova', description: 'The sequel to Black with new areas.', sortOrder: 19, ext: '.nds' },
    { title: 'Pokémon White 2', slug: 'pokemon-white2', platform: 'NDS' as const, generation: 5, region: 'Unova', description: 'Continue the Unova story.', sortOrder: 20, ext: '.nds' },
  ];

  for (const gameData of games) {
    const { ext, ...gameFields } = gameData;
    const game = await prisma.game.upsert({
      where: { slug: gameFields.slug },
      update: gameFields,
      create: gameFields,
    });

    // Create a placeholder base ROM for each game
    const baseRomId = `baserom-${game.slug}`;
    const storagePath = path.join('/app/storage/base-roms', `${game.slug}${ext}`);

    await prisma.baseRom.upsert({
      where: { id: baseRomId },
      update: {
        fileName: `${game.slug}${ext}`,
        storagePath,
      },
      create: {
        id: baseRomId,
        gameId: game.id,
        fileName: `${game.slug}${ext}`,
        fileSize: BigInt(0),
        checksum: crypto.createHash('sha256').update(game.slug).digest('hex'),
        storagePath,
        version: '1.0',
      },
    });
  }

  console.log(`Seeded ${games.length} games with base ROMs`);

  // Create a demo user
  const demoPasswordHash = await hash('nuzlocke123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@nuzlocke.emulator.st' },
    update: {},
    create: {
      email: 'demo@nuzlocke.emulator.st',
      username: 'DemoTrainer',
      passwordHash: demoPasswordHash,
    },
  });
  console.log('Created demo user (demo@nuzlocke.emulator.st / nuzlocke123)');

  // Seed achievements
  const achievementDefs = [
    { key: 'first_completion', name: 'Champion', description: 'Complete your first Nuzlocke run', icon: '🏆', category: 'COMPLETION' as const, rarity: 'COMMON' as const, points: 50 },
    { key: 'deathless', name: 'Flawless Victory', description: 'Complete a run without losing a single Pokémon', icon: '💎', category: 'COMBAT' as const, rarity: 'LEGENDARY' as const, points: 500 },
    { key: 'hardcore_completion', name: 'Ironman', description: 'Complete a Hardcore Nuzlocke run', icon: '💀', category: 'CHALLENGE' as const, rarity: 'EPIC' as const, points: 200 },
    { key: 'first_wipe', name: 'Wiped Out', description: 'Experience your first team wipe', icon: '☠️', category: 'GENERAL' as const, rarity: 'COMMON' as const, points: 10 },
    { key: 'shiny_encounter', name: 'Shiny Hunter', description: 'Encounter a shiny Pokémon during a run', icon: '✨', category: 'COLLECTION' as const, rarity: 'RARE' as const, points: 100 },
    { key: 'five_completions', name: 'Veteran Trainer', description: 'Complete 5 Nuzlocke runs', icon: '⭐', category: 'COMPLETION' as const, rarity: 'UNCOMMON' as const, points: 100 },
    { key: 'ten_completions', name: 'Nuzlocke Master', description: 'Complete 10 Nuzlocke runs', icon: '👑', category: 'COMPLETION' as const, rarity: 'RARE' as const, points: 250 },
    { key: 'full_badges', name: 'Badge Collector', description: 'Earn all 8 badges in a single run', icon: '🏅', category: 'COMPLETION' as const, rarity: 'UNCOMMON' as const, points: 75 },
    { key: 'comeback_kid', name: 'Comeback Kid', description: 'Complete a run after losing 10+ Pokémon', icon: '🔥', category: 'COMBAT' as const, rarity: 'RARE' as const, points: 150 },
    { key: 'challenge_complete', name: 'Challenger', description: 'Complete a community challenge run', icon: '🎯', category: 'CHALLENGE' as const, rarity: 'UNCOMMON' as const, points: 100 },
    { key: 'share_run', name: 'Show & Tell', description: 'Share a completed run publicly', icon: '📢', category: 'SOCIAL' as const, rarity: 'COMMON' as const, points: 25 },
  ];

  for (const ach of achievementDefs) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
  }
  console.log(`Seeded ${achievementDefs.length} achievements`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
