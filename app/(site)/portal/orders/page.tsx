import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import OrderList from '@/components/v2/OrderList';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your orders — Shenhe Zhongke',
  description: 'Your orders, the stage each is at and the date we have promised.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your orders"
      lead="The orders we have for you, with the delivery dates we have committed to."
    >
      <OrderList />
    </PortalShell>
  );
}
