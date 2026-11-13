import type { Metadata } from 'next';
import PortalShell from '@/components/v2/PortalShell';
import QuoteDetail from '@/components/v2/QuoteDetail';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'A quotation — Shenhe Zhongke',
  description: 'One quotation: what it covers, what it holds to and what it costs.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell title="Quotation" lead="The quotation as it stands now.">
      <QuoteDetail />
    </PortalShell>
  );
}
