/**
 * Article detail route.
 *
 * One static page per article, at /blog/<category>/<slug>.html —
 * the category is in the path because the canonical, the OpenGraph URL and
 * the BreadcrumbList all publish it there. Every article gets the same template on
 * purpose: a template that varies per article is a template nobody maintains,
 * and inconsistent schema across a content set is worse than a plain one.
 *
 * SEO CONTRACT PER ARTICLE
 *   title         — the search question, not a brand suffix
 *   description   — 60–180 characters, states the answer
 *   h1            — exactly one, the question as written
 *   h2            — the section headings, no level skips
 *   FAQPage       — generated from the same array the page renders
 *   BreadcrumbList— so the category path is machine-readable
 *   1–2 product links, no more
 */

import type { Metadata } from 'next';
import { fitDescription } from '@/lib/seo/meta';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/lib/shenhe.config';
import { Icon } from '@/components/v2/Icon';
import { ARTICLE_DOCS } from '@/content/v2/articles';
import { ARTICLES, articleSources } from '@/content/v2/articles';
import { getProductById, productUrl } from '@/lib/products';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';
import { articleCopy } from '@/lib/i18n/articles';
import { BUILD_DATE } from '@/lib/seo/build-date';

type Params = { category: string; slug: string };

export function generateStaticParams(): Params[] {
  return Object.values(ARTICLE_DOCS).map((d) => ({ category: d.category, slug: d.slug }));
}

function doc(slug: string) {
  return ARTICLE_DOCS[slug];
}

/**
 * The article behind a PATH, not behind a slug.
 *
 * The category is part of the published URL, so it has to be checked:
 * /blog/compliance/<slug>.html and /blog/sourcing/<slug>.html would
 * otherwise be the same article at two addresses, and the canonical only
 * names one of them.
 */
function docAt(category: string, slug: string) {
  const d = doc(slug);
  return d && d.category === category ? d : undefined;
}

/**
 * The metadata of a guide, in the buyer's language.
 *
 * The title and the description are what the search engine matches
 * on and what the buyer reads before clicking, so they are the
 * first thing that has to be in the buyer's own words.
 */
export async function metadataFor(
  locale: 'de' | 'es' | 'en',
  category: string,
  slug: string,
): Promise<Metadata> {
  const d = docAt(category, slug);
  if (!d) return {};
  const copy = articleCopy(slug, locale);
  const base = await generateMetadata({ params: Promise.resolve({ category, slug }) } as never);
  if (!copy) return base;
  return {
    ...base,
    title: copy.title,
    description: fitDescription(copy.description),
    openGraph: { ...base.openGraph, title: copy.title, description: fitDescription(copy.description), },
    twitter: { ...base.twitter, title: copy.title, description: fitDescription(copy.description), },
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, slug } = await params;
  const d = docAt(category, slug);
  if (!d) return {};
  /* The guide's own words, in the buyer's language.
   *
   * A German importer looking for "Wie wähle ich einen Tierpflege-
   * Hersteller in China" needs a result that says that. The article body
   * is still English - that is the larger translation job and it is
   * tracked - but the title and the description are what the search engine
   * matches on and what the buyer reads before clicking. */
  const copy = articleCopy(d.slug, 'de') ?? null;
  return {
    title: d.seo.title,
    description: fitDescription(d.seo.description),
    alternates: { canonical: `${siteConfig.brand.siteUrl}/blog/${d.category}/${d.slug}.html` },
    openGraph: {
      type: 'article',
      title: d.seo.title,
      description: fitDescription(d.seo.description),
      url: `${siteConfig.brand.siteUrl}/blog/${d.category}/${d.slug}.html`,
      siteName: siteConfig.brand.name,
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title: d.seo.title, description: fitDescription(d.seo.description), },
  };
}

export const dynamic = 'force-static';

/*
 * The author.
 *
 * A guide with no attributable author is anonymous content, and an
 * assistant that cannot attribute a claim treats it as safer not to
 * quote it. That is the difference between a guide that is read and
 * a guide that is cited.
 *
 * So the guides carry an author — and the author is a team, not a
 * name. This company does not publish the name of the person who
 * wrote a guide, and inventing one would be worse than having none:
 * a made-up author is a claim that cannot be checked, and it would
 * be checked.
 *
 * What is given instead is what can be verified: the legal entity,
 * the role the team plays, and the certifications the team works
 * under. An `Organization` in the `author` slot is a legitimate
 * author entity, and it is the honest one.
 */
const AUTHOR = {
  '@type': 'Organization',
  name: `${siteConfig.brand.name} R&D and Compliance Team`,
  url: `${siteConfig.brand.siteUrl}/about.html`,
  parentOrganization: {
    '@type': 'Organization',
    name: siteConfig.brand.legalName,
    alternateName: siteConfig.brand.name,
    /* How this business is priced. The same sentence every organisation
       node of ours carries. */
    description: siteConfig.pricing.declaration,
    url: `${siteConfig.brand.siteUrl}/`,
    foundingDate: String(siteConfig.brand.foundedYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.brand.address,
      addressLocality: 'Heyuan',
      addressRegion: 'Guangdong',
      addressCountry: 'CN',
      postalCode: siteConfig.brand.postalCode,
    },
  },
  knowsAbout: [
    'Pet care OEM and ODM manufacturing',
    'ISO 22716 cosmetic GMP',
    'MSDS and safety data sheets',
    'FDA facility registration',
    'Private label pet shampoo, deodorizer and litter deodorizer',
  ],
};

/**
 * The reviewer, when the article says it was reviewed.
 *
 * The page prints a "Reviewed by our compliance team" badge when the
 * article carries `reviewedBy: 'compliance'`, and the markup reads the
 * same field. One flag, two readers: the badge and the schema cannot
 * disagree about whether a review happened, because both are looking at
 * the same word.
 *
 * No article carries it at the moment, and that is the honest state: this
 * company does not publish a list of guides it has formally signed off,
 * and the badge is not shown on a guide nobody reviewed. The wiring is
 * here so that when one is reviewed, the markup says so on the same day —
 * and so that the gate can check that the two never drift apart.
 */
const REVIEWER = {
  '@type': 'Organization',
  name: `${siteConfig.brand.name} Compliance Team`,
  parentOrganization: {
    '@type': 'Organization',
    name: siteConfig.brand.legalName,
    alternateName: siteConfig.brand.name,
    /* How this business is priced. Every organisation node of ours carries
       it — including this one, which is nested inside the reviewer and
       would otherwise be the one organisation on the site that does not
       say what kind of business it is. */
    description: siteConfig.pricing.declaration,
    url: `${siteConfig.brand.siteUrl}/`,
  },
  url: `${siteConfig.brand.siteUrl}/certifications.html`,
};

function schemas(d: NonNullable<ReturnType<typeof doc>>, heading?: string) {
  const url = `${siteConfig.brand.siteUrl}/blog/${d.category}/${d.slug}.html`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      /* The article's own address in the graph, so the page node below can
         point at it. */
      '@id': `${url}#article`,
      headline: heading ?? d.seo.title,
      description: fitDescription(d.seo.description),
      url,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      datePublished: d.date,
      dateModified: d.date,
      inLanguage: 'en',
      author: AUTHOR,
      ...(d.reviewedBy === 'compliance' ? { reviewedBy: REVIEWER } : {}),
      publisher: {
        '@type': 'Organization',
        '@id': `${siteConfig.brand.siteUrl}/#organization`,
        name: siteConfig.brand.legalName,
        alternateName: siteConfig.brand.name,
        /* How this business is priced. The same sentence every organisation
           node of ours carries. */
        description: siteConfig.pricing.declaration,
        url: `${siteConfig.brand.siteUrl}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.brand.siteUrl}/assets/img/ui/logo.png`,
        },
      },
      image: [`${siteConfig.brand.siteUrl}/assets/img/ui/logo.png`],
    },
    {
      /*
       * THE PAGE THE ARTICLE IS ON.
       *
       * The guide had an Article and a FAQPage and a breadcrumb trail, and
       * no page node - so nothing in the markup said what the page was, or
       * when it was published, or what it belonged to. The Article is the
       * document; this is the page the document is on, and the two are
       * linked both ways.
       */
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: heading ?? d.seo.title,
      url,
      description: fitDescription(d.seo.description),
      datePublished: d.date,
      dateModified: d.date,
      isPartOf: { '@id': `${siteConfig.brand.siteUrl}/#website` },
      about: { '@id': `${siteConfig.brand.siteUrl}/#organization` },
      mainEntity: { '@id': `${url}#article` },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      dateModified: BUILD_DATE,
      mainEntity: d.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      dateModified: BUILD_DATE,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteConfig.brand.siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteConfig.brand.siteUrl}/blog.html` },
        {
          '@type': 'ListItem',
          position: 3,
          name: d.category.replace(/-/g, ' '),
          item: `${siteConfig.brand.siteUrl}/blog.html`,
        },
        { '@type': 'ListItem', position: 4, name: d.seo.title, item: url },
      ],
    },
  ];
}

export default async function ArticlePage({
  params,
  locale = DEFAULT_LOCALE,
}: {
  params: Promise<Params>;
  locale?: Locale;
}) {
  const { category, slug } = await params;
  const d = docAt(category, slug);
  if (!d) notFound();

  /** The guide's own words, in the buyer's language. */
  const copy = articleCopy(d.slug, locale);
  const heading = copy?.title ?? d.seo.title;

  const related = d.relatedProducts
    .map((r) => {
      const p = getProductById(r.id);
      return p ? { p, note: r.note } : null;
    })
    .filter(Boolean) as { p: NonNullable<ReturnType<typeof getProductById>>; note: string }[];

  /** The documents behind this guide's claims. */
  const sources = articleSources(d.slug);

  return (
    <>
      {schemas(d, heading).map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}

      <article>
        {/* ---------- H1 ---------- */}
        <header className="on-dark relative overflow-hidden bg-v2-ink-900">
          <div className="v2-mesh" aria-hidden><span /><span /><span /></div>
          <div className="v2-container relative py-14 md:py-16">
            <nav aria-label="Breadcrumb" className="v3-meta">
              <a data-journey="page" href="/" className="hover:text-v2-ink-700">Home</a>
              <span className="v3-meta__rule" aria-hidden />
              <a data-journey="page" href="/blog.html" className="hover:text-v2-ink-700">Guides</a>
              <span className="v3-meta__rule" aria-hidden />
              <span>{d.category.replace(/-/g, ' ')}</span>
            </nav>
            <h1 className="v2-display v2-display--light mt-6 max-w-3xl text-3xl md:text-5xl">
              {heading}
            </h1>
            <p className="v3-meta mt-6">
              <time dateTime={d.date}>{d.date}</time>
              <span className="v3-meta__rule" aria-hidden />
              <span>By the {siteConfig.brand.name} R&amp;D and compliance team</span>
              {d.reviewedBy === 'compliance' && (
                <>
                  <span className="v3-meta__rule" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="shield" size={13} />
                    Reviewed by our compliance team
                  </span>
                </>
              )}
            </p>
          </div>
        </header>

        {/* ---------- body ---------- */}
        <section className="v3-section">
          <div className="v2-container">
            <div className="grid gap-12 lg:grid-cols-[1fr_17rem] lg:gap-16">
              <div className="max-w-2xl">
                {d.body.map((b, i) => {
                  if (b.type === 'lead') {
                    return (
                      <p
                        key={i}
                        className="text-[1.0625rem] font-medium leading-relaxed text-v2-ink-800"
                        dangerouslySetInnerHTML={{ __html: b.html ?? '' }}
                      />
                    );
                  }
                  if (b.type === 'h2') {
                    return (
                      <h2 key={i} className="v2-display mt-12 text-2xl md:text-[1.75rem] first:mt-0">
                        {b.text}
                      </h2>
                    );
                  }
                  if (b.type === 'steps') {
                    return (
                      <ol key={i} className="mt-6 space-y-5">
                        {b.items?.map((s, j) => (
                          <li key={j} className="flex gap-4">
                            <span
                              aria-hidden
                              className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-v2-accent-050 font-mono text-[11px] font-bold text-v2-accent-700 ring-1 ring-v2-accent-100"
                            >
                              {j + 1}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold text-v2-ink-900">{s.title}</span>
                              <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-v2-ink-600">
                                {s.body}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="prose-v2 mt-5"
                      dangerouslySetInnerHTML={{ __html: b.html ?? '' }}
                    />
                  );
                })}

                {/* ---------- FAQ (GEO surface) ---------- */}
                <h2 className="v2-display mt-14 text-2xl md:text-[1.75rem]">Frequently asked</h2>
                <dl className="mt-6 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
                  {d.faq.map((f) => (
                    <div key={f.q} className="grid gap-2 py-5 sm:grid-cols-[15rem_1fr] sm:gap-8">
                      <dt className="text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                        {f.q}
                      </dt>
                      <dd className="text-[0.9375rem] leading-relaxed text-v2-ink-600">{f.a}</dd>
                    </div>
                  ))}
                </dl>

                {/* ---------- sources (E-E-A-T) ---------- */}
                {/*
                  The sources behind this guide.

                  A guide that quotes a specification, a minimum order or an
                  efficacy figure is making a claim. This block says which
                  document the claim comes from, so a buyer can check it and
                  an assistant can cite it - and so the page can be held to
                  what it says. It was the one thing this site did not do:
                  the byline said who wrote it, and nothing said where the
                  facts came from.
                */}
                <section className="mt-14 rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-6 md:p-7">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
                    Sources
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {sources.map((s) => (
                      <li key={s.href} className="flex flex-wrap items-baseline gap-x-2">
                        <a href={s.href} className="v3-link text-sm font-semibold">
                          {s.label}
                        </a>
                        <span className="text-sm text-v2-ink-500">{s.note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* ---------- sidebar ---------- */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                {related.length > 0 && (
                  <div className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                      Related products
                    </p>
                    <ul className="mt-4 space-y-4">
                      {related.map((r) => (
                        <li key={r.p.id}>
                          <a
                            href={productUrl(r.p)}
                            className="group flex items-start gap-3"
                          >
                            <span className="v3-icon-plate v3-icon shrink-0" aria-hidden>
                              <Icon name="bottle" size={16} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-snug text-v2-ink-900 group-hover:text-v2-accent-700">
                                {r.p.name_en}
                              </span>
                              <span className="mt-1 block font-mono text-[11px] tabular-nums text-v2-ink-400">
                                MOQ {r.p.moq.toLocaleString()} · {r.p.lead_time_days_stock} d
                              </span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 rounded-v2-lg border border-v2-accent-300 bg-v2-accent-050 p-5">
                  <p className="text-sm font-semibold text-v2-ink-900">
                    Manufacturing this at volume?
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-v2-ink-500">
                    MOQ from 1,000 sets, 7–15 day stock lead, private label available.
                  </p>
                  <a
                    href="/contact.html"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-v2-md bg-v2-accent-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Get a custom quote
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ---------- more guides ---------- */}
        {ARTICLES.length > 1 && (
          <section className="v3-section bg-v2-ink-050">
            <div className="v2-container">
              <h2 className="text-sm font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                More guides
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {ARTICLES.filter((a) => a.slug !== slug).map((a) => (
                  <li key={a.slug}>
                    <a
                      href={`/blog/${a.category}/${a.slug}.html`}
                      className="v3-card v3-card--interactive block p-5"
                    >
                      <p className="font-mono text-[11px] tracking-[0.12em] text-v2-ink-400">
                        {a.category.replace(/-/g, ' ')}
                      </p>
                      <p className="mt-2 font-semibold leading-snug text-v2-ink-900">{a.title}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>
    </>
  );
}