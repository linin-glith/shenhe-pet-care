import Link from "@/components/SiteLink";
import { siteConfig } from "@/lib/shenhe.config";
import { ARTICLES } from "@/content/v2/articles";
import { JOURNEY_STAGES } from "@/content/v2/journey";
import LanguageSwitcher from "@/components/v2/LanguageSwitcher";
import CookieSettingsLink from "@/components/v2/CookieSettingsLink";
import { getT } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Footer mirrors the legacy 4-column layout verbatim:
 * brand+address (span 2) | Company | Products | Contact | Account, then a legal row.
 * The `© <year> <legalName>` string is copied from every shipped legacy page, so
 * the entity name stays consistent with the JSON-LD and the legal pages.
 *
 * THE GUIDES COLUMN
 * A buying guide that only the blog index links to is an orphan page: it
 * gets no link from the pages a buyer actually lands on, and the
 * internal link is what tells a crawler it is worth reading. So the
 * guides hang on every page, in the footer, where a reader who has
 * finished a product page will see them.
 *
 * The list is taken from the article registry rather than written out,
 * so a guide that is published appears here on the next build, and one
 * that is removed disappears. The buying-decision guides come first,
 * because those are the ones a buyer is reading when they are close to
 * an order.
 */
export function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const { nav, brand } = siteConfig;
  const t = getT(locale);

  /*
   * The footer labels come from the dictionary for the same reason the
   * navigation does: the ORDER and the URLs belong to the site, the
   * words belong to the language.
   *
   * THE PRODUCT LINES ARE NOT IN THIS MAP, ON PURPOSE
   * This map used to carry the four product-line URLs, all four pointing at
   * `t('products.title')` — which is the word "Products". So the column
   * headed "Products" rendered four links all reading "Products", and the
   * four product lines the site sells were named nowhere in the footer.
   *
   * A section title is not an item name. Those four entries now fall through
   * to the label in the site configuration, which reads the one canonical
   * name for each line (lib/product-routing.ts).
   */
  const LABELS: Record<string, string> = {
    '/about.html': t('nav.about'),
    '/factory.html': t('nav.factory'),
    '/capabilities.html': t('nav.rd'),
    '/certifications.html': t('compliance.title'),
    '/intellectual-property.html': 'Patents & trademarks',
    '/blog.html': t('nav.sourcing'),
    '/contact.html': t('nav.contact'),
    '/oem-odm.html': t('nav.oem'),
    '/global-compliance.html': t('nav.compliance'),
    '/sourcing-guides.html': t('nav.sourcing'),
    '/login.html': t('nav.signin'),
    '/account.html': t('nav.account'),
    '/trade-compliance.html': t('nav.trade'),
    '/ai-customize.html': t('nav.ai'),
    '/privacy.html': t('nav.privacy'),
    '/terms.html': t('nav.terms'),
    '/msds.html': t('compliance.msds'),
  };

  // The guides a buyer is most likely to be reading, first.
  const GUIDE_ORDER = [
    "how-to-choose-a-pet-care-oem-manufacturer-in-china",
    "how-to-choose-a-pet-shampoo",
    "pet-salon-shampoo-wholesale",
    "pet-groomer-bulk-supply",
    "pet-shampoo-ingredients-to-avoid",
    "waterless-foam-or-wet-shampoo",
  ];
  const ranked = [
    ...GUIDE_ORDER.map((slug) => ARTICLES.find((a) => a.slug === slug)).filter(
      (a): a is (typeof ARTICLES)[number] => a !== undefined,
    ),
    ...ARTICLES.filter((a) => !GUIDE_ORDER.includes(a.slug)),
  ];

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:grid-cols-4">
        {/* brand + address (legacy col 1, spanning) */}
        <div className="md:col-span-1">
          <div className="text-xl font-semibold tracking-tight">{brand.name}</div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{brand.legalName}</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/85">{brand.shortPitch}</p>
          <address className="mt-6 space-y-1 text-sm not-italic text-white/85">
            <div>{brand.address}</div>
          </address>
        </div>

        {/* Company */}
        <FooterCol title={t('nav.about')}>
          {nav.company.map((item) => (
            <FooterLink key={item.href} href={item.href} mark="footer">
              {LABELS[item.href] ?? item.label}
            </FooterLink>
          ))}
        </FooterCol>

        {/* Products */}
        <FooterCol title={t('nav.products')}>
          {nav.products.map((item) => (
            <FooterLink key={item.href} href={item.href}>
              {LABELS[item.href] ?? item.label}
            </FooterLink>
          ))}
        </FooterCol>

        {/* Contact + Account */}
        <FooterCol title={t('nav.contact')}>
          {nav.contact.map((item) => (
            <li key={item.label}>
              <a href={item.href} data-journey="footer" className="text-white/80 hover:text-white">
                <span className="text-white/50">{item.label}</span>: {item.value}
              </a>
            </li>
          ))}
          <li className="pt-2">
            <a
              href={`https://wa.me/${brand.whatsapp}`}
              data-journey="whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-light hover:text-white"
            >
              WhatsApp {brand.whatsappDisplay}
            </a>
          </li>
          <li className="pt-3 text-white/50">{t('nav.account')}</li>
          {nav.account.map((item) => (
            <FooterLink key={item.href} href={item.href}>
              {LABELS[item.href] ?? item.label}
            </FooterLink>
          ))}
        </FooterCol>
      </div>

      {/*
        TERMS AT A GLANCE.

        Four facts a buyer needs before they write, and the four they always
        have to ask for: how you pay, whether a sample costs anything, how
        long a private-label run takes, and how fast the answer comes.

        Every line here is already on the record elsewhere on the site — the
        payment methods are in the trade terms, the sample policy is on the
        contact page, the lead time is on every product card. Putting them
        in the footer is the difference between a buyer knowing and a buyer
        asking.

        The percentages are NOT here, and that is deliberate: the deposit
        split is agreed per order and written into the quotation, so
        publishing one number for it would be publishing a number that is
        not always true.
      */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid w-full max-w-6xl gap-x-8 gap-y-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Payment',
              value: 'Wire transfer (SWIFT T/T) or L/C at sight',
              note: 'Deposit terms are written into each quotation',
            },
            {
              label: 'Samples',
              value: 'Chargeable — fee in the quotation',
              note: 'Freight is paid by the buyer',
            },
            {
              label: 'Private label',
              value: '25–40 days',
              note: 'Stock lines ship in 7–15 days',
            },
            {
              label: 'Reply',
              value: 'Within one business day (CST)',
              note: 'Mon–Sat, 09:00–18:00 China Standard Time',
            },
          ].map((t) => (
            <div key={t.label} className="border-l-2 border-white/15 pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {t.label}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white">{t.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{t.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/*
        THE ORDER, STAGE BY STAGE.

        A buyer who has decided to order does not read the site by topic —
        they ask the next question. Five stages, five pages, one row across
        the footer where a reader who has finished a product page will see
        it: the quotation, the sample, the production run, the shipment and
        what happens afterwards.

        The list comes from content/v2/journey.ts, so the footer and the
        pages cannot list different stages, and the build gate checks that
        each of these five pages exists, carries one H1 in the buyer's own
        question form, and publishes no unit price.
      */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            The order, stage by stage
          </h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY_STAGES.map((s) => (
              <li key={s.href}>
                <Link href={s.href} data-journey="footer" className="text-white/85 hover:text-white">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/*
        The guides row.

        A full-width row under the four columns rather than a fifth
        column: nine guides in a column beside the address would make
        the footer taller than the page it belongs to, and a reader
        would have to scroll past the address to reach them. Across the
        width, they are one line a reader can see at the bottom of any
        page.
      */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            Buying guides
          </h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.category}/${a.slug}.html`}
                  data-journey="article"
                  className="text-white/85 hover:text-white"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* legal row */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>© 2026 {brand.legalName}. All rights reserved.</span>
            {/* The switcher is in the legal row because that is the one
                place on every page that belongs to nobody in particular —
                a reader looking for their own language will look at the
                bottom of the page, which is where every site puts it. */}
            <LanguageSwitcher variant="dark" mode="inline" />
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {nav.legal.map((item) => (
              <Link key={item.href} href={item.href} data-journey="footer" className="text-white/60 hover:text-white">
                {LABELS[item.href] ?? item.label}
              </Link>
            ))}
            {/*
              The withdrawal route.
              The banner tells the visitor they can change their mind from
              the footer, so the footer has to offer it. This is the
              control that makes that sentence true — and it is the only
              way a visitor can take a consent back once they have given
              it.
            */}
            <CookieSettingsLink label={t('cookie.settings')} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {/*
        h2, not h3.

        The footer is the last thing on every page, and the page's own
        headings end at h1 on a page like the enquiry tracker — which has one
        h1 and nothing below it. An h3 there skips a level on the way to the
        footer. These are section headings of the footer landmark, and the
        page title above them is the h1, so h2 is the level that belongs.
      */}
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  mark,
}: {
  href: string;
  /** The mark the journey reads: which place on the page this link is. */
  mark?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} data-journey="footer" className="text-white/80 hover:text-white">
        {children}
      </Link>
    </li>
  );
}