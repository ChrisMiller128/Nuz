'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';
import { StatCard } from '@/components/ui/stat-card';

interface AnalyticsData {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  completionRate: number;
  avgDeathsPerRun: number;
  totalDeaths: number;
  totalEncounters: number;
  totalPlayTimeHours: number;
  deathsByRoute: Array<{ routeName: string; deathCount: number; gameTitle: string }>;
  deathsByGame: Array<{ gameTitle: string; deaths: number }>;
  encountersByStatus: Array<{ status: string; count: number }>;
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/analytics').then(r => r.json()).then(setData).finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) return <AppShell><LoadingScreen message="Crunching numbers..." /></AppShell>;
  if (!data) return <AppShell><LoadingScreen /></AppShell>;

  const maxDeaths = Math.max(...(data.deathsByRoute.map(d => d.deathCount) || [1]));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="nuz-section-title mb-8">
          Analytics <span className="nuz-gradient-text">Dashboard</span>
        </h1>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Completion Rate" value={`${data.completionRate}%`} icon="📊" color="text-nuz-emerald" />
          <StatCard label="Avg Deaths/Run" value={data.avgDeathsPerRun} icon="☠" color="text-nuz-ruby" />
          <StatCard label="Total Encounters" value={data.totalEncounters} icon="🌿" color="text-nuz-emerald" />
          <StatCard label="Play Time" value={`${data.totalPlayTimeHours}h`} icon="⏱" color="text-nuz-sapphire" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Death Heatmap */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">☠ Death Heatmap by Route</h2>
            {data.deathsByRoute.length === 0 ? (
              <p className="text-nuz-text-dim text-center py-8">No death data yet</p>
            ) : (
              <div className="space-y-2">
                {data.deathsByRoute.slice(0, 15).map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-nuz-text-dim text-xs w-24 truncate" title={entry.routeName}>
                      {entry.routeName}
                    </span>
                    <div className="flex-1 h-6 bg-nuz-bg rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${(entry.deathCount / maxDeaths) * 100}%`,
                          backgroundColor: `hsl(${Math.max(0, 120 - (entry.deathCount / maxDeaths) * 120)}, 70%, 50%)`,
                        }}
                      />
                    </div>
                    <span className="font-display font-bold text-white w-8 text-right">{entry.deathCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deaths by Game */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">🎮 Deaths by Game</h2>
            {data.deathsByGame.length === 0 ? (
              <p className="text-nuz-text-dim text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data.deathsByGame.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-nuz-bg/30 rounded-lg">
                    <span className="text-white font-semibold">{entry.gameTitle}</span>
                    <span className="font-display font-bold text-nuz-ruby text-xl">{entry.deaths}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Encounter Breakdown */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">🌿 Encounter Results</h2>
            {data.encountersByStatus.length === 0 ? (
              <p className="text-nuz-text-dim text-center py-8">No encounters yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.encountersByStatus.map((entry, i) => {
                  const colors: Record<string, string> = {
                    CAUGHT: 'text-nuz-emerald', MISSED: 'text-nuz-gold',
                    FAILED: 'text-nuz-ruby', PENDING: 'text-nuz-sapphire', SKIPPED: 'text-nuz-text-dim',
                  };
                  return (
                    <div key={i} className="p-3 bg-nuz-bg/30 rounded-lg text-center">
                      <p className={`font-display font-extrabold text-2xl ${colors[entry.status] || ''}`}>{entry.count}</p>
                      <p className="font-pixel text-[8px] text-nuz-text-dim uppercase">{entry.status}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Run History */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">📈 Run Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-nuz-bg/30 rounded-xl">
                <p className="font-display font-extrabold text-3xl text-white">{data.totalRuns}</p>
                <p className="text-nuz-text-dim text-xs">Total</p>
              </div>
              <div className="text-center p-4 bg-nuz-emerald/10 rounded-xl">
                <p className="font-display font-extrabold text-3xl text-nuz-emerald">{data.completedRuns}</p>
                <p className="text-nuz-text-dim text-xs">Won</p>
              </div>
              <div className="text-center p-4 bg-nuz-ruby/10 rounded-xl">
                <p className="font-display font-extrabold text-3xl text-nuz-ruby">{data.failedRuns}</p>
                <p className="text-nuz-text-dim text-xs">Failed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
