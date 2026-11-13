import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import DashboardOverview from '@/components/v2/DashboardOverview';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Account overview — Shenhe Zhongke',
  description: 'Your enquiries, orders, shipments and documents, and where each one stands.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your account"
      lead="The enquiries, orders and shipments we have for you, and what we are doing about each."
    >
      <DashboardOverview />
    </PortalShell>
  );
}
