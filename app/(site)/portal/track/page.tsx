// Track an enquiry by its reference.
//
// WHY THE PAGE IS A SERVER COMPONENT
// A page that exports `metadata` cannot be a client component — Next rejects
// the export at build time. The form itself needs the browser, so it lives in
// components/v2/TrackEnquiry.tsx and this file is the page around it.
//
// WHY noindex
// A tracking screen answers one buyer about one reference. It has nothing to
// offer a search result, and it must never appear as a searchable entry.
import type { Metadata } from 'next';
import TrackEnquiry from '@/components/v2/TrackEnquiry';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Track an enquiry — SHENHE ZHONGKE',
  description:
    'Check where your enquiry stands, using the reference we sent you. No account needed.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TrackEnquiry />;
}
