'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { StatusBadge, PlatformBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading';
import { PokemonList } from '@/components/tracker/pokemon-list';
import { EncounterTracker } from '@/components/tracker/encounter-tracker';
import { BadgeTracker } from '@/components/tracker/badge-tracker';

interface SharedRunData {
  name: string;
  username: string;
  status: string;
  rulesPreset: string;
  gameTitle: string;
  platform: string;
  seed: string;
  currentBadges: number;
  deathCount: number;
  playTimeSeconds: number;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  pokemonEntries: Array<{
    id: string; nickname: string; species: string; level: number;
    status: string; location: string; metRoute: string | null;
    metLevel: number | null; nature: string | null; ability: string | null;
    causeOfDeath: string | null; notes: string | null;
  }>;
  encounters: Array<{
    id: string; routeName: string; pokemonName: string | null;
    pokemonLevel: number | null; status: string; isStatic: boolean;
    isGift: boolean; notes: string | null;
  }>;
  badgeProgress: Array<{
    id: string; badgeName: string; badgeNumber: number;
    gymLeader: string | null; levelCap: number | null;
    obtained: boolean; obtainedAt: string | null;
  }>;
  highlights: Array<{
    id: string; title: string | null; content: string;
    noteType: string; createdAt: string;
  }>;
}

export default function SharedRunPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [run, setRun] = useState<SharedRunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'team' | 'encounters' | 'badges' | 'journal'>('team');

  useEffect(() => {
    fetch(`/api/share/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Run not found');
        return res.json();
      })
      .then(setRun)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <AppShell><LoadingScreen message="Loading shared run..." /></AppShell>;

  if (error || !run) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Run Not Found</h2>
          <p className="text-nuz-text-dim">This run may be private or no longer available.</p>
        </div>
      </AppShell>
    );
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <AppShell>
      {/* Status Banner */}
      {run.status === 'COMPLETED' && (
        <div className="bg-nuz-gold/5 border-b border-nuz-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center">
            <span className="text-4xl block mb-2">🏆</span>
            <h2 className="font-display font-extrabold text-2xl text-nuz-gold">HALL OF FAME</h2>
          </div>
        </div>
      )}
      {run.status === 'FAILED' && (
        <div className="bg-nuz-ruby/5 border-b border-nuz-ruby/20">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center">
            <span className="text-4xl block mb-2">💀</span>
            <h2 className="font-display font-extrabold text-2xl text-nuz-ruby">RUN FAILED</h2>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="nuz-section-title mb-2">{run.name}</h1>
          <p className="text-nuz-text-dim">
            by <span className="text-nuz-primary font-semibold">{run.username}</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            <StatusBadge status={run.status} />
            <StatusBadge status={run.rulesPreset} size="xs" />
            <PlatformBadge platform={run.platform} />
            <span className="nuz-chip text-[10px]">
              <span className="text-nuz-text-dim">SEED:</span>
              <span className="text-nuz-primary font-mono">{run.seed.slice(0, 12)}</span>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="nuz-card-flat p-4 text-center">
            <p className="font-pixel text-[10px] text-nuz-text-dim">BADGES</p>
            <p className="font-display font-extrabold text-3xl text-nuz-gold">{run.currentBadges}</p>
          </div>
          <div className="nuz-card-flat p-4 text-center">
            <p className="font-pixel text-[10px] text-nuz-text-dim">DEATHS</p>
            <p className="font-display font-extrabold text-3xl text-nuz-ruby">{run.deathCount}</p>
          </div>
          <div className="nuz-card-flat p-4 text-center">
            <p className="font-pixel text-[10px] text-nuz-text-dim">TEAM</p>
            <p className="font-display font-extrabold text-3xl text-nuz-sapphire">
              {run.pokemonEntries.filter(p => p.location === 'PARTY').length}
            </p>
          </div>
          <div className="nuz-card-flat p-4 text-center">
            <p className="font-pixel text-[10px] text-nuz-text-dim">PLAY TIME</p>
            <p className="font-display font-extrabold text-3xl text-nuz-text">
              {formatTime(run.playTimeSeconds)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['team', 'encounters', 'badges', 'journal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg font-display font-semibold text-sm capitalize whitespace-nowrap transition-all ${
                tab === t ? 'bg-nuz-primary text-white shadow-nuz-glow' : 'bg-nuz-surface border border-nuz-border text-nuz-text-dim hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="nuz-card p-6">
          {tab === 'team' && <PokemonList pokemon={run.pokemonEntries} />}
          {tab === 'encounters' && <EncounterTracker encounters={run.encounters} />}
          {tab === 'badges' && <BadgeTracker badges={run.badgeProgress} />}
          {tab === 'journal' && (
            <div className="space-y-3">
              {run.highlights.length === 0 ? (
                <p className="text-center py-8 text-nuz-text-dim">No journal entries</p>
              ) : (
                run.highlights.map(note => (
                  <div key={note.id} className="p-4 bg-nuz-bg/30 rounded-lg border border-nuz-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={note.noteType} size="xs" />
                      <span className="text-nuz-text-dim text-xs">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    {note.title && <h4 className="font-display font-bold text-white mb-1">{note.title}</h4>}
                    <p className="text-nuz-text text-sm">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
