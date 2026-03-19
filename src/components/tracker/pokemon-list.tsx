'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';

interface PokemonEntry {
  id: string;
  nickname: string;
  species: string;
  level: number;
  status: string;
  location: string;
  metRoute: string | null;
  metLevel: number | null;
  nature: string | null;
  ability: string | null;
  causeOfDeath: string | null;
  notes: string | null;
}

interface PokemonListProps {
  pokemon: PokemonEntry[];
  onUpdateStatus?: (id: string, status: string, location: string) => void;
}

export function PokemonList({ pokemon, onUpdateStatus }: PokemonListProps) {
  const [filter, setFilter] = useState<'all' | 'PARTY' | 'BOX' | 'GRAVEYARD'>('all');

  const filtered = filter === 'all' ? pokemon : pokemon.filter(p => p.location === filter);

  const partyCt = pokemon.filter(p => p.location === 'PARTY').length;
  const boxCt = pokemon.filter(p => p.location === 'BOX').length;
  const graveCt = pokemon.filter(p => p.location === 'GRAVEYARD').length;

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { key: 'all' as const, label: `All (${pokemon.length})`, icon: '📋' },
          { key: 'PARTY' as const, label: `Party (${partyCt})`, icon: '⚔' },
          { key: 'BOX' as const, label: `Box (${boxCt})`, icon: '📦' },
          { key: 'GRAVEYARD' as const, label: `Graveyard (${graveCt})`, icon: '🪦' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-nuz-primary text-white shadow-nuz-glow'
                : 'bg-nuz-surface border border-nuz-border text-nuz-text-dim hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pokemon Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-nuz-text-dim">
          <span className="text-3xl block mb-2">🔍</span>
          <p>No Pokémon in this category yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(poke => (
            <div
              key={poke.id}
              className={`nuz-card-flat p-4 flex items-center gap-4 ${
                poke.status === 'DEAD' ? 'opacity-60' : ''
              }`}
            >
              {/* Level Badge */}
              <div className="w-12 h-12 rounded-xl bg-nuz-bg flex flex-col items-center justify-center border border-nuz-border">
                <span className="font-pixel text-[8px] text-nuz-text-dim">LV</span>
                <span className="font-display font-bold text-white">{poke.level}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-white truncate">{poke.nickname}</h4>
                  <span className="text-nuz-text-dim text-sm">({poke.species})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {poke.metRoute && (
                    <span className="text-nuz-text-dim text-xs">📍 {poke.metRoute}</span>
                  )}
                  {poke.nature && (
                    <span className="text-nuz-text-dim text-xs">· {poke.nature}</span>
                  )}
                </div>
                {poke.causeOfDeath && (
                  <p className="text-nuz-ruby text-xs mt-1">☠ {poke.causeOfDeath}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={poke.location} size="xs" />
                {onUpdateStatus && poke.status !== 'DEAD' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onUpdateStatus(poke.id, 'ALIVE', 'PARTY')}
                      className="text-[10px] px-2 py-0.5 rounded bg-nuz-emerald/10 text-nuz-emerald hover:bg-nuz-emerald/20 transition-colors"
                      title="Move to Party"
                    >
                      ⚔
                    </button>
                    <button
                      onClick={() => onUpdateStatus(poke.id, 'ALIVE', 'BOX')}
                      className="text-[10px] px-2 py-0.5 rounded bg-nuz-sapphire/10 text-nuz-sapphire hover:bg-nuz-sapphire/20 transition-colors"
                      title="Move to Box"
                    >
                      📦
                    </button>
                    <button
                      onClick={() => onUpdateStatus(poke.id, 'DEAD', 'GRAVEYARD')}
                      className="text-[10px] px-2 py-0.5 rounded bg-nuz-ruby/10 text-nuz-ruby hover:bg-nuz-ruby/20 transition-colors"
                      title="Mark as Dead"
                    >
                      ☠
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
