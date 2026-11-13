import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import DocumentList from '@/components/v2/DocumentList';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your documents — Shenhe Zhongke',
  description: 'Invoices, packing lists, bills of lading and certificates, as they are issued.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your documents"
      lead="The certificates, lab reports and specifications for your orders."
    >
      <DocumentList />
    </PortalShell>
  );
}
