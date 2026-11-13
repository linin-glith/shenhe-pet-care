import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import InquiryList from '@/components/v2/InquiryList';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Your enquiries — Shenhe Zhongke',
  description: 'Every enquiry you have sent, with the stage it has reached.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your enquiries"
      lead="Every enquiry you have sent us, with our replies and where each one stands."
    >
      <InquiryList />
    </PortalShell>
  );
}
