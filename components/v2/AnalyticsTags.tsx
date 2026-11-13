'use client';

/**
 * The analytics tags.
 *
 * WHY gtag.js AND NOT TAG MANAGER
 * Tag Manager earns its keep when one snippet drives several tools. This site
 * has one measurement id and one heat map, and a Tag Manager container that
 * has to be configured and published before anything is sent — an empty
 * container sends nothing, which is indistinguishable from a broken site.
 * The tags load directly, and there is one layer between the browser and
 * Google instead of two.
 *
 * WHY THE CONSENT DEFAULT IS SET FIRST
 * The tag below is loaded with `afterInteractive`, so it runs after the page
 * is interactive. Consent Mode's default has to be in place before the first
 * request, which is why ConsentGate sets it in a layout effect that mounts
 * before this script's request goes out. Without it, the first ping carries
 * no consent signal at all.
 *
 * THE CLARITY MASK
 * Clarity records what a visitor types into a form. On a B2B site that means
 * company names, email addresses and the body of an enquiry — exactly the
 * things that should not leave the company in someone else's recording. The
 * enquiry form carries `data-clarity-mask`, which tells Clarity to blur that
 * field and not to store its contents. A masked field still shows that the
 * form was used, without shipping what was written in it.
 */

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/shenhe.config';

const GA_ID = siteConfig.analytics.ga4Id;
const CLARITY_ID = siteConfig.analytics.clarityId;

/**
 * The surfaces that must not be measured.
   *
   * The factory desk and the buyer portal are named by their first
   * path segment. That is the same spelling the sitemap, the nginx
   * rules and the robots file use, so the rule has one form in the
   * whole system.
   *
   * A measurement of a public page tells us how a visitor finds us.
   * A measurement of the desk tells us how a staff member moves
   * around a tool, and carries buyer names and enquiry states to
   * somebody else's server. A measurement of the portal carries a
   * signed-in buyer's commercial information, which is the one thing
   * on this site that is never ours to send anywhere.
   */
function isUnmeasuredSurface(pathname: string | null): boolean {
  if (!pathname) return false;
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  return first === 'admin' || first === 'portal';
}

export default function AnalyticsTags() {
  const pathname = usePathname();
  if (isUnmeasuredSurface(pathname)) return null;

  return (
    <>
      {/* Google tag (gtag.js). The consent default is already set by
          ConsentGate, which mounts earlier in the tree. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: true });`}
      </Script>

      {/* Microsoft Clarity. The same mask as the enquiry form: the field is
          still visible in a session recording, but its contents are not
          stored by Clarity. */}
      {CLARITY_ID && (
        <>
          <Script id="clarity-head" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_ID}");`}
          </Script>
        </>
      )}
    </>
  );
}