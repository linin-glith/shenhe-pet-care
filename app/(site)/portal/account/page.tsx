import type { Metadata } from 'next';
import PortalShell, { usePortal } from '@/components/v2/PortalShell';
import AccountPanel from '@/components/v2/AccountPanel';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Account — Shenhe Zhongke',
  description: 'Your details, and how to change your password.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PortalShell
      title="Your account details"
      lead="The details we hold for you, and how to change them."
    >
      <AccountPanel />
    </PortalShell>
  );
}
