// Forgot password — the form, not the legacy markup.
//
// WHY THIS PAGE IS HAND-BUILT
// The legacy page for this step was a heading and a paragraph: the old
// site never built the form, so there was nothing to convert. Rendered
// as it was, the page said nothing and did nothing — a buyer who cannot
// get into their own account, on a page that promised to help.
//
// WHAT IS KEPT FROM THE LEGACY PAGE
// The metadata and the structured data still come from the extracted
// head, so the SEO surface is unchanged. Only the body is different.
import type { Metadata } from 'next';
import page from '@/content/portal__forgot-password.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { ForgotPasswordForm } from '@/components/v2/PasswordForms';

const data = page as unknown as LegacyPage;

export const metadata: Metadata = legacyMetadata(data);

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <JsonLd page={data} />
      <div className="v2-section">
        <div className="v2-container max-w-2xl">
          <ForgotPasswordForm />
        </div>
      </div>
    </>
  );
}
