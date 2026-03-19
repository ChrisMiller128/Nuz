'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';

interface TeamSlot {
  species: string;
  dexNo?: number;
  nickname?: string;
  role?: string;
  notes?: string;
  types?: string[];
}

interface TeamPlan {
  id: string;
  name: string;
  gameSlug: string | null;
  notes: string | null;
  slots: TeamSlot[];
  createdAt: string;
  updatedAt: string;
}

export default function TeamBuilderPage() {
  const { status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<TeamPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/team-plans').then(r => r.json()).then(setPlans).finally(() => setLoading(false));
    }
  }, [status, router]);

  const handleCreate = async () => {
    if (!newName) return;
    const res = await fetch('/api/team-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        slots: Array(6).fill({ species: '', nickname: '', role: '', notes: '' }),
      }),
    });
    if (res.ok) {
      const plan = await res.json();
      setPlans([plan, ...plans]);
      setNewName('');
      setShowCreate(false);
    }
  };

  if (loading) return <AppShell><LoadingScreen /></AppShell>;

  const TYPE_COLORS: Record<string, string> = {
    Fire: 'bg-red-500/20 text-red-400', Water: 'bg-blue-500/20 text-blue-400',
    Grass: 'bg-green-500/20 text-green-400', Electric: 'bg-yellow-500/20 text-yellow-400',
    Psychic: 'bg-pink-500/20 text-pink-400', Fighting: 'bg-orange-500/20 text-orange-400',
    Flying: 'bg-sky-500/20 text-sky-400', Poison: 'bg-purple-500/20 text-purple-400',
    Ground: 'bg-amber-500/20 text-amber-400', Rock: 'bg-stone-500/20 text-stone-400',
    Bug: 'bg-lime-500/20 text-lime-400', Ghost: 'bg-violet-500/20 text-violet-400',
    Dragon: 'bg-indigo-500/20 text-indigo-400', Dark: 'bg-gray-700/40 text-gray-300',
    Steel: 'bg-slate-500/20 text-slate-400', Ice: 'bg-cyan-500/20 text-cyan-400',
    Fairy: 'bg-pink-400/20 text-pink-300', Normal: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="nuz-section-title">Team Builder</h1>
            <p className="text-nuz-text-dim mt-1">Plan your dream Nuzlocke teams</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="nuz-btn-primary">
            + New Plan
          </button>
        </div>

        {showCreate && (
          <div className="nuz-card p-6 mb-6 animate-slide-up">
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="nuz-input flex-1"
                placeholder="Team plan name..."
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} className="nuz-btn-primary">Create</button>
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No team plans yet"
            description="Create a team plan to strategize your Nuzlocke runs!"
            actionLabel="Create Plan"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="grid gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="nuz-card p-6">
                <h3 className="font-display font-bold text-lg text-white mb-3">{plan.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(plan.slots || []).map((slot, i) => (
                    <div key={i} className="p-3 bg-nuz-bg/50 rounded-xl border border-nuz-border/30 text-center">
                      <span className="text-2xl block mb-1">{slot.species ? '⚔' : '➕'}</span>
                      <p className="font-display font-semibold text-white text-sm truncate">
                        {slot.species || 'Empty'}
                      </p>
                      {slot.nickname && (
                        <p className="text-nuz-text-dim text-xs">&quot;{slot.nickname}&quot;</p>
                      )}
                      {slot.types && slot.types.length > 0 && (
                        <div className="flex gap-1 mt-1 justify-center flex-wrap">
                          {slot.types.map(t => (
                            <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded ${TYPE_COLORS[t] || ''}`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {slot.role && (
                        <p className="text-nuz-text-dim text-[10px] mt-1">{slot.role}</p>
                      )}
                    </div>
                  ))}
                </div>
                {plan.notes && (
                  <p className="text-nuz-text-dim text-sm mt-3">{plan.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
