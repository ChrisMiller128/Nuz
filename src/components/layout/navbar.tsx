'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-nuz-surface/80 backdrop-blur-xl border-b border-nuz-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-nuz-primary flex items-center justify-center shadow-nuz-glow transition-all group-hover:shadow-nuz-glow-lg">
              <span className="font-pixel text-white text-xs">NH</span>
            </div>
            <span className="font-display font-extrabold text-xl text-white hidden sm:block">
              Nuzlocke<span className="text-nuz-primary">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {session ? (
              <>
                <Link href="/dashboard" className="nuz-btn-ghost">Dashboard</Link>
                <Link href="/library" className="nuz-btn-ghost">Library</Link>
                <Link href="/runs/new" className="nuz-btn-ghost">New Run</Link>
                <Link href="/generated-roms" className="nuz-btn-ghost">My ROMs</Link>
                <Link href="/settings" className="nuz-btn-ghost">Settings</Link>
                <div className="w-px h-8 bg-nuz-border mx-2" />
                <span className="text-nuz-text-dim text-sm mr-2">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="nuz-btn-ghost text-nuz-ruby hover:text-nuz-ruby"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nuz-btn-ghost">Login</Link>
                <Link href="/register" className="nuz-btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-nuz-text-dim hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-1">
              {session ? (
                <>
                  <Link href="/dashboard" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href="/library" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>Library</Link>
                  <Link href="/runs/new" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>New Run</Link>
                  <Link href="/generated-roms" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>My ROMs</Link>
                  <Link href="/settings" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>Settings</Link>
                  <div className="nuz-divider my-2" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="nuz-btn-ghost text-left text-nuz-ruby"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="nuz-btn-ghost text-left" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/register" className="nuz-btn-primary text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
