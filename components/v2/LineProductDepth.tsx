import { Icon } from '@/components/v2/Icon';
import { V3Head } from '@/components/v2/V3';
import { faqPageSchema } from '@/lib/seo/schema';
import { LINE_PRODUCTS, type LineProduct } from '@/lib/products';
import { siteConfig } from '@/lib/shenhe.config';

/**
 * The Inner Wellness product depth layer.
 *
 * WHY THESE PAGES NEED THEIR OWN BLOCK
 * The two Inner Wellness products are not catalogue SKUs. They have their own
 * routes, their own copy, their own claims and their own regulatory story,
 * but they are not in lib/products.json, so the SKU productDepth block cannot
 * render them. Left alone they were the two thinnest product pages on the
 * site — a hero, a claim list and a quote form.
 *
 * WHY THE COPY IS NOT DERIVED FROM A RECORD
 * Every other product page composes its prose from ProductSpec, which is the
 * point: a corrected record corrects the page. These two predate that
 * registry and carry their facts in the legacy content that produced them. So
 * the facts here are written once, in this file, and the page reads them from
 * one place rather than from three.
 *
 * The claims themselves are the ones the old site published — encapsulation
 * technique, live-culture arrival rate, IgG concentration, base percentage.
 * They are stated as the product's own claims, not as findings, and they are
 * backed by the per-batch COA that ships with every order.
 */
type Depth = {
  /** What it is and what the format does. */
  what: string;
  /** How it is used, step by step. */
  usage: string[];
  /** Handling, limits and what ships with it. */
  handling: { title: string; body: string }[];
  /** Questions a buyer asks before ordering a supplement. */
  faq: { q: string; a: string }[];
};

const DEPTH: Record<string, Depth> = {
  'pet-digestive-probiotics': {
    what:
      'A triple-encapsulated single-strain probiotic, dosed as an 8 mL course of nine vials. The three-layer coating is the point of the product: it carries live Lactobacillus acidophilus through stomach acid to the intestine, where an unencapsulated culture would largely be destroyed on the way down. The stated arrival rate is above 90% against roughly 30% for a standard unprotected formulation, and it is verified per batch on the certificate of analysis.',
    usage: [
      'Feed the whole vial directly, or mix it into a small amount of wet food if the animal will take it that way.',
      'One vial per day, following the course without interruption — a part-finished course is worse than none, because the viable count has already been spent.',
      'Give it at a consistent time each day, with or without food.',
      'Store unopened vials cool and dry. Once opened, use the vial within the day.',
      'Keep the full course sealed in its outer packaging until use, because the encapsulation is what protects the culture.',
    ],
    handling: [
      {
        title: 'Who it is for',
        body: 'Formulated for dogs and cats. As with any nutritional product, ask your vet before use in an animal under veterinary care, in a pregnant or nursing animal, or in one with a diagnosed gastrointestinal condition.',
      },
      {
        title: 'What ships with it',
        body: 'A per-batch certificate of analysis carrying the viable count, a 16-language safety data sheet, an ingredient and allergen declaration, and the commercial invoice with the HS code.',
      },
      {
        title: 'What the label can say',
        body: 'A supplement claim, not a disease claim, and the wording has to stay inside what the supporting documentation covers. Send the intended claim text with your enquiry and it will be answered against the evidence rather than estimated.',
      },
    ],
    faq: [
      {
        q: 'What is the minimum order?',
        a: 'MOQ is 1,000 courses of 8 mL × 9 vials. This product carries no catalogue SKU code, so it is quoted per project rather than per unit. A repeat run is quoted on its own volume, and the minimum for it is agreed in the quotation.',
      },
      {
        q: 'How long does production take?',
        a: '7–15 days for the stock formulation, and 25–40 days for private label measured from sample approval, because artwork and label compliance have to be settled before the filling run is scheduled.',
      },
      {
        q: 'Can the formula be developed with us?',
        a: 'Yes, under the same private-label programme as the rest of the catalogue. The R&D page describes the stages a new formula goes through, including the sample and the stability work.',
      },
      {
        q: 'Is it available in other formats?',
        a: 'The 8 mL × 9 vials course is the catalogue format. A different strain, count or delivery form is a development request rather than a stock SKU, and is quoted against the specification you send.',
      },
    ],
  },

  'pet-immunoglobulin': {
    what:
      'Bovine colostrum immunoglobulin with vitamins A and E, in a 15 g × 8 sachet format. The active fraction is bovine colostrum IgG at 49 g/kg or above, verified per batch on the certificate of analysis, and the sachet format exists so a single dose can be measured accurately and palatably folded into food rather than tipped into a bowl. The base is 20% bovine colostrum, which standardises the dose from batch to batch — the reason a colostrum product without a stated base percentage cannot be compared to one that has it.',
    usage: [
      'Open one sachet and mix it into a small amount of the animal’s usual wet food, or dust it over the food and mix thoroughly.',
      'One sachet per day, or as directed on your label artwork.',
      'Use the full sachet rather than a partial dose — the sachets are sized for the dose, and a half sachet delivers half the active fraction.',
      'Mix into food immediately before feeding, so the powder is not left sitting and exposed.',
      'Keep the remaining sachets sealed and dry.',
    ],
    handling: [
      {
        title: 'Who it is for',
        body: 'Formulated for dogs and cats. It is a nutritional supplement for general support and not a treatment for any condition. For an animal under veterinary care, or one with a diagnosed immune or digestive condition, ask your vet first.',
      },
      {
        title: 'What ships with it',
        body: 'A per-batch certificate of analysis carrying the IgG concentration, a 16-language safety data sheet, an ingredient and allergen declaration including the milk origin, and the commercial invoice with the HS code.',
      },
      {
        title: 'What the label can say',
        body: 'General nutrition and immune support, with the IgG figure stated per batch. Specific health claims are not available for this category in most destination markets, and the label artwork will be reviewed against that before production.',
      },
    ],
    faq: [
      {
        q: 'What is the minimum order?',
        a: 'MOQ is 1,000 courses of 15 g × 8 sachets. This product carries no catalogue SKU code, so it is quoted per project rather than per unit. A repeat run is quoted on its own volume, and the minimum for it is agreed in the quotation.',
      },
      {
        q: 'How long does production take?',
        a: '7–15 days for the stock formulation, and 25–40 days for private label measured from sample approval.',
      },
      {
        q: 'Is it suitable for animals with a milk allergy?',
        a: 'The product is bovine colostrum based, so it contains milk proteins. If the animal has a known dairy sensitivity, tell us before ordering and we will say plainly whether the formulation is appropriate.',
      },
      {
        q: 'Can the flavour or the sachet artwork be changed?',
        a: 'Artwork is available under private label. Flavouring a product in this category adds an ingredient and a stability question, so it is treated as a development request rather than a label change.',
      },
    ],
  },
};

export function LineProductDepth({ slug }: { slug: string }) {
  const depth = DEPTH[slug];
  const product: LineProduct | undefined = LINE_PRODUCTS[slug];
  if (!depth || !product) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(depth.faq)) }}
      />

      {/* ---------- what it is ---------- */}
      <section className="v3-section">
        <div className="v2-container">
          <V3Head
            title="What this product is"
            sub={`${product.name} — ${product.size}`}
          />

          <div className="mx-auto mt-10 max-w-3xl">
            <p className="text-[1.0625rem] leading-relaxed text-v2-ink-700">{depth.what}</p>

            <dl className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Minimum order', value: product.moq },
                { label: 'Stock lead time', value: '7–15 days' },
                { label: 'Private-label lead time', value: '25–40 days' },
                { label: 'Format', value: product.size },
                { label: 'Certifications', value: 'ISO 22716 GMP' },
                { label: 'Documents', value: 'COA per batch' },
              ].map((f) => (
                <div key={f.label} className="border-l-2 border-v2-accent-600 pl-4">
                  <dt className="text-xs font-medium text-v2-ink-400">{f.label}</dt>
                  <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-v2-ink-800">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- capacity, factory, trade terms ---------- */}
      {/*
       * THE THREE QUESTIONS A BUYER ASKS BEFORE THE FIRST SAMPLE.
       *
       * "How much can you make", "where is the factory", "what are your
       * terms". These two pages did not answer any of the three, and an
       * answer engine has nothing on them to quote.
       *
       * EVERY NUMBER HERE IS READ OUT OF THE CONFIGURATION. The
       * configuration is the one place these figures are written down, so
       * a corrected figure corrects the page with it.
       *
       * THE CAPACITY IS THE FACTORY'S, NOT THIS PRODUCT'S.
       *
       * The plant runs 1,000,000 bottles a month. That is what the
       * workshop as a whole can fill, and this product is not a bottle -
       * it is an 8 mL vial course and a 15 g sachet course. Writing
       * "this product's capacity is 1,000,000 bottles a month" would be
       * a number nobody could check and that contradicts the format on
       * the page, so the sentence says which capacity it is.
       *
       * NO PRICE, AND NO INCOTERM.
       *
       * The pricing policy is quote-only and says that volume tiering
       * and shipping terms are settled per enquiry, so the block says
       * that and names no term that the configuration does not hold.
       */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <V3Head
            title="The factory behind it"
            sub="Capacity, where it is, and how it is priced."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                kicker: 'Capacity',
                headline: `${siteConfig.metrics.monthlyCapacityBottles.toLocaleString('en-US')} bottles a month`,
                body:
                  `Our factory runs ${siteConfig.metrics.monthlyCapacityBottles.toLocaleString('en-US')} bottles a month, ` +
                  `across ${siteConfig.metrics.productionLines} production lines and ${siteConfig.metrics.productLines} product lines. ` +
                  `That is the capacity of the plant and not of this product: this line is packed as ` +
                  `${product.size} and not in bottles, and what the factory commits to for an order is ` +
                  `confirmed against the format and the pack.`,
              },
              {
                kicker: 'The factory',
                headline: `${siteConfig.metrics.buildings} buildings, ${siteConfig.metrics.employees} people`,
                body:
                  `${siteConfig.metrics.buildings} buildings in ${siteConfig.brand.location}: a ` +
                  `${siteConfig.metrics.foundingWorkshopM2.toLocaleString('en-US')} m² founding workshop and a ` +
                  `${siteConfig.metrics.cleanroomClass} cleanroom filling hall under ` +
                  `${siteConfig.metrics.gmpStandard} GMP, with ${siteConfig.metrics.employees} people on site, full time.`,
              },
              {
                kicker: 'Pricing and trade terms',
                headline: siteConfig.pricing.display,
                body: `${siteConfig.pricing.productPricing} ${siteConfig.pricing.policy}`,
              },
            ].map((f) => (
              <div key={f.kicker} className="rounded-v2-lg border border-v2-ink-200 bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-v2-ink-400">
                  {f.kicker}
                </p>
                <p className="mt-3 text-[1.0625rem] font-semibold leading-snug text-v2-ink-900">
                  {f.headline}
                </p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- usage + handling ---------- */}
      <section className="v3-section bg-v2-ink-050">
        <div className="v2-container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="v2-display text-3xl md:text-4xl">How to use it</h2>
              <ol className="mt-6 space-y-4">
                {depth.usage.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-v2-accent-050 font-mono text-[11px] font-bold text-v2-accent-700 ring-1 ring-v2-accent-100"
                    >
                      {i + 1}
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="v2-display text-3xl md:text-4xl">Handling and limits</h2>
              <dl className="mt-6 space-y-5">
                {depth.handling.map((h) => (
                  <div key={h.title}>
                    <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">{h.title}</dt>
                    <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-v2-ink-600">
                      {h.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="v3-section" id="faq">
        <div className="v2-container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <V3Head title="Questions buyers ask" sub="Answered with the same figures we quote." />
            </div>
            <dl className="divide-y divide-v2-ink-200 border-y border-v2-ink-200">
              {depth.faq.map((f) => (
                <div key={f.q} className="grid gap-2 py-6 sm:grid-cols-[15rem_1fr] sm:gap-8">
                  <dt className="flex items-start gap-2 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                    <Icon name="chat" size={15} className="mt-1 shrink-0 text-v2-ink-300" />
                    {f.q}
                  </dt>
                  <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
