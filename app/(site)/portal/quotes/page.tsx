import type { Metadata } from 'next';
import PortalShell from '@/components/v2/PortalShell';
import QuoteList from '@/components/v2/QuoteList';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your quotations — Shenhe Zhongke',
  description: 'Every offer we have sent you, with the date it holds to and the delivery it covers.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your quotations"
      lead="Every offer we have sent you, with the date it holds to and the delivery it covers. The price itself is in the email that carried it."
    >
      <QuoteList />
    </PortalShell>
  );
}
