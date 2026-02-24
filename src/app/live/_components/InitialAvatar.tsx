const COLORS = [
  'bg-emerald-500/20 text-emerald-400',
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
];

export function InitialAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const color = COLORS[letter.charCodeAt(0) % COLORS.length];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
      {letter}
    </div>
  );
}
