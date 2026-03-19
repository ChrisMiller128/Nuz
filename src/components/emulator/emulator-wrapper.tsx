'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { EmulatorPlatform } from '@/lib/emulator';
import { getCoreForPlatform } from '@/lib/emulator';

interface EmulatorWrapperProps {
  romUrl: string;
  saveStateUrl?: string;
  platform: EmulatorPlatform;
  runId: string;
  onSaveState?: (data: ArrayBuffer) => Promise<void>;
  autoSaveInterval?: number;
}

export function EmulatorWrapper({
  romUrl,
  saveStateUrl,
  platform,
  runId,
  onSaveState,
  autoSaveInterval = 60,
}: EmulatorWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initEmulator = useCallback(() => {
    if (!containerRef.current) return;

    try {
      const core = getCoreForPlatform(platform);

      const w = window as Record<string, unknown>;
      w.EJS_player = '#emulator-game';
      w.EJS_core = core;
      w.EJS_gameUrl = romUrl;
      w.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
      w.EJS_startOnLoaded = true;
      w.EJS_color = '#e94560';
      w.EJS_backgroundColor = '#0f0f1a';

      if (saveStateUrl) {
        w.EJS_loadStateURL = saveStateUrl;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      script.onerror = () => setError('Failed to load emulator engine');
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (err) {
      setError(`Failed to initialize emulator: ${err}`);
    }
  }, [romUrl, saveStateUrl, platform]);

  useEffect(() => {
    const cleanup = initEmulator();
    return cleanup;
  }, [initEmulator]);

  useEffect(() => {
    if (!loaded || !onSaveState || autoSaveInterval <= 0) return;

    const interval = setInterval(async () => {
      try {
        const w = window as Record<string, unknown>;
        const ejs = w.EJS_emulator as { getState?: () => ArrayBuffer } | undefined;
        if (ejs?.getState) {
          const state = ejs.getState();
          await onSaveState(state);
        }
      } catch {
        // Autosave failure is non-critical
      }
    }, autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [loaded, onSaveState, autoSaveInterval]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-nuz-surface rounded-xl border border-nuz-border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${loaded ? 'bg-nuz-emerald animate-pulse' : 'bg-nuz-gold animate-pulse'}`} />
          <span className="font-pixel text-[10px] text-nuz-text-dim uppercase">
            {loaded ? 'Running' : 'Loading...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="nuz-btn-ghost text-xs font-pixel"
          >
            {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button
            onClick={async () => {
              if (onSaveState) {
                const w = window as Record<string, unknown>;
                const ejs = w.EJS_emulator as { getState?: () => ArrayBuffer } | undefined;
                if (ejs?.getState) {
                  const state = ejs.getState();
                  await onSaveState(state);
                }
              }
            }}
            className="nuz-btn-ghost text-xs font-pixel"
          >
            💾 SAVE
          </button>
          <button
            onClick={toggleFullscreen}
            className="nuz-btn-ghost text-xs font-pixel"
          >
            {isFullscreen ? '⊡ EXIT' : '⊞ FULL'}
          </button>
        </div>
      </div>

      {/* Emulator Container */}
      <div ref={containerRef} className="nuz-console-frame">
        {error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="text-4xl mb-4">⚠️</span>
            <p className="font-display font-bold text-nuz-ruby mb-2">Emulator Error</p>
            <p className="text-nuz-text-dim text-sm">{error}</p>
          </div>
        ) : (
          <div
            id="emulator-game"
            className="w-full aspect-[3/2] max-h-[70vh] bg-black rounded-lg"
          />
        )}
      </div>

      {/* Controls Reference */}
      <div className="bg-nuz-surface/50 rounded-xl border border-nuz-border p-4">
        <h4 className="font-pixel text-[10px] text-nuz-text-dim mb-3 uppercase">Controls</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-nuz-bg rounded border border-nuz-border font-mono text-nuz-text">↑↓←→</kbd>
            <span className="text-nuz-text-dim">D-Pad</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-nuz-bg rounded border border-nuz-border font-mono text-nuz-text">X</kbd>
            <span className="text-nuz-text-dim">A Button</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-nuz-bg rounded border border-nuz-border font-mono text-nuz-text">Z</kbd>
            <span className="text-nuz-text-dim">B Button</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-nuz-bg rounded border border-nuz-border font-mono text-nuz-text">Enter</kbd>
            <span className="text-nuz-text-dim">Start</span>
          </div>
        </div>
      </div>

      {/* Run ID for reference */}
      <input type="hidden" value={runId} />
    </div>
  );
}
