import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'nuz-bg': '#0f0f1a',
        'nuz-surface': '#1a1a2e',
        'nuz-surface-alt': '#16213e',
        'nuz-border': '#2a2a4a',
        'nuz-primary': '#e94560',
        'nuz-primary-glow': '#ff6b81',
        'nuz-secondary': '#533483',
        'nuz-accent': '#0f3460',
        'nuz-gold': '#ffd700',
        'nuz-emerald': '#2ecc71',
        'nuz-ruby': '#e74c3c',
        'nuz-sapphire': '#3498db',
        'nuz-text': '#e8e8f0',
        'nuz-text-dim': '#8888aa',
        'nuz-gb-green': '#9bbc0f',
        'nuz-gb-dark': '#0f380f',
        'nuz-gba-purple': '#7b68ee',
        'nuz-ds-blue': '#1e90ff',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        display: ['"Exo 2"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'nuz-glow': '0 0 20px rgba(233, 69, 96, 0.3)',
        'nuz-glow-lg': '0 0 40px rgba(233, 69, 96, 0.4)',
        'nuz-card': '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'nuz-inset': 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'nuz-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        'nuz-card-gradient': 'linear-gradient(145deg, rgba(42, 42, 74, 0.6) 0%, rgba(26, 26, 46, 0.8) 100%)',
        'nuz-hero': 'linear-gradient(135deg, #e94560 0%, #533483 50%, #0f3460 100%)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pixel-blink': 'pixelBlink 1s steps(2) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(233, 69, 96, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pixelBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
