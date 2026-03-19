'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';
import { StatusBadge, PlatformBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

interface ChallengeEntry {
  id: string;
  name: string;
  description: string;
  slug: string;
  seed: string;
  rulesPreset: string;
  rankMetric: string;
  isActive: boolean;
  game: { title: string; platform: string };
  _count: { entries: number };
}

export default function LeaderboardsPage() {
  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/challenges').then(r => r.json()).then(setChallenges).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><LoadingScreen message="Loading challenges..." /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="nuz-section-title mb-2">
            <span className="nuz-gradient-text">Leaderboards</span> & Challenges
          </h1>
          <p className="text-nuz-text-dim">Compete with shared seeds and preset rules</p>
        </div>

        {challenges.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No active challenges"
            description="Community challenges will appear here. Stay tuned!"
          />
        ) : (
          <div className="grid gap-6">
            {challenges.map(ch => (
              <div key={ch.id} className="nuz-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-xl text-white">{ch.name}</h3>
                      <PlatformBadge platform={ch.game.platform} />
                      <StatusBadge status={ch.rulesPreset} size="xs" />
                    </div>
                    <p className="text-nuz-text-dim text-sm mb-3">{ch.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="nuz-chip text-[10px]">
                        <span className="text-nuz-text-dim">SEED:</span>
                        <span className="text-nuz-primary font-mono">{ch.seed.slice(0, 12)}</span>
                      </span>
                      <span className="text-nuz-text-dim text-xs">{ch.game.title}</span>
                      <span className="text-nuz-text-dim text-xs">
                        Ranked by: {ch.rankMetric.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-extrabold text-3xl text-nuz-primary">{ch._count.entries}</p>
                    <p className="text-nuz-text-dim text-xs">entries</p>
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
