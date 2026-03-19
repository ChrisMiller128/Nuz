'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={`${sizes[size]} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none" className="text-nuz-primary">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-nuz-border animate-spin border-t-nuz-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-nuz-primary/20 animate-pulse" />
        </div>
      </div>
      <p className="font-pixel text-xs text-nuz-text-dim animate-pixel-blink">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="nuz-card-flat p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-nuz-border/30" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-nuz-border/30 rounded w-3/4" />
          <div className="h-3 bg-nuz-border/30 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-nuz-border/30 rounded w-full" />
        <div className="h-3 bg-nuz-border/30 rounded w-5/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-nuz-border/30 rounded-full w-16" />
        <div className="h-6 bg-nuz-border/30 rounded-full w-20" />
      </div>
    </div>
  );
}
