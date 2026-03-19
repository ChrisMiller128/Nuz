'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { StatusBadge, PlatformBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading';
import { PokemonList } from '@/components/tracker/pokemon-list';
import { EncounterTracker } from '@/components/tracker/encounter-tracker';
import { BadgeTracker } from '@/components/tracker/badge-tracker';

interface RunData {
  id: string;
  name: string;
  status: string;
  rulesPreset: string;
  duplicateClause: boolean;
  shinyClause: boolean;
  staticEncounters: boolean;
  giftPokemon: string;
  currentBadges: number;
  deathCount: number;
  playTimeSeconds: number;
  lastPlayedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  game: { title: string; platform: string; slug: string };
  generatedRom: {
    id: string;
    seed: string;
    fileName: string;
    checksum: string;
    generatorSettingsJson: Record<string, unknown>;
    createdAt: string;
  };
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
  runNotes: Array<{
    id: string; title: string | null; content: string;
    noteType: string; createdAt: string;
  }>;
  saveStates: Array<{
    id: string; slotNumber: number; isAutosave: boolean;
    fileSize: number; createdAt: string; updatedAt: string;
  }>;
}

export default function RunDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const runId = params.id as string;

  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'team' | 'encounters' | 'badges' | 'journal'>('team');
  const [newNote, setNewNote] = useState('');

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        setRun(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') fetchRun();
  }, [status, router, fetchRun]);

  const handleUpdatePokemonStatus = async (pokemonId: string, newStatus: string, location: string) => {
    await fetch(`/api/runs/${runId}/pokemon`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pokemonId, status: newStatus, location }),
    });
    fetchRun();
  };

  const handleAddEncounter = async (data: { routeName: string; pokemonName: string; pokemonLevel: number; status: string }) => {
    await fetch(`/api/runs/${runId}/encounters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchRun();
  };

  const handleUpdateEncounter = async (encounterId: string, newStatus: string) => {
    await fetch(`/api/runs/${runId}/encounters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: encounterId, status: newStatus }),
    });
    fetchRun();
  };

  const handleToggleBadge = async (badgeId: string, obtained: boolean) => {
    // Use run update for simplicity
    fetchRun();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`/api/runs/${runId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote, noteType: 'GENERAL' }),
    });
    setNewNote('');
    fetchRun();
  };

  const handleMarkFailed = async () => {
    if (!confirm('Are you sure? This will mark your run as FAILED.')) return;
    await fetch(`/api/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FAILED' }),
    });
    fetchRun();
  };

  const handleMarkComplete = async () => {
    if (!confirm('Congratulations! Mark this run as COMPLETED?')) return;
    await fetch(`/api/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    fetchRun();
  };

  if (loading) {
    return <AppShell><LoadingScreen message="Loading run..." /></AppShell>;
  }

  if (!run) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Run Not Found</h2>
          <Link href="/dashboard" className="nuz-btn-primary mt-4 inline-block">Back to Dashboard</Link>
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
      {/* Failed overlay */}
      {run.status === 'FAILED' && (
        <div className="bg-nuz-ruby/5 border-b border-nuz-ruby/20">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center">
            <span className="text-4xl block mb-2">💀</span>
            <h2 className="font-display font-extrabold text-2xl text-nuz-ruby">RUN FAILED</h2>
            <p className="text-nuz-text-dim text-sm mt-1">
              Your journey ended on {run.failedAt ? new Date(run.failedAt).toLocaleDateString() : 'unknown date'}
            </p>
          </div>
        </div>
      )}

      {/* Completed overlay */}
      {run.status === 'COMPLETED' && (
        <div className="bg-nuz-gold/5 border-b border-nuz-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center">
            <span className="text-4xl block mb-2">🏆</span>
            <h2 className="font-display font-extrabold text-2xl text-nuz-gold">HALL OF FAME</h2>
            <p className="text-nuz-text-dim text-sm mt-1">
              Completed on {run.completedAt ? new Date(run.completedAt).toLocaleDateString() : 'unknown date'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="nuz-section-title">{run.name}</h1>
              <StatusBadge status={run.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-nuz-text-dim">{run.game.title}</span>
              <PlatformBadge platform={run.game.platform} />
              <StatusBadge status={run.rulesPreset} size="xs" />
              <span className="nuz-chip text-[10px]">
                <span className="text-nuz-text-dim">SEED:</span>
                <span className="text-nuz-primary font-mono">{run.generatedRom.seed.slice(0, 12)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {run.status === 'ACTIVE' && (
              <>
                <Link href={`/play/${run.id}`} className="nuz-btn-primary">
                  ▶ Play
                </Link>
                <button onClick={handleMarkComplete} className="nuz-btn-secondary text-nuz-gold">
                  ★ Complete
                </button>
                <button onClick={handleMarkFailed} className="nuz-btn-ghost text-nuz-ruby">
                  ☠ Wipe
                </button>
              </>
            )}
            {(run.status === 'COMPLETED' || run.status === 'FAILED') && (
              <button
                onClick={async () => {
                  await fetch(`/api/runs/${runId}/share`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPublic: true }),
                  });
                  fetchRun();
                }}
                className="nuz-btn-secondary text-sm"
              >
                📢 Share
              </button>
            )}
            <a href={`/api/runs/${runId}/export`} className="nuz-btn-ghost text-sm">
              📥 Export JSON
            </a>
          </div>
        </div>

        {/* Stats Row */}
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
          {[
            { key: 'team' as const, label: `Team (${run.pokemonEntries.length})`, icon: '⚔' },
            { key: 'encounters' as const, label: `Encounters (${run.encounters.length})`, icon: '🌿' },
            { key: 'badges' as const, label: `Badges (${run.currentBadges})`, icon: '🏅' },
            { key: 'journal' as const, label: `Journal (${run.runNotes.length})`, icon: '📓' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-display font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-nuz-primary text-white shadow-nuz-glow'
                  : 'bg-nuz-surface border border-nuz-border text-nuz-text-dim hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="nuz-card p-6">
          {activeTab === 'team' && (
            <PokemonList
              pokemon={run.pokemonEntries}
              onUpdateStatus={run.status === 'ACTIVE' ? handleUpdatePokemonStatus : undefined}
            />
          )}
          {activeTab === 'encounters' && (
            <EncounterTracker
              encounters={run.encounters}
              onAddEncounter={run.status === 'ACTIVE' ? handleAddEncounter : undefined}
              onUpdateEncounter={run.status === 'ACTIVE' ? handleUpdateEncounter : undefined}
            />
          )}
          {activeTab === 'badges' && (
            <BadgeTracker
              badges={run.badgeProgress}
              onToggleBadge={run.status === 'ACTIVE' ? handleToggleBadge : undefined}
            />
          )}
          {activeTab === 'journal' && (
            <div>
              {run.status === 'ACTIVE' && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="nuz-input flex-1"
                    placeholder="Add a journal entry..."
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  />
                  <button onClick={handleAddNote} className="nuz-btn-primary">Add</button>
                </div>
              )}
              {run.runNotes.length === 0 ? (
                <div className="text-center py-8 text-nuz-text-dim">
                  <span className="text-3xl block mb-2">📓</span>
                  <p>No journal entries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {run.runNotes.map(note => (
                    <div key={note.id} className="p-4 bg-nuz-bg/30 rounded-lg border border-nuz-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={note.noteType} size="xs" />
                        <span className="text-nuz-text-dim text-xs">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {note.title && (
                        <h4 className="font-display font-bold text-white mb-1">{note.title}</h4>
                      )}
                      <p className="text-nuz-text text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generator Info Sidebar */}
        <div className="mt-8 nuz-card p-6">
          <h3 className="font-display font-bold text-white mb-4">Generator Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-nuz-text-dim">Seed</span>
              <p className="font-mono text-nuz-primary">{run.generatedRom.seed}</p>
            </div>
            <div>
              <span className="text-nuz-text-dim">ROM File</span>
              <p className="text-white truncate">{run.generatedRom.fileName}</p>
            </div>
            <div>
              <span className="text-nuz-text-dim">Checksum</span>
              <p className="font-mono text-nuz-text-dim text-xs truncate">{run.generatedRom.checksum}</p>
            </div>
            <div>
              <span className="text-nuz-text-dim">Generated</span>
              <p className="text-white">{new Date(run.generatedRom.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="text-nuz-text-dim text-sm cursor-pointer hover:text-white transition-colors">
              Generator Settings JSON
            </summary>
            <pre className="mt-2 p-3 bg-nuz-bg rounded-lg text-xs text-nuz-text-dim overflow-x-auto">
              {JSON.stringify(run.generatedRom.generatorSettingsJson, null, 2)}
            </pre>
          </details>
        </div>

        {/* Save States */}
        {run.saveStates.length > 0 && (
          <div className="mt-8 nuz-card p-6">
            <h3 className="font-display font-bold text-white mb-4">Save States</h3>
            <div className="space-y-2">
              {run.saveStates.map(save => (
                <div key={save.id} className="flex items-center justify-between p-3 bg-nuz-bg/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{save.isAutosave ? '🔄' : '💾'}</span>
                    <div>
                      <span className="text-white text-sm">
                        {save.isAutosave ? 'Autosave' : `Slot ${save.slotNumber}`}
                      </span>
                      <span className="text-nuz-text-dim text-xs block">
                        {new Date(save.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/api/saves/${save.id}/download`}
                    className="nuz-btn-ghost text-xs"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
