export function Footer() {
  return (
    <footer className="border-t border-nuz-border bg-nuz-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-nuz-primary/20 flex items-center justify-center">
              <span className="font-pixel text-nuz-primary text-[8px]">NH</span>
            </div>
            <span className="font-display font-bold text-nuz-text-dim">
              Nuzlocke Hub
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-nuz-text-dim">
            <span>Play responsibly. Own your ROMs legally.</span>
          </div>
          <div className="text-xs text-nuz-text-dim font-pixel">
            v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}
