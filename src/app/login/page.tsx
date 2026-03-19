'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
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
            <div className="w-16 h-16 rounded-2xl bg-nuz-primary mx-auto mb-4 flex items-center justify-center shadow-nuz-glow-lg">
              <span className="font-pixel text-white text-lg">NH</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-white">Welcome Back</h1>
            <p className="text-nuz-text-dim mt-2">Continue your Nuzlocke journey</p>
          </div>

          <form onSubmit={handleSubmit} className="nuz-card p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-nuz-ruby/10 border border-nuz-ruby/30 text-nuz-ruby text-sm">
                {error}
              </div>
            )}

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
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nuz-btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-nuz-text-dim text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-nuz-primary hover:text-nuz-primary-glow transition-colors">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
