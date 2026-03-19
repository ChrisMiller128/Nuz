'use client';

import type { RunStatus, RulesPreset, PokemonStatus, EncounterStatus, PokemonLocation } from '@/types';

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-nuz-emerald/20 text-nuz-emerald border-nuz-emerald/30',
  COMPLETED: 'bg-nuz-gold/20 text-nuz-gold border-nuz-gold/30',
  FAILED: 'bg-nuz-ruby/20 text-nuz-ruby border-nuz-ruby/30',
  ABANDONED: 'bg-nuz-text-dim/20 text-nuz-text-dim border-nuz-text-dim/30',
  ALIVE: 'bg-nuz-emerald/20 text-nuz-emerald border-nuz-emerald/30',
  DEAD: 'bg-nuz-ruby/20 text-nuz-ruby border-nuz-ruby/30',
  RELEASED: 'bg-nuz-text-dim/20 text-nuz-text-dim border-nuz-text-dim/30',
  CAUGHT: 'bg-nuz-emerald/20 text-nuz-emerald border-nuz-emerald/30',
  MISSED: 'bg-nuz-gold/20 text-nuz-gold border-nuz-gold/30',
  PENDING: 'bg-nuz-sapphire/20 text-nuz-sapphire border-nuz-sapphire/30',
  SKIPPED: 'bg-nuz-text-dim/20 text-nuz-text-dim border-nuz-text-dim/30',
  PARTY: 'bg-nuz-primary/20 text-nuz-primary border-nuz-primary/30',
  BOX: 'bg-nuz-sapphire/20 text-nuz-sapphire border-nuz-sapphire/30',
  GRAVEYARD: 'bg-nuz-ruby/20 text-nuz-ruby border-nuz-ruby/30',
  CLASSIC: 'bg-nuz-gold/20 text-nuz-gold border-nuz-gold/30',
  HARDCORE: 'bg-nuz-ruby/20 text-nuz-ruby border-nuz-ruby/30',
  CUSTOM: 'bg-nuz-gba-purple/20 text-nuz-gba-purple border-nuz-gba-purple/30',
};

const statusIcons: Record<string, string> = {
  ACTIVE: '▶',
  COMPLETED: '★',
  FAILED: '✖',
  ABANDONED: '○',
  ALIVE: '♥',
  DEAD: '☠',
  CAUGHT: '◉',
  MISSED: '○',
  PARTY: '⚔',
  BOX: '📦',
  GRAVEYARD: '🪦',
  CLASSIC: '🏆',
  HARDCORE: '💀',
  CUSTOM: '⚙',
};

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: RunStatus | RulesPreset | PokemonStatus | EncounterStatus | PokemonLocation | string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const style = statusStyles[status] || 'bg-nuz-surface-alt text-nuz-text-dim border-nuz-border';
  const icon = statusIcons[status] || '';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-pixel uppercase tracking-wider ${style} ${sizeClasses[size]}`}>
      {icon && <span>{icon}</span>}
      {status}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    GB: 'bg-nuz-gb-green/20 text-nuz-gb-green border-nuz-gb-green/30',
    GBC: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    GBA: 'bg-nuz-gba-purple/20 text-nuz-gba-purple border-nuz-gba-purple/30',
    NDS: 'bg-nuz-ds-blue/20 text-nuz-ds-blue border-nuz-ds-blue/30',
  };

  const labels: Record<string, string> = {
    GB: 'Game Boy',
    GBC: 'GBC',
    GBA: 'GBA',
    NDS: 'NDS',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-pixel uppercase border ${colors[platform] || ''}`}>
      {labels[platform] || platform}
    </span>
  );
}
