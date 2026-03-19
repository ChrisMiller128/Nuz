'use client';

interface BadgeProgress {
  id: string;
  badgeName: string;
  badgeNumber: number;
  gymLeader: string | null;
  levelCap: number | null;
  obtained: boolean;
  obtainedAt: string | null;
}

interface BadgeTrackerProps {
  badges: BadgeProgress[];
  onToggleBadge?: (id: string, obtained: boolean) => void;
}

export function BadgeTracker({ badges, onToggleBadge }: BadgeTrackerProps) {
  const obtained = badges.filter(b => b.obtained).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-display font-bold text-white">Badges</h3>
        <span className="nuz-chip">
          <span className="text-nuz-gold">★</span>
          {obtained} / {badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {badges.map(badge => (
          <button
            key={badge.id}
            onClick={() => onToggleBadge?.(badge.id, !badge.obtained)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
              badge.obtained
                ? 'bg-nuz-gold/10 border-nuz-gold/30 shadow-[0_0_12px_rgba(255,215,0,0.2)]'
                : 'bg-nuz-bg/50 border-nuz-border/30 opacity-40 hover:opacity-70'
            }`}
            title={`${badge.badgeName}${badge.gymLeader ? ` — ${badge.gymLeader}` : ''}${badge.levelCap ? ` (Cap: Lv.${badge.levelCap})` : ''}`}
          >
            <span className="text-2xl">{badge.obtained ? '🏅' : '⬡'}</span>
            <span className="font-pixel text-[8px] text-nuz-text-dim truncate w-full text-center">
              {badge.badgeName}
            </span>
            {badge.levelCap && (
              <span className="font-pixel text-[8px] text-nuz-gold/60">
                Cap {badge.levelCap}
              </span>
            )}
          </button>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-6 text-nuz-text-dim text-sm">
          No badge data configured for this game
        </div>
      )}
    </div>
  );
}
