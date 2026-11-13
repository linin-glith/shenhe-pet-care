import Link from "@/components/SiteLink";
import Img from "@/components/v2/Img";
import { siteConfig } from "@/lib/shenhe.config";
import { whatsappLink } from "@/lib/contact-links";
import LanguageSwitcher from "@/components/v2/LanguageSwitcher";
import NavMenu from "@/components/v2/NavMenu";
import { TrustBar } from "@/components/v2/TrustBar";
import { getT } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Sticky header mirroring the legacy nav order exactly:
 * Home · Products · OEM/ODM · Factory · R&D · Certifications · About → Get a Quote · Sign in
 * The URL paths are unchanged from the legacy site (no redirects needed).
 *
 * WHY THE CONTAINER IS 1280px AND NOT 1152px
 * The page body runs in the design system's own container, which is
 * 1280px wide (--v2-container). The header was using Tailwind's
 * max-w-6xl - 1152px - so the header was 128px narrower than the content
 * it floats above, and the logo did not line up with anything on the page.
 * It is now the same 1280px with the same 40px gutter.
 *
 * WHY THE ROW IS THIS SIZE AND NOT BIGGER
 * Measured on the built German page, the four groups in this row needed
 * 1490px - 290px more than the container has inside it. The row ran off
 * the right edge of the screen, so the reader had to scroll sideways to
 * reach "Get a Quote". The language became one button, the navigation
 * labels became the short forms a navigation can carry, the account links
 * moved into the menu, and the row now fits with room to spare.
 */
export function Header({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const { main, account, secondary } = siteConfig.nav;
  const t = getT(locale);

  /*
   * The navigation labels come from the dictionary, not from the config.
   *
   * The config still owns the ORDER and the URLs — those are facts about
   * the site, not about a language. The label is a fact about a
   * language, and it belongs beside the other language facts.
   *
   * They are the SHORT forms. A navigation label is not a headline: the
   * page it points at carries the full phrase in its title and its H1,
   * and "Forschung & Entwicklung" in a navigation row is 185px of a row
   * that has 1200px in total.
   */
  const NAV_LABELS: Record<string, string> = {
    '/index.html': t('nav.home'),
    '/products.html': t('nav.products'),
    '/oem-odm.html': t('nav.oem'),
    '/global-compliance.html': t('nav.compliance'),
    '/factory.html': t('nav.factory'),
    '/capabilities.html': t('nav.rd'),
    '/sourcing-guides.html': t('nav.sourcing'),
    '/about.html': t('nav.about'),
  };

  const menuItems = main.map((item) => ({
    href: item.href,
    label: NAV_LABELS[item.href] ?? item.label,
  }));

  /*
   * The links that are NOT in the row.
   *
   * "Sign in" is the account surface, and a reader who is buying is not
   * signing in - the account column in the footer carries it too. The
   * two secondary pages had no entry in the header at all before, so a
   * reader had to find them in the footer.
   */
  const extraItems = [
    { href: account[0].href, label: t('nav.signin') },
    { href: '/trade-compliance.html', label: t('nav.trade') },
    { href: '/ai-customize.html', label: t('nav.ai') },
  ];

  return (
    <>
      {/* The statement, then the tool.
          The strip carries the licence number and expiry, the plant's
          location, and the reseller route. It sits above the header and
          outside the sticky container on purpose: see TrustBar. */}
      <TrustBar />
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 md:px-10">
        <Link data-journey="nav" href="/" className="flex shrink-0 items-center">
          {/* Real brand lockup lifted from the company PPT
              (深河中科 / SHENHEZHONGKE, blue, transparent). It replaces the
              old "SZ" text badge — the logo artwork previously on file was
              the white variant, which is invisible on this white header.
              The lockup already carries the company name, so the old
              "SHENHE ZHONGKE / Pet Care OEM/ODM" text block is gone: this
              row only had ~1px of slack before, and two brand treatments
              do not fit side by side. */}
          <Img
            src="/assets/img/ui/logo.png"
            alt="SHENHE ZHONGKE — pet care OEM and ODM factory"
            width={271}
            height={68}
            priority
            className="h-7 w-auto sm:h-8"
            /* 112 px wide on the screen - so that is the width the
               browser has to cover, and it takes the small file */
            sizes="112px"
          />
        </Link>

        {/*
          The navigation.

          It is inline on the wide widths and behind the menu button on the
          narrow ones, because the four groups in this row do not fit on a
          laptop. Below 1280px there used to be no navigation in the
          header at all.
        */}
        <nav aria-label="Main" className="hidden items-center xl:flex">
          {main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
            data-journey="nav"
              className="whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            >
              {NAV_LABELS[item.href] ?? item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* The language switcher. It sits before the account actions
              because a reader looking for their own language looks at
              the far end of the navigation, and because the account
              actions are the two the site wants the eye on last. It is
              ONE BUTTON here: three language words laid out flat took
              178px of this row, and the row did not have 178px to give. */}
          <LanguageSwitcher className="hidden sm:block" />
          {/* The secondary action. It carries the page in the message, so a
              buyer who asks from a product page does not have to say which
              product they are asking about. */}
          <a
            href={whatsappLink({ page: "your catalogue" })}
            data-journey="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden whitespace-nowrap rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand md:inline-flex"
          >
            WhatsApp
          </a>
          {/* The primary action. The form is the route that reaches the
              sales desk and leaves a record. */}
          <Link
            href="/contact.html"
            data-journey="ask"
            className="inline-flex items-center whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:px-4"
          >
            {t('nav.quote')}
          </Link>

          {/* The navigation and the account links, behind a button, on the
              widths where they do not fit in the row. */}
          <NavMenu
            navItems={menuItems}
            items={extraItems}
            label={t('nav.menu')}
            closeLabel={t('nav.close')}
          />
        </div>
      </div>
      </header>
    </>
  );
}
