/**
 * Sourcing Guides — the content hub.
 *
 * This page is the container for the SEO programme. Four content pillars feed
 * it; articles land here first and earn their way into the navigation later.
 *
 * WHY THE EMPTY STATE IS DESIGNED RATHER THAN STUBBED
 * A hub with four categories and no articles reads as broken. A hub that says
 * plainly what is coming, and links to the one thing it CAN do now — send a
 * question — reads as a work in progress. The pillar cards therefore carry the
 * search intent each pillar will eventually rank for, which makes this page
 * useful to a visitor today and indexable when the articles arrive.
 */

import { type Locale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { fitDescription } from '@/lib/seo/meta';
import type { Metadata } from 'next';
import { pageCopy } from '@/lib/i18n/pages';
import { siteConfig } from '@/lib/shenhe.config';
import { Icon, type IconName } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { Btn } from '@/components/v2/blocks';
import { webPageSchema } from '@/lib/seo/schema';
import QuestionBoard from '@/components/v2/QuestionBoard';
import { IMPORT_STEPS } from '@/content/v2/how-to';
import { howToSchema } from '@/lib/seo/schema';
import { seedQuestions } from '@/content/v2/questions';
import { GUIDES_ANSWER } from '@//content/v2/answers';
import PageAnswer from '@/components/v2/PageAnswer';


const TITLE = 'Pet Product Sourcing Guides | MOQ, Import, Compliance';
const DESCRIPTION =
  'Guides for buyers importing pet care from a China manufacturer: what MOQ really means, how to read a test report, and how to compare. MOQ, reports, price.';

/**
 * The metadata of the English page.
 *
 * It is a function so that the language pages can ask for their own
 * title and description without a second copy of the same object.
 */
function buildMeta(): Metadata {
  return {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteConfig.brand.siteUrl}/sourcing-guides.html` },
  openGraph: {
    type: 'website',
    url: `${siteConfig.brand.siteUrl}/sourcing-guides.html`,
    siteName: siteConfig.brand.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`, width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${siteConfig.brand.siteUrl}/assets/img/ui/og-default.png`],
  },
  };
}

/**
 * The metadata of this page, in the buyer's language.
 *
 * The title and the description are the same sentence said to the
 * reader and to the search engine, so they change together.
 */
export function metadataFor(locale: 'de' | 'es' | 'en' = 'en'): Metadata {
  const base = buildMeta();
  if (locale === 'en') return base;
  const copy = pageCopy('sourcing-guides', locale);
  if (!copy.title) return base;
  return {
    ...base,
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: { ...base.openGraph, title: copy.title, description: fitDescription(copy.description), },
    twitter: { ...base.twitter, title: copy.title, description: fitDescription(copy.description), },
  };
}

export const metadata: Metadata = metadataFor('en');

export const dynamic = 'force-static';

type Pillar = {
  id: string;
  icon: IconName;
  title: string;
  intent: string;
  samples: string[];
};

const PILLARS: Pillar[] = [
  {
    id: 'sourcing',
    icon: 'cart',
    title: 'Sourcing Guides',
    intent: 'For the buyer who has never imported before.',
    samples: [
      'What MOQ means in pet product sourcing',
      'How to import pet products from China',
      'How to evaluate a pet care manufacturer',
      'How to read a pet product MSDS',
    ],
  },
  {
    id: 'compliance',
    icon: 'globe',
    title: 'Compliance Library',
    intent: 'For the compliance officer who blocks the shipment.',
    samples: [
      'EU CPNP: a complete guide for pet brands',
      'FDA registration for pet care products',
      'APVMA requirements for Australia',
      'HS codes for pet care products',
    ],
  },
  {
    id: 'howto',
    icon: 'flask',
    title: 'How-to Guides',
    intent: 'For the product itself — dosage, method, mistakes.',
    samples: [
      'How to use cat litter deodorizing powder',
      'How to use pet deodorizing spray',
      'How to use waterless pet shampoo',
      'How to introduce a new shampoo to a cat',
    ],
  },
  {
    id: 'notes',
    icon: 'paw',
    title: 'Pet Care Notes',
    intent: 'For the problems buyers actually search for.',
    samples: [
      "Why does my cat's litter box smell",
      'Is it safe to use bleach near cats',
      'How often should you bathe a dog',
      'Natural vs chemical flea treatments',
    ],
  },
];

/**
 * Per-market detail.
 *
 * The compliance page links here by anchor. Without this section those four
 * links resolved to a page that had no matching id, so every one of them was
 * a dead end — a card that promised an answer and delivered silence. Each
 * block below is what the destination-market card on the compliance page
 * actually promises, so the link earns its click.
 */
const MARKET_DETAIL: { id: string; flag: string; name: string; lines: string[] }[] = [
  {
    id: 'us',
    flag: 'US',
    name: 'United States',
    lines: [
      'FDA establishment registration — held, and verifiable on request',
      'MoCRA-aligned cosmetic GMP records retained per batch',
      'MoCRA facility registration and product listing responsibilities are allocated in writing before the first sample',
      'State-level requirements vary and are quoted per destination state',
    ],
  },
  {
    id: 'eu',
    flag: 'EU',
    name: 'European Union',
    lines: [
      'The EU responsible-person handover documented, with the technical file behind it',
      'Responsible Person coordination inside the EU — you must appoint one, we prepare the dossier',
      'A CPNP dossier and a cosmetic safety report only if the same formula is also sold for human use',
      'REACH and BPR documentation assembled from the ingredient list we hold',
      'Bilingual EN / Chinese label artwork, with the responsible-person address block',
    ],
  },
  {
    id: 'anz',
    flag: 'AU',
    name: 'Australia & New Zealand',
    lines: [
      'APVMA registration support for products in scope',
      'NICCAS / AICIS ingredient disclosure assembled from our formula records',
      'ARTG listing coordination where the product is a therapeutic good',
      'Full English dossier — no translation step for AU/NZ clearance',
    ],
  },
];

export default function SourcingGuidesPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <>
      {/* Every other public page carries at least one schema.org block; this
          one had none, so an answer engine had nothing to read. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: TITLE,
              path: '/sourcing-guides.html',
              description: DESCRIPTION,
            }),
          ),
        }}
      />
      {/* The steps, in the markup an assistant can lift. The page below
          already shows them; this says so in a shape that can be quoted
          whole. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            howToSchema({
        name: 'How to import pet care products from China',
        description:
          'Six steps from the first enquiry to the container: define the product and market, quote against a brief, confirm the sample, agree the formula and the documents, pay and produce, and ship.',
        url: '/sourcing-guides.html',
        totalTime: 'P25D',
        steps: IMPORT_STEPS,
      })
          ),
        }}
      />
      {/* ---------- H1 ---------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Sourcing Guides</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            The detail you need before the enquiry.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            Written by our R&amp;D and compliance team for importers — the questions
            they actually answer on the first call.
            Ten guides and one question board, maintained by the eight chemists and the
            compliance staff at our ISO 22716 GMP factory in Heyuan, Guangdong.
          </p>
          <PageAnswer {...GUIDES_ANSWER} />
          <div className="mt-9 flex flex-wrap gap-3">
            <Btn cta={{ label: 'Ask us a question', href: '/contact.html' }} light />
            <Btn cta={{ label: 'Browse the catalogue', href: '/products.html', variant: 'secondary' }} light />
          </div>
        </div>
      </section>

      {/* ---------- H2: pillars ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="Four things buyers need to know"
            sub="Every guide is written to be useful on its own, whether or not you ever order from us."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <section key={p.title} id={p.id} className="v3-card v3-card--interactive v3-rise p-7">
                <div className="flex items-start gap-4">
                  <span className="v3-icon-plate v3-icon" aria-hidden>
                    <Icon name={p.icon} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold tracking-tight text-v2-ink-900">{p.title}</h3>
                    <p className="mt-1.5 text-sm text-v2-ink-400">{p.intent}</p>
                  </div>
                </div>

                {/* The planned article list doubles as the pillar's search
                    intent: it names exactly what this section will cover. */}
                <ul className="mt-6 divide-y divide-v2-ink-100 border-y border-v2-ink-100">
                  {p.samples.map((s) => (
                    <li key={s} className="py-2.5 text-sm text-v2-ink-500">
                      {s}
                    </li>
                  ))}
                </ul>

                <a data-journey="contact" href="/contact.html" className="v3-link mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Ask about this instead <span aria-hidden>&rarr;</span>
                </a>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- per-market detail — the target of the compliance cards ---------- */}
      <section className="v3-section bg-v2-ink-050" id="markets">
        <div className="v2-container">
          <V3Head
            title="Per-market compliance detail"
            sub="What each destination actually requires, and which of those steps are ours."
          />
          <div className="mt-14 space-y-5">
            {MARKET_DETAIL.map((m) => (
              <article key={m.id} id={m.id} className="v3-card v3-card--interactive v3-rise scroll-mt-24 p-7 md:p-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-v2-ink-400">{m.flag}</span>
                  <h3 className="text-xl font-semibold tracking-tight text-v2-ink-900">{m.name}</h3>
                </div>
                <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {m.lines.map((l) => (
                    <li key={l} className="flex items-start gap-2.5 text-sm leading-relaxed text-v2-ink-600">
                      <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                      {l}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm leading-relaxed text-v2-ink-500">
            A market not listed here is not a refusal — it is an unquoted one. Send the
            destination and the product type and we will tell you in writing what we can
            cover before you commit to anything.
          </p>
        </div>
      </section>

      {/* ---------- closing ---------- */}
      <section className="bg-v2-accent-600 py-16">
        <div className="v2-container flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Have a question we have not written up?
            </h2>
            <p className="mt-3 text-white/85">
              Send it. If it is worth asking, it is worth publishing — and we will
              send you the answer directly in the meantime.
            </p>
          </div>
          {/* The board below holds the form, so the button goes there rather
              than to the general enquiry form: this is a question, not an
              order. */}
          <a href="#ask" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-v2-ink-900">
            Ask a question
          </a>
        </div>
      </section>

      {/* ---------- the questions buyers asked, and the form to add one ---- */}
      <QuestionBoard seed={seedQuestions} />
    </>
  );
}
