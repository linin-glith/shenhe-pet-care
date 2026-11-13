/**
 * The destination markets, in one table.
 *
 * WHY THIS EXISTS
 * "What do I need to sell this in Europe" is the second question a
 * buyer asks, after the price. It was answered on the compliance
 * page as four blocks of prose, one per market.
 *
 * Prose is right for a person reading it. A table is right for an
 * assistant quoting it: the answer to "does the US need a different
 * registration from the EU" is two cells and a sentence, and it can
 * be lifted whole.
 *
 * The rule the table makes visible is the one the site already keeps
 * saying in words: the routes are not interchangeable. A
 * registration for one market is not evidence for another, and the
 * table puts them side by side so that difference is impossible to
 * miss.
 *
 * WHAT IT HOLDS
 * The destination, the route, the documents we prepare, and the
 * thing that stays the buyer's job. That last column is the
 * important one -- a compliance table that only lists what the
 * factory does is a sales table pretending to be a compliance
 * table.
 */
const MARKETS = [
  {
    market: 'United States',
    route: 'FDA establishment registration',
    ours: [
      'Facility registration held and verifiable in the FDA database',
      'Cosmetic GMP and batch records, packaged into a dossier',
      'MSDS / SDS in 16 languages, shipped with every consignment',
    ],
    yours: [
      'Your brand registration and listing -- the factory cannot hold it for you',
      'A Responsible Person in the US market if the label requires one',
      'State-level rules, quoted per destination state',
    ],
  },
  {
    market: 'European Union',
    route: 'GPSR, CLP and REACH -- and a pet-only product is not a cosmetic',
    ours: [
      'The EU responsible-person handover documented, with the technical file behind it',
      'REACH SVHC and BPR documentation assembled from the actual formula',
      'A CPNP dossier and a cosmetic safety report only if the same formula is also sold for human use',
      'Bilingual EN / Chinese label artwork with the mandated information panel',
    ],
    yours: [
      'A Responsible Person inside the EU -- legally your company, so we document the handover',
      'A signed statement of the claims you intend to make',
      'The final artwork approval',
    ],
  },
  {
    market: 'United Kingdom',
    route: 'GPSR and a UK responsible person -- a separate market from the EU',
    ours: [
      'Documentation prepared against UK requirements, not EU ones',
      'Test coordination through SGS, Intertek or Pony Testing',
      'Free Sale Certificate and origin documents',
    ],
    yours: [
      'Your UK Responsible Person',
      'The importer of record',
    ],
  },
  {
    market: 'Australia & New Zealand',
    route: 'APVMA / ARTG, depending on the claim',
    ours: [
      'APVMA registration support, scoped to the claim on the label',
      'NICCAS / AICIS ingredient disclosure generated from our formula records',
      'English-language dossier assembled end to end',
    ],
    yours: [
      'The therapeutic-goods decision, if the product is in ARTG scope',
      'ARTG listing coordination has its own timeline and is scoped separately',
    ],
  },
  {
    market: 'Russia & EAEU',
    route: 'EAC conformity declaration',
    ours: [
      'The largest single destination group we ship to',
      'EAC documentation prepared per product',
      'Free Sale Certificate and origin documents',
    ],
    yours: [
      'The importer of record and the declaration holder',
    ],
  },
  {
    market: 'Brazil',
    route: 'ANVISA notification (cosmetics)',
    ours: [
      'ANVISA notification route for cosmetics, prepared per product',
      'Portuguese label artwork where the claim requires it',
    ],
    yours: [
      'The Brazilian importer of record',
    ],
  },
  {
    market: 'Middle East',
    route: 'GCC market-by-market',
    ours: [
      'Documentation prepared per destination, not for the region as a whole',
      'MSDS / SDS in 16 languages with every consignment',
    ],
    yours: [
      'The importer of record in each market',
    ],
  },
];

export default function MarketTable() {
  return (
    <section className="v3-section">
      <div className="v2-container">
        <div className="max-w-3xl">
          <h2 className="v2-display text-2xl md:text-[1.75rem]">
            Which route your destination uses
          </h2>
          <p className="mt-3 text-[0.975rem] leading-relaxed text-v2-ink-600">
            The routes are not interchangeable. A registration in one market is not
            evidence in another, and we do not present it as such. The last column
            is deliberately the buyer's side of the line: a factory that claims to
            handle everything is a factory that is handling something that legally
            cannot be handled for you.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              The regulatory route, the documents we prepare and the documents that
              stay the buyer's responsibility, for each destination market.
            </caption>
            <thead>
              <tr className="border-b-2 border-v2-ink-300">
                <th scope="col" className="py-3 pr-4 font-semibold">Destination</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Route</th>
                <th scope="col" className="py-3 pr-4 font-semibold">We prepare</th>
                <th scope="col" className="py-3 font-semibold">Stays yours</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => (
                <tr key={m.market} className="border-b border-v2-ink-150 align-top">
                  <th scope="row" className="py-4 pr-4 font-semibold text-v2-ink-900">
                    {m.market}
                  </th>
                  <td className="py-4 pr-4 text-v2-ink-700">{m.route}</td>
                  <td className="py-4 pr-4">
                    <ul className="space-y-1.5">
                      {m.ours.map((x) => (
                        <li key={x} className="text-v2-ink-700">{x}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4">
                    <ul className="space-y-1.5">
                      {m.yours.map((x) => (
                        <li key={x} className="text-v2-ink-700">{x}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-v2-ink-500">
          For a market we have not shipped to before, tell us the destination and we
          will confirm in writing what we can and cannot cover before you commit.
        </p>
      </div>
    </section>
  );
}
