import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InventoryCountPage from '@/components/inventory/inventory-count-page';

export const metadata: Metadata = {
  title: 'Comptage inventaire | Boukir Diamond',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  alternates: { canonical: null },
};
export const dynamic = 'force-dynamic';

export default async function CountInventoryPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(token)) notFound();
  return <InventoryCountPage token={token} />;
}
