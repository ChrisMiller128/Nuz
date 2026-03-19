'use client';

import { StatCard } from '@/components/ui/stat-card';

interface StatsOverviewProps {
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalDeaths: number;
  totalEncounters: number;
  totalPlayTime: number;
  generatedRoms: number;
}

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function StatsOverview(stats: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Runs" value={stats.activeRuns} icon="▶" color="text-nuz-emerald" />
      <StatCard label="Completed" value={stats.completedRuns} icon="★" color="text-nuz-gold" />
      <StatCard label="Total Deaths" value={stats.totalDeaths} icon="☠" color="text-nuz-ruby" />
      <StatCard
        label="Play Time"
        value={formatPlayTime(stats.totalPlayTime)}
        icon="⏱"
        color="text-nuz-sapphire"
        subtext={`${stats.totalEncounters} encounters`}
      />
    </div>
  );
}
