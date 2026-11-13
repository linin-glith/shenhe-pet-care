// Confirming an address — the page the confirmation link opens.
//
// WHY IT IS HAND-BUILT
// The legacy site had no page for this step, so there is no extracted
// markup to convert and no head to carry over. The page is written
// from nothing, which is the right shape for it: a buyer who has just
// clicked a link in a message wants one thing — to know whether it
// worked.
//
// WHY IT IS NOT IN THE SITEMAP
// This is a step inside a sign-up, not a page a buyer goes looking
// for. It stays out of the index so it does not compete with the
// pages that do the work.
import type { Metadata } from 'next';
import VerifyEmailForm from '@/components/v2/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Confirm your address — Shenhe Zhongke',
  description:
    'Confirm the email address on your Shenhe Zhongke buyer account.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

export default function Page() {
  return (
    <div className="v2-section">
      <div className="v2-container max-w-2xl">
        <VerifyEmailForm />
      </div>
    </div>
  );
}
