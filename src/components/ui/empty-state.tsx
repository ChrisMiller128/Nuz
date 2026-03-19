import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '🎮', title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-6 animate-float">{icon}</div>
      <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
      <p className="text-nuz-text-dim max-w-md mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="nuz-btn-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="nuz-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
