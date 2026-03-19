import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Nuzlocke Hub - Play, Track & Conquer',
  description:
    'Play Pokémon Nuzlocke runs directly in your browser. Generate modified ROMs, track encounters, manage your team, and continue from any device.',
  keywords: ['nuzlocke', 'pokemon', 'emulator', 'tracker', 'game boy', 'gba', 'nds'],
  openGraph: {
    title: 'Nuzlocke Hub',
    description: 'The ultimate browser-based Pokémon Nuzlocke experience',
    url: 'https://nuzlocke.emulator.st',
    siteName: 'Nuzlocke Hub',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-nuz-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
