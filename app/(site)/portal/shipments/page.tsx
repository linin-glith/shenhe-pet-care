import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import ShipmentList from '@/components/v2/ShipmentList';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your shipments — Shenhe Zhongke',
  description: 'Bookings, tracking numbers and the documents issued for each shipment.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your shipments"
      lead="What has shipped, what is on the water, and when it is expected."
    >
      <ShipmentList />
    </PortalShell>
  );
}
