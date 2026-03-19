import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';

export default function HomePage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-nuz-hero opacity-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nuz-primary/10 border border-nuz-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-nuz-emerald animate-pulse" />
              <span className="font-pixel text-[10px] text-nuz-primary uppercase tracking-widest">
                Now Live — Season 1
              </span>
            </div>

            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-white leading-none mb-6">
              <span className="nuz-gradient-text">NUZLOCKE</span>
              <br />
              <span className="text-white">HUB</span>
            </h1>

            <p className="font-display text-xl md:text-2xl text-nuz-text-dim max-w-2xl mx-auto mb-4">
              Play Pokémon Nuzlocke runs directly in your browser.
              Generate, track, and conquer.
            </p>

            <p className="text-nuz-text-dim text-sm max-w-xl mx-auto mb-10">
              Built-in emulators for GB, GBC, GBA & NDS. Server-side saves.
              Cross-device resume. Nuzlocke ROM generator with seed-based reproducibility.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="nuz-btn-primary text-lg px-10 py-4">
                Start Your Run
              </Link>
              <Link href="/login" className="nuz-btn-secondary text-lg px-10 py-4">
                Continue Playing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: '🎮',
              title: 'Browser Emulators',
              desc: 'Play GB, GBC, GBA, and NDS games right in your browser with full controller support.',
              color: 'border-nuz-gb-green/30',
            },
            {
              icon: '⚡',
              title: 'ROM Generator',
              desc: 'Generate Nuzlocke-ready ROMs with customizable randomizer settings and reproducible seeds.',
              color: 'border-nuz-primary/30',
            },
            {
              icon: '📊',
              title: 'Run Tracker',
              desc: 'Track encounters, party, deaths, badges, and journal entries for each Nuzlocke attempt.',
              color: 'border-nuz-gold/30',
            },
            {
              icon: '☁️',
              title: 'Cloud Saves',
              desc: 'Your progress is saved server-side. Continue from any device, any time.',
              color: 'border-nuz-sapphire/30',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`nuz-card p-6 border-t-2 ${feature.color} group`}
            >
              <div className="text-4xl mb-4 group-hover:animate-float">{feature.icon}</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-nuz-text-dim text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="nuz-section-title text-center mb-12">
          Supported <span className="nuz-gradient-text">Platforms</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Game Boy', abbr: 'GB', color: 'text-nuz-gb-green', gen: 'Gen I-II' },
            { name: 'Game Boy Color', abbr: 'GBC', color: 'text-purple-400', gen: 'Gen II' },
            { name: 'Game Boy Advance', abbr: 'GBA', color: 'text-nuz-gba-purple', gen: 'Gen III' },
            { name: 'Nintendo DS', abbr: 'NDS', color: 'text-nuz-ds-blue', gen: 'Gen IV-V' },
          ].map((platform) => (
            <div
              key={platform.abbr}
              className="nuz-card p-6 text-center group hover:border-nuz-primary/50 transition-all"
            >
              <div className={`font-pixel text-3xl ${platform.color} mb-3 group-hover:animate-float`}>
                {platform.abbr}
              </div>
              <h3 className="font-display font-bold text-white text-sm">{platform.name}</h3>
              <p className="text-nuz-text-dim text-xs mt-1">{platform.gen}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nuzlocke Rules Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="nuz-card p-8 md:p-12 text-center bg-nuz-card-gradient">
          <h2 className="nuz-section-title mb-6">
            What is a <span className="text-nuz-ruby">Nuzlocke</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto text-left">
            <div>
              <div className="text-2xl mb-2">⚰️</div>
              <h4 className="font-display font-bold text-white mb-1">Permadeath</h4>
              <p className="text-nuz-text-dim text-sm">
                If a Pokémon faints, it&apos;s considered dead and must be permanently boxed or released.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-display font-bold text-white mb-1">First Encounter Only</h4>
              <p className="text-nuz-text-dim text-sm">
                You may only catch the first Pokémon encountered in each area. Miss it, and that area is done.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">✨</div>
              <h4 className="font-display font-bold text-white mb-1">Nickname All</h4>
              <p className="text-nuz-text-dim text-sm">
                Every Pokémon must be given a nickname to form a stronger bond with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-6">
          Ready to <span className="nuz-gradient-text">Challenge</span> Yourself?
        </h2>
        <p className="text-nuz-text-dim text-lg max-w-xl mx-auto mb-8">
          Create an account, pick your game, generate your ROM, and begin your journey.
        </p>
        <Link href="/register" className="nuz-btn-primary text-lg px-12 py-5 animate-pulse-glow">
          Begin Your Nuzlocke
        </Link>
      </section>
    </AppShell>
  );
}
