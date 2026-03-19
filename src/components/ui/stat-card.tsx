interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  subtext?: string;
}

export function StatCard({ label, value, icon, color = 'text-nuz-primary', subtext }: StatCardProps) {
  return (
    <div className="nuz-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-nuz-bg flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-nuz-text-dim text-sm">{label}</p>
        <p className="font-display font-extrabold text-2xl text-white">{value}</p>
        {subtext && <p className="text-nuz-text-dim text-xs mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
