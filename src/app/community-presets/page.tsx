'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';
import { PlatformBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Preset {
  id: string;
  title: string;
  description: string | null;
  settingsJson: Record<string, unknown>;
  tags: string[];
  usageCount: number;
  isFeatured: boolean;
  createdAt: string;
  author: { username: string };
  game: { title: string; platform: string } | null;
  _count: { votes: number };
}

export default function CommunityPresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'popular' | 'newest'>('popular');

  useEffect(() => {
    fetch(`/api/community-presets?sort=${sort}`)
      .then(r => r.json())
      .then(setPresets)
      .finally(() => setLoading(false));
  }, [sort]);

  if (loading) return <AppShell><LoadingScreen /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="nuz-section-title mb-2">
            Community <span className="nuz-gradient-text">Presets</span>
          </h1>
          <p className="text-nuz-text-dim">Generator settings shared by the community</p>
        </div>

        {/* Sort controls */}
        <div className="flex justify-center gap-2 mb-8">
          {(['popular', 'newest'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-4 py-2 rounded-lg font-display font-semibold text-sm capitalize ${
                sort === s
                  ? 'bg-nuz-primary text-white shadow-nuz-glow'
                  : 'bg-nuz-surface border border-nuz-border text-nuz-text-dim hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {presets.length === 0 ? (
          <EmptyState
            icon="⚙"
            title="No community presets yet"
            description="Be the first to share a generator preset!"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {presets.map(preset => (
              <div key={preset.id} className="nuz-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-bold text-white">{preset.title}</h3>
                    <p className="text-nuz-text-dim text-xs">by {preset.author.username}</p>
                  </div>
                  {preset.isFeatured && (
                    <span className="font-pixel text-[8px] text-nuz-gold bg-nuz-gold/10 px-2 py-1 rounded">★ FEATURED</span>
                  )}
                </div>
                {preset.description && (
                  <p className="text-nuz-text-dim text-sm mb-3">{preset.description}</p>
                )}
                {preset.game && (
                  <div className="flex items-center gap-2 mb-3">
                    <PlatformBadge platform={preset.game.platform} />
                    <span className="text-nuz-text-dim text-xs">{preset.game.title}</span>
                  </div>
                )}
                {preset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {preset.tags.map(tag => (
                      <span key={tag} className="nuz-chip text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-nuz-border/30">
                  <div className="flex items-center gap-3 text-xs text-nuz-text-dim">
                    <span>👍 {preset._count.votes}</span>
                    <span>📥 {preset.usageCount} uses</span>
                  </div>
                  <button className="nuz-btn-primary text-xs py-1.5 px-3">
                    Use Preset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
