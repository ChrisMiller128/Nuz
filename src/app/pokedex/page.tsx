'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';

// Type data inline for client component
const TYPE_COLORS: Record<string, string> = {
  Fire: 'bg-red-500/20 text-red-400 border-red-500/30',
  Water: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Grass: 'bg-green-500/20 text-green-400 border-green-500/30',
  Electric: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Psychic: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Fighting: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Flying: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  Poison: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Ground: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Rock: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  Bug: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  Ghost: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Dragon: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Dark: 'bg-gray-700/40 text-gray-300 border-gray-600/30',
  Steel: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Ice: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Fairy: 'bg-pink-400/20 text-pink-300 border-pink-400/30',
  Normal: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const TYPE_CHART: Record<string, { weakTo: string[]; resistsFrom: string[]; immuneTo: string[] }> = {
  Normal: { weakTo: ['Fighting'], resistsFrom: [], immuneTo: ['Ghost'] },
  Fire: { weakTo: ['Water', 'Ground', 'Rock'], resistsFrom: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immuneTo: [] },
  Water: { weakTo: ['Electric', 'Grass'], resistsFrom: ['Fire', 'Water', 'Ice', 'Steel'], immuneTo: [] },
  Electric: { weakTo: ['Ground'], resistsFrom: ['Electric', 'Flying', 'Steel'], immuneTo: [] },
  Grass: { weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resistsFrom: ['Water', 'Electric', 'Grass', 'Ground'], immuneTo: [] },
  Ice: { weakTo: ['Fire', 'Fighting', 'Rock', 'Steel'], resistsFrom: ['Ice'], immuneTo: [] },
  Fighting: { weakTo: ['Flying', 'Psychic', 'Fairy'], resistsFrom: ['Bug', 'Rock', 'Dark'], immuneTo: [] },
  Poison: { weakTo: ['Ground', 'Psychic'], resistsFrom: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immuneTo: [] },
  Ground: { weakTo: ['Water', 'Grass', 'Ice'], resistsFrom: ['Poison', 'Rock'], immuneTo: ['Electric'] },
  Flying: { weakTo: ['Electric', 'Ice', 'Rock'], resistsFrom: ['Grass', 'Fighting', 'Bug'], immuneTo: ['Ground'] },
  Psychic: { weakTo: ['Bug', 'Ghost', 'Dark'], resistsFrom: ['Fighting', 'Psychic'], immuneTo: [] },
  Bug: { weakTo: ['Fire', 'Flying', 'Rock'], resistsFrom: ['Grass', 'Fighting', 'Ground'], immuneTo: [] },
  Rock: { weakTo: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resistsFrom: ['Normal', 'Fire', 'Poison', 'Flying'], immuneTo: [] },
  Ghost: { weakTo: ['Ghost', 'Dark'], resistsFrom: ['Poison', 'Bug'], immuneTo: ['Normal', 'Fighting'] },
  Dragon: { weakTo: ['Ice', 'Dragon', 'Fairy'], resistsFrom: ['Fire', 'Water', 'Electric', 'Grass'], immuneTo: [] },
  Dark: { weakTo: ['Fighting', 'Bug', 'Fairy'], resistsFrom: ['Ghost', 'Dark'], immuneTo: ['Psychic'] },
  Steel: { weakTo: ['Fire', 'Fighting', 'Ground'], resistsFrom: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immuneTo: ['Poison'] },
  Fairy: { weakTo: ['Poison', 'Steel'], resistsFrom: ['Fighting', 'Bug', 'Dark'], immuneTo: ['Dragon'] },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

export default function PokedexPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const typeData = selectedType ? TYPE_CHART[selectedType] : null;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="nuz-section-title mb-2">
            Pokédex <span className="nuz-gradient-text">Reference</span>
          </h1>
          <p className="text-nuz-text-dim">Type chart and encounter reference for your Nuzlocke runs</p>
        </div>

        {/* Type Grid */}
        <div className="nuz-card p-6 mb-8">
          <h2 className="font-display font-bold text-lg text-white mb-4">Type Chart</h2>
          <p className="text-nuz-text-dim text-sm mb-4">Select a type to see its matchups</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  selectedType === type
                    ? `${TYPE_COLORS[type]} shadow-lg scale-105`
                    : `${TYPE_COLORS[type]} opacity-60 hover:opacity-100`
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {typeData && selectedType && (
            <div className="animate-slide-up grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-nuz-ruby/10 rounded-xl border border-nuz-ruby/20">
                <h4 className="font-display font-bold text-nuz-ruby text-sm mb-2">⚠ Weak To</h4>
                <div className="flex flex-wrap gap-1.5">
                  {typeData.weakTo.map(t => (
                    <span key={t} className={`text-xs px-2 py-1 rounded border ${TYPE_COLORS[t]}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-nuz-emerald/10 rounded-xl border border-nuz-emerald/20">
                <h4 className="font-display font-bold text-nuz-emerald text-sm mb-2">🛡 Resists</h4>
                <div className="flex flex-wrap gap-1.5">
                  {typeData.resistsFrom.map(t => (
                    <span key={t} className={`text-xs px-2 py-1 rounded border ${TYPE_COLORS[t]}`}>{t}</span>
                  ))}
                  {typeData.resistsFrom.length === 0 && <span className="text-nuz-text-dim text-xs">None</span>}
                </div>
              </div>
              <div className="p-4 bg-nuz-gold/10 rounded-xl border border-nuz-gold/20">
                <h4 className="font-display font-bold text-nuz-gold text-sm mb-2">✦ Immune To</h4>
                <div className="flex flex-wrap gap-1.5">
                  {typeData.immuneTo.map(t => (
                    <span key={t} className={`text-xs px-2 py-1 rounded border ${TYPE_COLORS[t]}`}>{t}</span>
                  ))}
                  {typeData.immuneTo.length === 0 && <span className="text-nuz-text-dim text-xs">None</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Reference */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">🎮 Nuzlocke Rules Quick Ref</h2>
            <ul className="space-y-2 text-sm text-nuz-text-dim">
              <li>⚰️ Fainted = dead. Must be boxed or released.</li>
              <li>🎯 Only catch the first encounter per area.</li>
              <li>✨ Nickname every Pokémon.</li>
              <li>🔄 Duplicate Clause: skip duplicates.</li>
              <li>💎 Shiny Clause: shinies are always catchable.</li>
              <li>🏅 Level Cap: don&apos;t exceed next gym leader&apos;s ace.</li>
            </ul>
          </div>
          <div className="nuz-card p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">💡 Tips</h2>
            <ul className="space-y-2 text-sm text-nuz-text-dim">
              <li>📊 Check type matchups before gym battles.</li>
              <li>🔀 Pivot your team based on upcoming encounters.</li>
              <li>📝 Keep notes on every route for future runs.</li>
              <li>⚔ Always have a backup plan for your team.</li>
              <li>🎲 Randomized runs change everything — adapt!</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
