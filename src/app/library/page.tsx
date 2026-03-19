'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PlatformBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading';

interface GameEntry {
  id: string;
  title: string;
  slug: string;
  platform: string;
  generation: number;
  region: string;
  description: string | null;
  coverArt: string | null;
  baseRoms: Array<{ id: string; fileName: string; fileSize: number; version: string }>;
  _count: { runs: number };
}

export default function LibraryPage() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  useEffect(() => {
    fetch('/api/library')
      .then(res => res.json())
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <LoadingScreen message="Loading game library..." />
      </AppShell>
    );
  }

  const filtered = filterPlatform === 'all'
    ? games
    : games.filter(g => g.platform === filterPlatform);

  const platforms = ['all', 'GB', 'GBC', 'GBA', 'NDS'];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="nuz-section-title">Game Library</h1>
            <p className="text-nuz-text-dim mt-1">Choose a game to start your Nuzlocke</p>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-4 py-2 rounded-lg font-display font-semibold text-sm whitespace-nowrap transition-all ${
                filterPlatform === p
                  ? 'bg-nuz-primary text-white shadow-nuz-glow'
                  : 'bg-nuz-surface border border-nuz-border text-nuz-text-dim hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Platforms' : p}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">📚</span>
            <h3 className="font-display font-bold text-xl text-white mb-2">No games available</h3>
            <p className="text-nuz-text-dim">The game library will be populated after initial setup.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(game => (
              <div key={game.id} className="nuz-card group overflow-hidden">
                {/* Cover art placeholder */}
                <div className="h-40 bg-nuz-bg relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <span className="font-pixel text-4xl text-nuz-text-dim/30 relative z-10">
                    {game.platform}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-bold text-white group-hover:text-nuz-primary-glow transition-colors">
                      {game.title}
                    </h3>
                    <PlatformBadge platform={game.platform} />
                  </div>

                  <p className="text-nuz-text-dim text-xs mb-3">
                    Gen {game.generation} · {game.region}
                  </p>

                  {game.description && (
                    <p className="text-nuz-text-dim text-sm mb-4 line-clamp-2">{game.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-nuz-text-dim text-xs">
                      {game.baseRoms.length} ROM{game.baseRoms.length !== 1 ? 's' : ''} available
                    </span>
                    <Link
                      href={`/runs/new?gameId=${game.id}`}
                      className="nuz-btn-primary text-xs py-1.5 px-4"
                    >
                      Start Run
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
