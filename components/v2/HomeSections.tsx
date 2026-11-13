import type { IconName } from '@/components/v2/Icon';
import { Icon } from '@/components/v2/Icon';
import { ProductCard } from '@/components/v2/ProductCard';
import { V3CardGrid, V3Head } from '@/components/v2/V3';
import { clientProducts, productsById } from '@/lib/client-products';
import { productUrl } from '@/lib/product-routing';
import { imageFor } from '@/lib/packshots';
import { REPORTS } from '@/lib/report-hashes';
import { documents } from '@/lib/shipping';
import { reportsForSku } from '@/lib/commerce';
import { COMPLIANCE_PACK } from '@/content/v2/home';

/**
 * Homepage value props and content gates.
 *
 * These two blocks exist because the hero answers "is this a real factory"
 * and the credential bar answers "can I verify that" — but nothing between
 * them answered "can you actually do what I need". On a search landing page
 * that gap is where the visitor leaves.
 */

export type ValueProp = {
  icon: IconName;
  title: string;
  body: string;
  href: string;
};

export function ValuePropsSection({ items }: { items: ValueProp[] }) {
  return (
    <section className="v3-section--tight">
      <div className="v2-container">
        <V3Head
          title="Four things you can check us on"
          sub="Each one can be tested against a product page, a laboratory report, or a sample."
        />
        <div className="mt-14">
          <V3CardGrid
            columns={4}
            items={items.map((p) => ({
              icon: <Icon name={p.icon} size={20} />,
              title: p.title,
              body: p.body,
              href: p.href,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

export type ContentGate = {
  icon: IconName;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function ContentGatesSection({ items }: { items: ContentGate[] }) {
  return (
    <section className="v3-section--tight">
      <div className="v2-container">
        <V3Head
          title="Sourcing &amp; compliance guides"
          sub="Written by our team for buyers who need the detail before the enquiry."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {items.map((g) => (
            <a
              key={g.href}
              href={g.href}
              className="v3-card v3-card--interactive v3-rise flex flex-col p-7 md:p-9"
            >
              <span className="v3-icon-plate v3-icon" aria-hidden>
                <Icon name={g.icon} size={20} />
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-v2-ink-900">{g.title}</h3>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-v2-ink-500">{g.body}</p>
              <span className="v3-link mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
                {g.cta} <span aria-hidden>&rarr;</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Featured product strip — three SKUs across different lines.
 *
 * Reuses ProductCard verbatim so the homepage grid and the catalogue grid are
 * literally the same component. A buyer comparing them should not be able to
 * tell which page he is on.
 */
export function FeaturedProductsSection({
  ids,
  title = 'Featured product lines',
  sub = 'One from each line. Every card carries its MOQ and lead time — nothing is estimated.',
}: {
  ids: string[];
  /** The head of the section. A page that reuses this block says its own thing. */
  title?: string;
  sub?: string;
}) {
  const cards = ids
    .map((id) => productsById[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="v3-section--tight">
      <div className="v2-container">
        <V3Head title={title} sub={sub} />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((p) => (
            <li key={p.id}>
              <ProductCard
                p={p}
                image={imageFor(p.id)?.src}
                href={productUrl(p)}
                showCategory
              />
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <a data-journey="page" href="/products.html" className="v3-link inline-flex items-center gap-1.5 text-sm font-semibold">
            See all {cards.length > 0 ? `${clientProducts.length} SKUs` : 'products'} <span aria-hidden>&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * THE ATTESTATION STRIP — the one thing on this site a competitor cannot copy.
 *
 * WHY IT IS ON THE HOME PAGE AND NOT ONLY ON ITS OWN PAGE
 * The batch attestations and the published report hashes are a record, not a
 * claim: a hash proves that a file has not changed since the moment it was
 * hashed, and a transaction on a public chain proves that a batch existed.
 * No competitor can publish them, because they are not theirs. They lived on
 * two pages of their own — /attestation.html and the machine-readable
 * /report-hashes.json — and nothing on the home page pointed at either. A
 * buyer who never opened them was looking at a site that reads exactly like
 * the other three.
 *
 * WHAT IT PROVES, AND WHAT IT DOES NOT
 * A hash proves that a file has not been swapped. It does not prove that a
 * product is approved in any market, and the sentence saying so is on the
 * section, not in a footnote elsewhere: a verification section that
 * oversells itself is worse than no verification section at all.
 *
 * THE NUMBERS ARE READ, NEVER TYPED
 * The report count, the file names and the hashes come from the same
 * generated manifest the machine-readable file is written from
 * (lib/report-hashes.ts), so the page and /report-hashes.json cannot
 * disagree about what is published.
 */
export function AttestationSection() {
  const reports = REPORTS;
  const shown = reports.slice(0, 3);

  /*
   * 证据 → 产品：这条线断着。
   *
   * 全站唯一那条真实询盘是买家拿着东西来的；而十份报告里有八份写明
   * "covers P001-P002"——**但 P001 不是链接**。买家读完一份报告，
   * 下一步想知道的是"那这个 SKU 能不能做"，而这句话现在只能靠他自己
   * 回到目录去猜。
   *
   * 映射是算出来的，不是写出来的：目录里的每一条记录问一遍"哪些报告
   * 覆盖我"，答案反过来就是"这份报告覆盖哪些商品"。报告页改了 SKU
   * 覆盖范围，这里自动跟着改；两边不可能对不上。
   */
  const coveredBy = new Map<string, { id: string; name: string }[]>();
  for (const p of clientProducts) {
    for (const r of reportsForSku(p.id)) {
      const list = coveredBy.get(r.number) ?? [];
      if (!list.some((x) => x.id === p.id)) {
        list.push({ id: p.id, name: p.name_en });
      }
      coveredBy.set(r.number, list);
    }
  }

  return (
    <section className="v3-section--tight bg-v2-ink-050">
      <div className="v2-container">
        <V3Head
          title="Every report on this site carries a hash you can check"
          sub={`All ${reports.length} published laboratory reports are listed with the SHA-256 of the exact file this site serves. Download the PDF, compute the hash, compare it — the point of publishing them is that you do not have to take our word for any of it.`}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className="text-[0.9375rem] leading-relaxed text-v2-ink-600">
              A hash is a fingerprint. It proves one thing: that the file in your
              hands is the file that was filed. It does not approve a product for
              any market.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                {
                  label: 'The hashes, machine-readable',
                  detail: 'One JSON file, one entry per published report.',
                  href: '/report-hashes.json',
                  cta: 'Open /report-hashes.json',
                },
                {
                  label: 'The batch attestations',
                  detail: 'Every batch this factory has attested, with its transaction and block.',
                  href: '/attestation.html',
                  cta: 'Read the attestation index',
                },
              ].map((x) => (
                <li key={x.href} className="rounded-v2-lg border border-v2-ink-200 bg-white p-6">
                  <p className="text-sm font-semibold text-v2-ink-900">{x.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">{x.detail}</p>
                  <a href={x.href} className="v3-link mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {x.cta} <span aria-hidden>&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-v2-lg border border-v2-ink-200 bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-v2-ink-200 bg-v2-ink-050">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-v2-ink-500">
                    Report
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-v2-ink-500">
                    SHA-256 of the published file
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const covers = coveredBy.get(r.reportNumber) ?? [];
                  return (
                    <tr key={r.reportNumber} className="border-b border-v2-ink-100 last:border-b-0">
                      <td className="px-5 py-4 align-top">
                        <a
                          href={`/assets/img/certs/${r.fileName}`}
                          className="text-sm font-semibold text-v2-ink-900 hover:underline"
                        >
                          {r.reportNumber}
                        </a>
                        <span className="mt-1 block text-xs leading-relaxed text-v2-ink-500">
                          {r.title}
                        </span>
                        {covers.length > 0 && (
                          <span className="mt-2 block text-xs leading-relaxed text-v2-ink-500">
                            Covers{' '}
                            {covers.map((c) => (
                              <a
                                key={c.id}
                                href={productUrl({ id: c.id })}
                                className="v3-link mr-1.5 font-semibold"
                              >
                                {c.name}
                              </a>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <code className="block break-all font-mono text-[11px] leading-relaxed text-v2-ink-600">
                          {r.sha256}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-v2-ink-200 px-5 py-4 text-sm text-v2-ink-600">
              {reports.length} reports published; three shown here.{' '}
              <a data-journey="page" href="/certifications.html" className="v3-link font-semibold">
                See all {reports.length} with the laboratory named on each
                <span aria-hidden> &rarr;</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * THE COMPLIANCE PACK — what travels with the order, and where each
 * compliance question is answered.
 *
 * WHY IT IS ONE SECTION AND NOT FIVE LINKS
 * The compliance material on this site is spread over five pages: the
 * certifications, the safety data sheets, the standards and sources, the
 * per-market requirements and the trade terms. Each of them answers a
 * different question, and a buyer with a compliance file to satisfy does not
 * know in advance which page holds the answer they need. So the section
 * states the document set that ships with the goods, and then gives the five
 * pages their names — which is the difference between a compliance section
 * and a compliance index.
 *
 * THE DOCUMENT LIST IS THE SHIPPING LIST
 * The per-shipment document set is read from lib/shipping, which is the same
 * source the trade-compliance page and the downloadable trade file are built
 * from. Writing the list out again here would be a second copy that drifts
 * the first time a document is added.
 */
export function CompliancePackSection() {
  return (
    <section className="v3-section--tight">
      <div className="v2-container">
        <V3Head
          title="The paperwork that travels with the order"
          sub="Seven documents are issued against every shipment, and five pages answer the compliance questions that come with them."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
              Issued with every order
            </p>
            <ul className="mt-5 divide-y divide-v2-ink-200 border-y border-v2-ink-200">
              {documents.map((d) => (
                <li key={d} className="flex items-start gap-2.5 py-3.5">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-v2-accent-600" />
                  <span className="text-[0.9375rem] leading-relaxed text-v2-ink-700">{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-v2-ink-500">
              Each is issued against the order, and the packing list names the lot.
            </p>
            {/*
              THE TAP CARD.

              A card with an NFC tag on the back, in the carton. Touch it with
              a phone and this site opens - the same mechanism as the QR code
              on the carton label, with the phone doing the scanning instead
              of the buyer pointing a camera.

              It says what the card is here, because this is the section that
              already describes what travels with the order. A card in a
              warehouse that the buyer cannot explain is a card that gets
              thrown away.

              "It is added on request" is the honest sentence: the card is an
              option on the order, not something that is already in every
              carton.
            */}
            <p className="mt-4 text-sm leading-relaxed text-v2-ink-600">
              The carton can also carry a <strong className="font-semibold text-v2-ink-900">tap card</strong>: touch
              it with a phone and this site opens, where the hash of every batch's laboratory report is published. It is
              added on request.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-v2-ink-500">
              Where each question is answered
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {COMPLIANCE_PACK.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    className="flex h-full flex-col rounded-v2-lg border border-v2-ink-200 bg-white p-5 transition hover:border-v2-accent-500"
                  >
                    <span className="text-sm font-semibold text-v2-ink-900">{c.title}</span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-v2-ink-600">
                      {c.body}
                    </span>
                    <span className="v3-link mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                      {c.cta} <span aria-hidden>&rarr;</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}