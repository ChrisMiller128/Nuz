'use client';

import Link from 'next/link';
import { StatusBadge, PlatformBadge } from '@/components/ui/status-badge';

interface RunCardProps {
  id: string;
  name: string;
  status: string;
  rulesPreset: string;
  currentBadges: number;
  deathCount: number;
  lastPlayedAt: string | null;
  gameTitle: string;
  platform: string;
  seed: string;
  pokemonCount: number;
  encounterCount: number;
}

export function RunCard({
  id,
  name,
  status,
  rulesPreset,
  currentBadges,
  deathCount,
  lastPlayedAt,
  gameTitle,
  platform,
  seed,
  pokemonCount,
  encounterCount,
}: RunCardProps) {
  const isPlayable = status === 'ACTIVE';

  return (
    <div className="nuz-card group relative overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-1 ${
        status === 'ACTIVE' ? 'bg-nuz-emerald' :
        status === 'COMPLETED' ? 'bg-nuz-gold' :
        status === 'FAILED' ? 'bg-nuz-ruby' :
        'bg-nuz-text-dim'
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg text-white truncate group-hover:text-nuz-primary-glow transition-colors">
              {name}
            </h3>
            <p className="text-nuz-text-dim text-sm mt-0.5">{gameTitle}</p>
          </div>
          <PlatformBadge platform={platform} />
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge status={status} size="xs" />
          <StatusBadge status={rulesPreset} size="xs" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-nuz-bg/50">
            <p className="font-pixel text-[10px] text-nuz-text-dim">BADGES</p>
            <p className="font-display font-bold text-lg text-nuz-gold">{currentBadges}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-nuz-bg/50">
            <p className="font-pixel text-[10px] text-nuz-text-dim">DEATHS</p>
            <p className="font-display font-bold text-lg text-nuz-ruby">{deathCount}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-nuz-bg/50">
            <p className="font-pixel text-[10px] text-nuz-text-dim">TEAM</p>
            <p className="font-display font-bold text-lg text-nuz-sapphire">{pokemonCount}</p>
          </div>
        </div>

        {/* Seed chip */}
        <div className="flex items-center gap-2 mb-4">
          <span className="nuz-chip text-[10px]">
            <span className="text-nuz-text-dim">SEED:</span>
            <span className="text-nuz-primary font-mono">{seed.slice(0, 8)}</span>
          </span>
          <span className="text-nuz-text-dim text-xs">
            {encounterCount} encounters
          </span>
        </div>

        {/* Last played */}
        {lastPlayedAt && (
          <p className="text-nuz-text-dim text-xs mb-4">
            Last played {new Date(lastPlayedAt).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isPlayable && (
            <Link href={`/play/${id}`} className="nuz-btn-primary flex-1 text-center text-sm py-2">
              ▶ Continue
            </Link>
          )}
          <Link
            href={`/runs/${id}`}
            className={`nuz-btn-secondary text-center text-sm py-2 ${isPlayable ? '' : 'flex-1'}`}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
