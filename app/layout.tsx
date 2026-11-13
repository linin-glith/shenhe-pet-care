import type { Metadata } from "next";
import Script from "next/script";
// The two families, declared in the project rather than fetched from
// Google at build time. See public/fonts/fonts.css for why.
import "./../public/fonts/fonts.css";
import "./globals.css";
// v2 design system — additive layer. globals.css keeps owning the legacy
// `pp-*` prose styles so the 47 migrated pages are unaffected.
import "./design-system.css";
// Legacy palette bridge. Imported after design-system.css because it
// aliases the --v2-* tokens that file declares: the migrated pages carry
// inline styles written against the old --pp-* variables, and without this
// layer 294 declarations across the export resolved to nothing.
import "./legacy-tokens.css";
// 2026 element library — primitives for pointer-reactive surfaces, reveals
// and focus. Imported last so its rules win over the token layer on ties.
import "./elements.css";
import "./back-to-top.css";
import "./chat-entry.css";
import { siteConfig } from "@/lib/shenhe.config";
import ConsentGate from "@/components/v2/ConsentGate";
import PointerField from "@/components/v2/PointerField";
import JourneyMarker from '@/components/v2/JourneyMarker';



/*
 * The display face.
 *
 * The site declares `--v2-font-display: "Inter Tight", ...` and the
 * design system intends it for every headline, but Inter Tight was
 * never loaded. `--font-display` in globals.css refers to itself —
 * `var(--font-display)` inside the declaration of `--font-display` —
 * which CSS resolves to the guaranteed-invalid value, so the token
 * fell through to `ui-serif, Georgia, serif`.
 *
 * The result was an English headline set in a serif fallback while
 * the rest of the site was Inter. It is not a subtle difference:
 * Georgia at 84px is wide enough that the home headline wrapped to
 * five lines and pushed the call to action below the fold, and at
 * 28px on a phone "Private-label" overflowed the viewport.
 *
 * Loading the face the design system already names fixes both, and
 * the token below now resolves to it instead of to nothing.
 */


export const metadata: Metadata = {
  metadataBase: new URL("https://shenhezhongke.com"),
  title: {
    default: `${siteConfig.brand.name} — ${siteConfig.brand.positioning} since ${siteConfig.brand.foundedYear}`,
    template: `%s`,
  },
  description: siteConfig.brand.shortPitch,
  keywords: [
    "pet care OEM manufacturer",
    "private label pet products",
    "pet shampoo factory",
    "pet deodorizing spray",
    "pet supplements OEM",
    "OEM ODM pet products",
    "ISO 22716 GMP factory",
    "Heyuan Guangdong pet products",
  ],
  authors: [{ name: siteConfig.brand.legalName }],
  creator: siteConfig.brand.name,
  publisher: siteConfig.brand.name,
  /*
   * THE ICON, WITHOUT THE HASH.
   *
   * Next generates the link for app/favicon.ico as
   *   /favicon.ico?favicon.117ezoe8m31dk.ico
   * - the query is a cache-buster it adds itself. The server has a rule
   * that answers 404 for a path with arguments that are not a tracking
   * tag, because that is how a scanner keeps a site busy. The rule is
   * right; the URL is the problem.
   *
   * So the icon is declared here, plain, and the hash argument never
   * reaches the server. Every page load was asking for a file that could
   * not be had.
   */
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon", sizes: "48x48" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shenhezhongke.com",
    siteName: siteConfig.brand.name,
    title: `${siteConfig.brand.name} — ${siteConfig.brand.positioning} since ${siteConfig.brand.foundedYear}`,
    description: siteConfig.brand.shortPitch,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior="smooth" — 全局设了 scroll-behavior: smooth，
    // Next 路由切换时必须显式声明，否则平滑滚动会被打断并告警
    // https://nextjs.org/docs/messages/missing-data-scroll-behavior
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <head>
        {/*
          THE RENDERER, DECLARED.

          A browser that uses two rendering engines - the ones built on
          both WebKit and Trident - will ask the page which one to
          use. Without the answer it may render the page with the
          older engine, and the page looks different from what it
          looks like in every other browser.

          The tag costs nothing and it makes the page look the same
          everywhere. The Chinese search guide names it as one of the
          two things that matter on a site sold into that market, and
          the two-core browsers there are the ones that ask the
          question.
        */}
        <meta name="renderer" content="webkit" />
        <meta name="force-rendering" content="webkit" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Publishes cursor coordinates into CSS custom properties for the
            element library. Renders nothing and, on touch devices, does
            nothing at all. */}
        <PointerField />

        {/* Consent first. This mounts before the analytics tags below, so
            the consent default is in place before the first request goes out. */}
        <ConsentGate />

        {/* The measurement tags are NOT here.
              They live in the site layout, so the console and the buyer
              portal never load them. Clarity records the screen and
              keeps the text on it; the factory desk shows buyer names,
              countries, enquiry states and response times, and the
              portal shows a buyer's own orders. Neither belongs in a
              recording on someone else's server.
              The consent gate stays in the root layout, because consent
              has to be settled before any tag on any page can fire. */}
        <main className="flex-1">{children}</main>
            <JourneyMarker />
    </body>
    </html>
  );
}