/**
 * The catalogue as a table.
 *
 * WHY THIS EXISTS
 * The twenty SKUs were on the site as cards. A card is a good thing
 * for a person scrolling; it is a bad thing for an assistant reading.
 *
 * An assistant that answers "what is the minimum order for the
 * pet deodorizing spray" has to find one fact among twenty cards,
 * each of which is a layout with a picture, a heading, a chip and a
 * paragraph. A table has the answer in a cell. It can be quoted
 * whole, which is the whole point of writing the page for an engine
 * as well as for a person.
 *
 * The measurement of that is not a guess. The site carried exactly
 * one table in seven key pages, and it was not the table a buyer
 * asks for.
 *
 * WHAT IT HOLDS
 * The same five facts the cards already carry — minimum order,
 * stock lead, OEM lead, pack size, shelf life — plus the HS code,
 * because a buyer clearing customs asks for it in the same breath as
 * the price.
 *
 * WHAT IT DOES NOT HOLD
 * No price. The site does not publish one, and a table is the last
 * place one should turn up.
 */
import { products } from '@/lib/products';
import { productUrl, hasProductPage, LINE_LABEL } from '@/lib/product-routing';

type Row = {
  id: string;
  name: string;
  line: string;
  spec: string;
  moq: number;
  moqUnit: string;
  stock: string;
  oem: string;
  shelf: number;
  hs: string;
  url: string | null;
};

/*
 * The line names come from lib/product-routing.ts. This file used to keep
 * a second copy of the map, and the copy said "Cleansing & Grooming" where
 * the catalogue says "Grooming & Care" — so the catalogue table named a
 * product line differently from the footer, the line page and the AI files.
 * One map, one name.
 */

function rows(): Row[] {
  return products
    .filter((p) => p.status === 'active')
    .map((p) => ({
      id: p.id,
      name: p.name_en,
      line: LINE_LABEL[p.line] ?? p.line,
      spec: p.specification ?? '—',
      moq: Number(p.moq),
      moqUnit: p.moq_unit ?? 'units',
      stock: p.lead_time_days_stock ? `${p.lead_time_days_stock} days` : '—',
      oem: p.lead_time_days_oem ? `${p.lead_time_days_oem} days` : '—',
      shelf: Number(p.shelf_life_months ?? 0),
      hs: p.hs_code ?? '—',
      url: hasProductPage(p.id) ? productUrl(p as never) : null,
    }));
}

export default function SpecTable() {
  const data = rows();
  if (!data.length) return null;

  const lineOf = (r: Row) => r.line;

  return (
    <section className="v3-section">
      <div className="v2-container">
        <div className="max-w-3xl">
          <h2 className="v2-display text-2xl md:text-[1.75rem]">The twenty SKUs, in one table</h2>
          <p className="mt-3 text-[0.975rem] leading-relaxed text-v2-ink-600">
            Every figure below is a commitment, not a range: the minimum order we
            quote, the stock lead time, the lead time for a private-label run, the
            pack size and the shelf life. Prices are quoted against your order.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              The twenty catalogue SKUs with their minimum order, lead times, pack
              size, shelf life and HS code.
            </caption>
            <thead>
              <tr className="border-b-2 border-v2-ink-300">
                <th scope="col" className="py-3 pr-4 font-semibold">SKU</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Product</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Pack</th>
                <th scope="col" className="py-3 pr-4 font-semibold">MOQ</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Stock lead</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Private label</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Shelf life</th>
                <th scope="col" className="py-3 font-semibold">HS code</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-v2-ink-150 align-top">
                  <th scope="row" className="py-3 pr-4 font-mono text-xs font-normal text-v2-ink-500">
                    {r.id}
                  </th>
                  <td className="py-3 pr-4">
                    {r.url ? (
                      <a
                        href={r.url}
                        className="font-medium text-v2-ink-900 underline decoration-v2-ink-300 underline-offset-4 hover:decoration-v2-ink-900"
                      >
                        {r.name}
                      </a>
                    ) : (
                      <span className="font-medium text-v2-ink-900">{r.name}</span>
                    )}
                    <span className="block text-xs text-v2-ink-500">{lineOf(r)}</span>
                  </td>
                  <td className="py-3 pr-4 text-v2-ink-700">{r.spec}</td>
                  <td className="py-3 pr-4 text-v2-ink-900">
                    {r.moq.toLocaleString('en-US')} {r.moqUnit}
                  </td>
                  <td className="py-3 pr-4 text-v2-ink-700">{r.stock}</td>
                  <td className="py-3 pr-4 text-v2-ink-700">{r.oem}</td>
                  <td className="py-3 pr-4 text-v2-ink-700">{r.shelf} months</td>
                  <td className="py-3 font-mono text-xs text-v2-ink-700">{r.hs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-v2-ink-500">
          Lead times are counted from the day the deposit and the label artwork are
          both approved. Every figure is confirmed in the quotation against your
          order — the table is what we quote from, not a substitute for it.
        </p>
      </div>
    </section>
  );
}
