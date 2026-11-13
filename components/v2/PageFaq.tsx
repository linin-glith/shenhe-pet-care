import { faqPageSchema } from '@/lib/seo/schema';

/**
 * The questions a page shows, and the schema that says so.
 *
 * WHY THIS IS A COMPONENT AND NOT A BLOCK
 * A FAQPage schema is a claim: "these questions are answered here". If the
 * page does not show them, the claim is false — a search engine voids the
 * rich result, and an answer engine reading the schema has no way to know
 * whether to trust the schema or the page. Two pages shipped exactly that:
 * the contact page declared six questions from the legacy site and showed
 * twelve others, and the trade terms page declared six questions and showed
 * none of them.
 *
 * WHY IT RENDERS AS WELL AS DECLARES
 * The data is rendered and the schema is generated from the SAME array, so
 * the two cannot drift. A schema built by hand from a copy of the copy is
 * a copy that will be edited.
 *
 * WHY IT TAKES THE QUESTIONS AS A PROP
 * The page knows what it wants to say; this component knows how to say it in
 * a way an engine can lift. Where the questions come from — a local array
 * or the legacy site's own JSON-LD — is the page's business.
 */

export type FaqItem = { q: string; a: string };

export default function PageFaq({
  items,
  title = 'Questions buyers ask',
  lead,
  url,
  name,
}: {
  items: FaqItem[];
  title?: string;
  lead?: string;
  url?: string;
  name?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="v2-section" id="faq">
      <div className="v2-container">
        <h2 className="v2-display text-3xl md:text-4xl">{title}</h2>
        {lead && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-v2-ink-600">{lead}</p>}

        <dl className="mt-8 divide-y divide-v2-ink-100 border-y border-v2-ink-100">
          {items.map((item) => (
            <div key={item.q} className="grid gap-1.5 py-5 sm:grid-cols-[16rem_1fr] sm:gap-8">
              <dt className="text-[0.9375rem] font-semibold text-v2-ink-900">{item.q}</dt>
              <dd className="text-sm leading-relaxed text-v2-ink-600">{item.a}</dd>
            </div>
          ))}
        </dl>

        {/*
          The schema, generated from the array above — the same questions,
          the same answers, in the same order.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqPageSchema(items, { name, url })),
          }}
        />
      </div>
    </section>
  );
}
