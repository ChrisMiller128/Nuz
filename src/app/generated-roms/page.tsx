'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PlatformBadge, StatusBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';

interface GeneratedRomEntry {
  id: string;
  fileName: string;
  fileSize: number;
  seed: string;
  checksum: string;
  status: string;
  generatorSettingsJson: Record<string, unknown>;
  createdAt: string;
  baseRom: {
    fileName: string;
    game: { title: string; platform: string; coverArt: string | null };
  };
  runs: Array<{ id: string; name: string; status: string }>;
}

export default function GeneratedRomsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [roms, setRoms] = useState<GeneratedRomEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/generated-roms')
        .then(res => res.json())
        .then(setRoms)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return <AppShell><LoadingScreen message="Loading your ROMs..." /></AppShell>;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="nuz-section-title">My Generated ROMs</h1>
            <p className="text-nuz-text-dim mt-1">All your generated Nuzlocke ROMs</p>
          </div>
          <Link href="/runs/new" className="nuz-btn-primary">
            + Generate New
          </Link>
        </div>

        {roms.length === 0 ? (
          <EmptyState
            icon="💿"
            title="No generated ROMs yet"
            description="Generate your first Nuzlocke ROM by starting a new run!"
            actionLabel="Start New Run"
            actionHref="/runs/new"
          />
        ) : (
          <div className="space-y-4">
            {roms.map(rom => (
              <div key={rom.id} className="nuz-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-nuz-bg flex items-center justify-center border border-nuz-border shrink-0">
                  <span className="text-2xl">💿</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-white truncate">{rom.fileName}</h3>
                    <PlatformBadge platform={rom.baseRom.game.platform} />
                  </div>
                  <p className="text-nuz-text-dim text-sm">{rom.baseRom.game.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="nuz-chip text-[10px]">
                      <span className="text-nuz-text-dim">SEED:</span>
                      <span className="text-nuz-primary font-mono">{rom.seed.slice(0, 12)}</span>
                    </span>
                    <span className="text-nuz-text-dim text-xs">{formatSize(rom.fileSize)}</span>
                    <span className="text-nuz-text-dim text-xs">
                      {new Date(rom.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rom.runs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rom.runs.map(run => (
                        <Link
                          key={run.id}
                          href={`/runs/${run.id}`}
                          className="text-xs text-nuz-sapphire hover:text-white transition-colors"
                        >
                          → {run.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={rom.status} size="xs" />
                  <a
                    href={`/api/generated-roms/${rom.id}/download`}
                    className="nuz-btn-secondary text-xs py-1.5 px-3"
                  >
                    ↓ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
