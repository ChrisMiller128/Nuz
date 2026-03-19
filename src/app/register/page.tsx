'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-nuz-primary mx-auto mb-4 flex items-center justify-center shadow-nuz-glow-lg animate-float">
              <span className="font-pixel text-white text-lg">NH</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-white">Create Account</h1>
            <p className="text-nuz-text-dim mt-2">Begin your Nuzlocke adventure</p>
          </div>

          <form onSubmit={handleSubmit} className="nuz-card p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-nuz-ruby/10 border border-nuz-ruby/30 text-nuz-ruby text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="nuz-input"
                placeholder="AshKetchum99"
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="nuz-input"
                placeholder="trainer@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="nuz-input"
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nuz-text-dim mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="nuz-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nuz-btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-nuz-text-dim text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-nuz-primary hover:text-nuz-primary-glow transition-colors">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
