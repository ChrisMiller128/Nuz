'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';

interface GameOption {
  id: string;
  title: string;
  slug: string;
  platform: string;
  generation: number;
  baseRoms: Array<{ id: string; fileName: string; version: string }>;
}

export default function NewRunPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedGameId = searchParams.get('gameId');

  const [games, setGames] = useState<GameOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(preSelectedGameId || '');
  const [baseRomId, setBaseRomId] = useState('');
  const [rulesPreset, setRulesPreset] = useState('CLASSIC');
  const [seed, setSeed] = useState('');
  const [duplicateClause, setDuplicateClause] = useState(true);
  const [shinyClause, setShinyClause] = useState(false);
  const [staticEncounters, setStaticEncounters] = useState(true);
  const [giftPokemon, setGiftPokemon] = useState('ALLOWED');

  // Generator settings
  const [randomizeStarters, setRandomizeStarters] = useState(false);
  const [randomizeWild, setRandomizeWild] = useState(false);
  const [randomizeTrainers, setRandomizeTrainers] = useState(false);
  const [levelScaling, setLevelScaling] = useState('1.0');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetch('/api/library')
      .then(res => res.json())
      .then((data: GameOption[]) => {
        setGames(data);
        if (preSelectedGameId) {
          setGameId(preSelectedGameId);
          const game = data.find((g: GameOption) => g.id === preSelectedGameId);
          if (game?.baseRoms[0]) {
            setBaseRomId(game.baseRoms[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, router, preSelectedGameId]);

  const selectedGame = games.find(g => g.id === gameId);

  useEffect(() => {
    if (selectedGame?.baseRoms[0] && !baseRomId) {
      setBaseRomId(selectedGame.baseRoms[0].id);
    }
  }, [selectedGame, baseRomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gameId || !baseRomId) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gameId,
          baseRomId,
          rulesPreset,
          seed: seed || undefined,
          duplicateClause,
          shinyClause,
          staticEncounters,
          giftPokemon,
          generatorSettings: {
            randomizeStarters,
            randomizeWildPokemon: randomizeWild,
            randomizeTrainers,
            levelScaling: parseFloat(levelScaling) || 1.0,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create run');
        return;
      }

      router.push(`/runs/${data.id}`);
    } catch {
      setError('Failed to create run');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <LoadingScreen message="Loading..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="nuz-section-title">New Nuzlocke Run</h1>
          <p className="text-nuz-text-dim mt-1">Configure your challenge and generate your ROM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-nuz-ruby/10 border border-nuz-ruby/30 text-nuz-ruby text-sm">
              {error}
            </div>
          )}

          {/* Run Name */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">Run Details</h2>
            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Run Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="nuz-input"
                placeholder="My Epic Nuzlocke #1"
                required
                maxLength={100}
              />
            </div>
          </div>

          {/* Game Selection */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">Game Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-nuz-text-dim mb-2">Game *</label>
                <select
                  value={gameId}
                  onChange={e => {
                    setGameId(e.target.value);
                    setBaseRomId('');
                  }}
                  className="nuz-select"
                  required
                >
                  <option value="">Select a game...</option>
                  {games.map(g => (
                    <option key={g.id} value={g.id}>
                      [{g.platform}] {g.title} (Gen {g.generation})
                    </option>
                  ))}
                </select>
              </div>

              {selectedGame && selectedGame.baseRoms.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-nuz-text-dim mb-2">ROM Version</label>
                  <select
                    value={baseRomId}
                    onChange={e => setBaseRomId(e.target.value)}
                    className="nuz-select"
                    required
                  >
                    {selectedGame.baseRoms.map(rom => (
                      <option key={rom.id} value={rom.id}>
                        {rom.fileName} (v{rom.version})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Rules Preset */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">Nuzlocke Rules</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-nuz-text-dim mb-2">Rules Preset</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'CLASSIC', label: 'Classic', icon: '🏆', desc: 'Standard Nuzlocke rules' },
                    { value: 'HARDCORE', label: 'Hardcore', icon: '💀', desc: 'No items in battle, level caps' },
                    { value: 'CUSTOM', label: 'Custom', icon: '⚙', desc: 'Define your own rules' },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setRulesPreset(preset.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        rulesPreset === preset.value
                          ? 'border-nuz-primary bg-nuz-primary/10 shadow-nuz-glow'
                          : 'border-nuz-border hover:border-nuz-primary/30'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{preset.icon}</span>
                      <span className="font-display font-bold text-white text-sm block">{preset.label}</span>
                      <span className="text-nuz-text-dim text-xs">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clause toggles */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Duplicate Clause', value: duplicateClause, setter: setDuplicateClause },
                  { label: 'Shiny Clause', value: shinyClause, setter: setShinyClause },
                  { label: 'Static Encounters', value: staticEncounters, setter: setStaticEncounters },
                ].map(clause => (
                  <label key={clause.label} className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        clause.value
                          ? 'bg-nuz-primary border-nuz-primary'
                          : 'border-nuz-border'
                      }`}
                      onClick={() => clause.setter(!clause.value)}
                    >
                      {clause.value && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-nuz-text">{clause.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-nuz-text-dim mb-2">Gift Pokémon</label>
                <select
                  value={giftPokemon}
                  onChange={e => setGiftPokemon(e.target.value)}
                  className="nuz-select"
                >
                  <option value="ALLOWED">Allowed</option>
                  <option value="FIRST_ONLY">First Only</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generator Settings */}
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">ROM Generator Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-nuz-text-dim mb-2">
                  Seed <span className="text-nuz-text-dim">(optional — leave blank for random)</span>
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  className="nuz-input font-mono"
                  placeholder="e.g. a1b2c3d4e5f6"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Randomize Starters', value: randomizeStarters, setter: setRandomizeStarters },
                  { label: 'Randomize Wild Pokémon', value: randomizeWild, setter: setRandomizeWild },
                  { label: 'Randomize Trainers', value: randomizeTrainers, setter: setRandomizeTrainers },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        opt.value
                          ? 'bg-nuz-gba-purple border-nuz-gba-purple'
                          : 'border-nuz-border'
                      }`}
                      onClick={() => opt.setter(!opt.value)}
                    >
                      {opt.value && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-nuz-text">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-nuz-text-dim mb-2">
                  Level Scaling: <span className="text-nuz-primary">{levelScaling}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={levelScaling}
                  onChange={e => setLevelScaling(e.target.value)}
                  className="w-full accent-nuz-primary"
                />
                <div className="flex justify-between text-xs text-nuz-text-dim mt-1">
                  <span>Easier (0.5x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Harder (2.0x)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || !name || !gameId || !baseRomId}
              className="nuz-btn-primary flex-1 py-4 text-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating ROM & Creating Run...
                </span>
              ) : (
                '⚡ Generate ROM & Start Run'
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
