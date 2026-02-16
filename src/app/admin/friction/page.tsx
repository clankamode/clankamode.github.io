import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LegacySearchParams = {
  range?: string | string[];
  track?: string | string[];
};

function pickFirst(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function FrictionMonitorPage({
  searchParams,
}: {
  searchParams: Promise<LegacySearchParams>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set('tab', 'friction');

  const range = pickFirst(params.range);
  const track = pickFirst(params.track);

  if (range) query.set('range', range);
  if (track) query.set('track', track);

  redirect(`/admin/session-intelligence?${query.toString()}`);
}
