'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';

interface Encounter {
  id: string;
  routeName: string;
  pokemonName: string | null;
  pokemonLevel: number | null;
  status: string;
  isStatic: boolean;
  isGift: boolean;
  notes: string | null;
}

interface EncounterTrackerProps {
  encounters: Encounter[];
  onAddEncounter?: (data: { routeName: string; pokemonName: string; pokemonLevel: number; status: string }) => void;
  onUpdateEncounter?: (id: string, status: string) => void;
}

export function EncounterTracker({ encounters, onAddEncounter, onUpdateEncounter }: EncounterTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState('');
  const [newPokemon, setNewPokemon] = useState('');
  const [newLevel, setNewLevel] = useState('5');

  const caught = encounters.filter(e => e.status === 'CAUGHT').length;
  const missed = encounters.filter(e => e.status === 'MISSED' || e.status === 'FAILED').length;
  const pending = encounters.filter(e => e.status === 'PENDING').length;

  const handleAdd = () => {
    if (!newRoute || !newPokemon || !onAddEncounter) return;
    onAddEncounter({
      routeName: newRoute,
      pokemonName: newPokemon,
      pokemonLevel: parseInt(newLevel) || 5,
      status: 'CAUGHT',
    });
    setNewRoute('');
    setNewPokemon('');
    setNewLevel('5');
    setShowAddForm(false);
  };

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-nuz-bg/50 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-nuz-emerald font-display font-bold">{caught}</span>
          <span className="text-nuz-text-dim text-xs">caught</span>
        </div>
        <div className="w-px h-4 bg-nuz-border" />
        <div className="flex items-center gap-2">
          <span className="text-nuz-ruby font-display font-bold">{missed}</span>
          <span className="text-nuz-text-dim text-xs">missed</span>
        </div>
        <div className="w-px h-4 bg-nuz-border" />
        <div className="flex items-center gap-2">
          <span className="text-nuz-sapphire font-display font-bold">{pending}</span>
          <span className="text-nuz-text-dim text-xs">pending</span>
        </div>
        <div className="flex-1" />
        {onAddEncounter && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="nuz-btn-primary text-xs py-1.5 px-3"
          >
            + Add Encounter
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="nuz-card-flat p-4 mb-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Route / Area name"
              value={newRoute}
              onChange={e => setNewRoute(e.target.value)}
              className="nuz-input text-sm"
            />
            <input
              type="text"
              placeholder="Pokémon name"
              value={newPokemon}
              onChange={e => setNewPokemon(e.target.value)}
              className="nuz-input text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Level"
                value={newLevel}
                onChange={e => setNewLevel(e.target.value)}
                className="nuz-input text-sm w-20"
              />
              <button onClick={handleAdd} className="nuz-btn-primary text-sm flex-1">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encounter list */}
      <div className="space-y-2">
        {encounters.length === 0 ? (
          <div className="text-center py-8 text-nuz-text-dim">
            <span className="text-3xl block mb-2">🗺️</span>
            <p>No encounters recorded yet</p>
          </div>
        ) : (
          encounters.map(enc => (
            <div
              key={enc.id}
              className="flex items-center gap-3 p-3 bg-nuz-bg/30 rounded-lg border border-nuz-border/30 hover:border-nuz-border transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-nuz-surface flex items-center justify-center text-xs">
                {enc.isGift ? '🎁' : enc.isStatic ? '⭐' : '🌿'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{enc.routeName}</span>
                  {enc.pokemonName && (
                    <span className="text-nuz-text-dim text-xs">— {enc.pokemonName}</span>
                  )}
                  {enc.pokemonLevel && (
                    <span className="text-nuz-text-dim text-xs">Lv.{enc.pokemonLevel}</span>
                  )}
                </div>
                {enc.notes && <p className="text-nuz-text-dim text-xs mt-0.5">{enc.notes}</p>}
              </div>
              <StatusBadge status={enc.status} size="xs" />
              {onUpdateEncounter && enc.status === 'PENDING' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onUpdateEncounter(enc.id, 'CAUGHT')}
                    className="text-xs px-2 py-1 rounded bg-nuz-emerald/10 text-nuz-emerald hover:bg-nuz-emerald/20"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onUpdateEncounter(enc.id, 'MISSED')}
                    className="text-xs px-2 py-1 rounded bg-nuz-ruby/10 text-nuz-ruby hover:bg-nuz-ruby/20"
                  >
                    ✗
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
