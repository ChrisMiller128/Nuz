'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';

interface AchievementData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
  isUnlocked: boolean;
}

interface AchievementsResponse {
  unlocked: Array<{ achievement: AchievementData; unlockedAt: string; sourceRunId: string | null }>;
  all: AchievementData[];
  totalPoints: number;
  unlockedCount: number;
  totalCount: number;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'border-gray-500/30 bg-gray-500/10',
  UNCOMMON: 'border-nuz-emerald/30 bg-nuz-emerald/10',
  RARE: 'border-nuz-sapphire/30 bg-nuz-sapphire/10',
  EPIC: 'border-nuz-gba-purple/30 bg-nuz-gba-purple/10',
  LEGENDARY: 'border-nuz-gold/30 bg-nuz-gold/10',
};

export default function AchievementsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/achievements').then(r => r.json()).then(setData).finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) return <AppShell><LoadingScreen message="Loading achievements..." /></AppShell>;
  if (!data) return <AppShell><LoadingScreen /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="nuz-section-title mb-2">Achievements</h1>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-display font-extrabold text-4xl nuz-gradient-text">{data.totalPoints}</p>
              <p className="text-nuz-text-dim text-sm">Total Points</p>
            </div>
            <div className="w-px h-12 bg-nuz-border" />
            <div className="text-center">
              <p className="font-display font-extrabold text-4xl text-white">{data.unlockedCount}<span className="text-nuz-text-dim text-lg">/{data.totalCount}</span></p>
              <p className="text-nuz-text-dim text-sm">Unlocked</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-nuz-bg rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-nuz-primary to-nuz-gold rounded-full transition-all"
            style={{ width: `${(data.unlockedCount / Math.max(1, data.totalCount)) * 100}%` }}
          />
        </div>

        {/* Achievement Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.all.map(ach => (
            <div
              key={ach.key}
              className={`nuz-card-flat p-5 border transition-all ${
                ach.isUnlocked
                  ? RARITY_COLORS[ach.rarity] || ''
                  : 'opacity-40 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{ach.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-white">{ach.name}</h3>
                    <span className="font-pixel text-[8px] text-nuz-gold">{ach.points}pts</span>
                  </div>
                  <p className="text-nuz-text-dim text-sm mt-1">{ach.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-pixel text-[8px] uppercase text-nuz-text-dim">{ach.rarity}</span>
                    <span className="font-pixel text-[8px] uppercase text-nuz-text-dim">· {ach.category}</span>
                  </div>
                  {ach.isUnlocked && (
                    <p className="font-pixel text-[8px] text-nuz-emerald mt-2">✓ UNLOCKED</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
