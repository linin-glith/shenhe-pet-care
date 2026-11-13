import {
  documents,
  freight,
  incoterms,
  productionLead,
  shippingChannels,
  tracking,
} from '@/lib/shipping';

/**
 * Shipment & Logistics — the section a buyer needs once the order is placed.
 *
 * WHY A WHOLE SECTION
 * The three questions that lose the order were the three the site never
 * answered: when do I get a tracking number, which channel should I use,
 * and what will the freight cost. Each is answered here with a number, and
 * the one thing that cannot be answered on a static site — the freight rate
 * for a specific lane — is stated as a quote rather than left out.
 *
 * EVERYTHING IT SHOWS COMES FROM lib/shipping.ts, which reads
 * content/v2/shipping.json. The downloadable TRADE-COMPLIANCE.md is
 * generated from the same file.
 */
export default function ShipmentSection() {
  return (
    <section className="v2-section bg-v2-ink-050" id="shipment">
      <div className="v2-container">
        <p className="v2-eyebrow">Shipment &amp; logistics</p>
        <h2 className="v2-display mt-4 max-w-3xl text-3xl md:text-4xl">
          After the order number: your tracking document, your channel, your freight.
        </h2>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ---------------- tracking ---------------- */}
          <div>
            <h3 className="v2-display text-xl md:text-2xl">When you get a tracking number</h3>
            <p className="mt-5 rounded-v2-md border-l-2 border-v2-accent-500 bg-white px-5 py-4 text-sm leading-relaxed text-v2-ink-600">
              {tracking.flow}
            </p>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">What the number is</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{tracking.document}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">When it is issued</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{tracking.issuance}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">The one earlier case</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{tracking.samples}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">What you can track</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{tracking.howToUse}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">Before shipment</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">
                  Stock catalogue formulas: {productionLead.stock}. Private label: {productionLead.oem}.
                </dd>
              </div>
            </dl>

            <h3 className="v2-display mt-12 text-xl md:text-2xl">What travels with the goods</h3>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {documents.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-v2-ink-600">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-v2-accent-500" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------- channels + freight ---------------- */}
          <div>
            <h3 className="v2-display text-xl md:text-2xl">Channels and transit time</h3>
            <ul className="mt-6 space-y-4">
              {shippingChannels.map((c) => (
                <li
                  key={c.id}
                  className="rounded-v2-md border border-v2-ink-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[0.9375rem] font-semibold text-v2-ink-900">{c.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-v2-accent-700">
                      {c.transit}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{c.note}</p>
                  {c.doorToDoor && (
                    <p className="mt-2 text-xs font-medium text-v2-accent-700">
                      Customs clearance and duty handled by us.
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="v2-display mt-12 text-xl md:text-2xl">Incoterms and freight</h3>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">Default term</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">
                  {incoterms.default}. {incoterms.note}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">Also quoted</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">
                  {incoterms.available.join(' · ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">How freight is charged</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{freight.basis}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-900">Samples</dt>
                <dd className="mt-1 text-sm leading-relaxed text-v2-ink-600">{freight.samples}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-v2-ink-600">{freight.ddp}</dt>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
