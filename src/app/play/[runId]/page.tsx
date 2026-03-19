'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { EmulatorWrapper } from '@/components/emulator/emulator-wrapper';
import { LoadingScreen } from '@/components/ui/loading';
import { PlatformBadge } from '@/components/ui/status-badge';
import type { EmulatorPlatform } from '@/lib/emulator';

interface EmulatorSession {
  runId: string;
  runName: string;
  platform: EmulatorPlatform;
  gameTitle: string;
  romUrl: string | null;
  saveStateUrl: string | null;
  romReady: boolean;
  generatedRomId: string;
  seed: string;
}

export default function PlayPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const runId = params.runId as string;

  const [session, setSession] = useState<EmulatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch(`/api/emulator/session?runId=${runId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load emulator session');
          return res.json();
        })
        .then(setSession)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [status, router, runId]);

  const handleSaveState = useCallback(async (data: ArrayBuffer) => {
    const formData = new FormData();
    formData.append('runId', runId);
    formData.append('slotNumber', '0');
    formData.append('isAutosave', 'true');
    formData.append('saveFile', new Blob([data], { type: 'application/octet-stream' }), 'autosave.sav');

    try {
      await fetch('/api/saves', { method: 'POST', body: formData });
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  }, [runId]);

  if (loading) {
    return <AppShell><LoadingScreen message="Preparing emulator..." /></AppShell>;
  }

  if (error || !session) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="text-6xl block mb-4">⚠️</span>
          <h2 className="font-display font-bold text-2xl text-nuz-ruby mb-2">
            {error || 'Session Error'}
          </h2>
          <p className="text-nuz-text-dim mb-6">Could not initialize the emulator session.</p>
          <Link href={`/runs/${runId}`} className="nuz-btn-primary">Back to Run</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/runs/${runId}`} className="nuz-btn-ghost text-sm">
              ← Back
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-white">{session.runName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-nuz-text-dim text-sm">{session.gameTitle}</span>
                <PlatformBadge platform={session.platform} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="nuz-chip text-[10px]">
              <span className="text-nuz-text-dim">SEED:</span>
              <span className="text-nuz-primary font-mono">{session.seed.slice(0, 8)}</span>
            </span>
          </div>
        </div>

        {/* Emulator */}
        {session.romReady && session.romUrl ? (
          <EmulatorWrapper
            romUrl={session.romUrl}
            saveStateUrl={session.saveStateUrl || undefined}
            platform={session.platform}
            runId={runId}
            onSaveState={handleSaveState}
            autoSaveInterval={60}
          />
        ) : (
          <div className="nuz-console-frame flex flex-col items-center justify-center h-96">
            <span className="text-6xl mb-4">📁</span>
            <h3 className="font-display font-bold text-xl text-white mb-2">ROM Not Ready</h3>
            <p className="text-nuz-text-dim text-sm text-center max-w-md mb-4">
              The generated ROM file is not available on the server yet.
              This could happen if the ROM hasn&apos;t been generated or the storage is unavailable.
            </p>
            <Link href={`/runs/${runId}`} className="nuz-btn-secondary">
              View Run Details
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/runs/${runId}`} className="nuz-btn-secondary text-sm">
            📊 Tracker
          </Link>
          <button
            onClick={async () => {
              await handleSaveState(new ArrayBuffer(0));
            }}
            className="nuz-btn-secondary text-sm"
          >
            💾 Manual Save
          </button>
        </div>
      </div>
    </AppShell>
  );
}
