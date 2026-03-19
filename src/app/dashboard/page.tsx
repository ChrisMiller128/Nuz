'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RunCard } from '@/components/dashboard/run-card';
import { LoadingScreen } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';

interface DashboardData {
  stats: {
    totalRuns: number;
    activeRuns: number;
    completedRuns: number;
    failedRuns: number;
    totalDeaths: number;
    totalEncounters: number;
    totalPlayTime: number;
    generatedRoms: number;
  };
  recentRuns: Array<{
    id: string;
    name: string;
    status: string;
    rulesPreset: string;
    currentBadges: number;
    deathCount: number;
    lastPlayedAt: string | null;
    createdAt: string;
    game: { title: string; platform: string; coverArt: string | null };
    generatedRom: { id: string; seed: string; fileName: string };
    _count: { pokemonEntries: number; encounters: number };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <LoadingScreen message="Loading dashboard..." />
      </AppShell>
    );
  }

  if (!session || !data) {
    return (
      <AppShell>
        <LoadingScreen message="Redirecting..." />
      </AppShell>
    );
  }

  const activeRuns = data.recentRuns.filter(r => r.status === 'ACTIVE');
  const otherRuns = data.recentRuns.filter(r => r.status !== 'ACTIVE');

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="nuz-section-title">
              Welcome back, <span className="nuz-gradient-text">{session.user?.name}</span>
            </h1>
            <p className="text-nuz-text-dim mt-1">Your Nuzlocke command center</p>
          </div>
          <Link href="/runs/new" className="nuz-btn-primary">
            + New Nuzlocke Run
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-10">
          <StatsOverview {...data.stats} />
        </div>

        {/* Active Runs */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display font-bold text-xl text-white">Active Runs</h2>
            <span className="nuz-badge-active">{activeRuns.length}</span>
          </div>

          {activeRuns.length === 0 ? (
            <EmptyState
              icon="🎮"
              title="No active runs"
              description="Start a new Nuzlocke run to begin your challenge!"
              actionLabel="Start New Run"
              actionHref="/runs/new"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRuns.map(run => (
                <RunCard
                  key={run.id}
                  id={run.id}
                  name={run.name}
                  status={run.status}
                  rulesPreset={run.rulesPreset}
                  currentBadges={run.currentBadges}
                  deathCount={run.deathCount}
                  lastPlayedAt={run.lastPlayedAt}
                  gameTitle={run.game.title}
                  platform={run.game.platform}
                  seed={run.generatedRom.seed}
                  pokemonCount={run._count.pokemonEntries}
                  encounterCount={run._count.encounters}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past Runs */}
        {otherRuns.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-xl text-white mb-6">Past Runs</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherRuns.map(run => (
                <RunCard
                  key={run.id}
                  id={run.id}
                  name={run.name}
                  status={run.status}
                  rulesPreset={run.rulesPreset}
                  currentBadges={run.currentBadges}
                  deathCount={run.deathCount}
                  lastPlayedAt={run.lastPlayedAt}
                  gameTitle={run.game.title}
                  platform={run.game.platform}
                  seed={run.generatedRom.seed}
                  pokemonCount={run._count.pokemonEntries}
                  encounterCount={run._count.encounters}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
