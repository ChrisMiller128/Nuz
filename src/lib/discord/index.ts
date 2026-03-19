import prisma from '../prisma';

export type DiscordEventType =
  | 'run_started'
  | 'badge_earned'
  | 'pokemon_died'
  | 'run_completed'
  | 'run_failed'
  | 'shiny_encounter';

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

const EVENT_COLORS: Record<DiscordEventType, number> = {
  run_started: 0x3498db,
  badge_earned: 0xffd700,
  pokemon_died: 0xe74c3c,
  run_completed: 0x2ecc71,
  run_failed: 0xe74c3c,
  shiny_encounter: 0xf1c40f,
};

const EVENT_ICONS: Record<DiscordEventType, string> = {
  run_started: '🎮',
  badge_earned: '🏅',
  pokemon_died: '☠️',
  run_completed: '🏆',
  run_failed: '💀',
  shiny_encounter: '✨',
};

export async function sendDiscordNotification(
  userId: string,
  eventType: DiscordEventType,
  data: {
    runName?: string;
    gameName?: string;
    pokemonName?: string;
    badgeName?: string;
    deathCount?: number;
    route?: string;
    details?: string;
  }
): Promise<boolean> {
  const integration = await prisma.discordIntegration.findUnique({
    where: { userId },
  });

  if (!integration?.isActive || !integration.webhookUrl) return false;

  // Check if this event type is enabled
  const eventEnabled: Record<DiscordEventType, boolean> = {
    run_started: integration.notifyRunStart,
    badge_earned: integration.notifyBadge,
    pokemon_died: integration.notifyDeath,
    run_completed: integration.notifyCompletion,
    run_failed: integration.notifyWipe,
    shiny_encounter: integration.notifyShiny,
  };

  if (!eventEnabled[eventType]) return false;

  const icon = EVENT_ICONS[eventType];
  const color = EVENT_COLORS[eventType];

  const embed: DiscordEmbed = {
    title: `${icon} ${formatEventTitle(eventType, data)}`,
    color,
    fields: [],
    footer: { text: 'Nuzlocke Hub' },
    timestamp: new Date().toISOString(),
  };

  if (data.runName) {
    embed.fields!.push({ name: 'Run', value: data.runName, inline: true });
  }
  if (data.gameName) {
    embed.fields!.push({ name: 'Game', value: data.gameName, inline: true });
  }
  if (data.details) {
    embed.description = data.details;
  }

  try {
    const res = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Nuzlocke Hub',
        embeds: [embed],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function formatEventTitle(
  event: DiscordEventType,
  data: { runName?: string; pokemonName?: string; badgeName?: string; route?: string }
): string {
  switch (event) {
    case 'run_started': return `New Run: ${data.runName || 'Unknown'}`;
    case 'badge_earned': return `Badge Earned: ${data.badgeName || 'Unknown'}`;
    case 'pokemon_died': return `${data.pokemonName || 'A Pokémon'} has fallen!`;
    case 'run_completed': return `Run Completed: ${data.runName || 'Unknown'}!`;
    case 'run_failed': return `Run Failed: ${data.runName || 'Unknown'}`;
    case 'shiny_encounter': return `Shiny ${data.pokemonName || 'Pokémon'} encountered!`;
    default: return 'Nuzlocke Hub Event';
  }
}
