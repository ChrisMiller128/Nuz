'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingScreen } from '@/components/ui/loading';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return <AppShell><LoadingScreen /></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="nuz-section-title mb-8">Settings</h1>

        {/* Profile */}
        <div className="nuz-card p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Username</label>
              <input
                type="text"
                className="nuz-input"
                value={session?.user?.name || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Email</label>
              <input
                type="email"
                className="nuz-input"
                value={session?.user?.email || ''}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Emulator Preferences */}
        <div className="nuz-card p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-white mb-4">Emulator Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Autosave Interval</label>
              <select className="nuz-select">
                <option value="30">Every 30 seconds</option>
                <option value="60" selected>Every 60 seconds</option>
                <option value="120">Every 2 minutes</option>
                <option value="300">Every 5 minutes</option>
                <option value="0">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Screen Scale</label>
              <select className="nuz-select">
                <option value="1">1x</option>
                <option value="2" selected>2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="nuz-card p-6">
          <h2 className="font-display font-bold text-lg text-white mb-4">Data Management</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-nuz-bg/30 rounded-lg">
              <div>
                <span className="text-white text-sm">Export All Save Data</span>
                <span className="text-nuz-text-dim text-xs block">Download a backup of all your saves</span>
              </div>
              <button className="nuz-btn-secondary text-xs">Export</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-nuz-bg/30 rounded-lg">
              <div>
                <span className="text-white text-sm">Export Run Data (JSON)</span>
                <span className="text-nuz-text-dim text-xs block">Export tracker data for all runs</span>
              </div>
              <button className="nuz-btn-secondary text-xs">Export</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
