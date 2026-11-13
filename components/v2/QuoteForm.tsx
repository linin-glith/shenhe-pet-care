'use client';

/**
 * The quotation form.
 *
 * WHY IT IS ITS OWN COMPONENT
 * A quotation is written in two places: on the quotations page and in
 * the enquiry panel, where the desk has an enquiry open and wants to
 * quote it without leaving. Two forms would be two forms that could
 * disagree about what a quotation needs - and the disagreements would
 * show up as quotes missing a specification, which is exactly what
 * happened before this was pulled out.
 *
 * WHY THE CATALOGUE IS USED FOR THE SUGGESTIONS
 * The catalogue holds what each SKU is, what it comes in and what its
 * minimum is. The desk should not type those; they should be chosen.
 * The price is the one thing the desk has to type, because it is the
 * one thing that depends on the run.
 *
 * WHY THE PRICE IS NOT SHOWN TO THE BUYER
 * The form is the desk's side. The price goes into the quotation and
 * the quotation is what the buyer opens; the portal decides what a
 * buyer sees, and that is a separate question.
 */

import { useMemo, useState } from 'react';
import { clientProducts as products, type ClientProduct } from '@/lib/client-products';

export type DraftLine = {
  sku: string;
  productName: string;
  minQty: string;
  maxQty: string;
  qty: string;
  unitPrice: string;
  spec: string;
  leadTimeNote: string;
};

export const EMPTY_LINE: DraftLine = {
  sku: '', productName: '', minQty: '', maxQty: '', qty: '', unitPrice: '',
  spec: '', leadTimeNote: '',
};

/**
 * The catalogue, as the form needs it.
 *
 * The client projection, not lib/products: the projection carries the
 * name, the minimum, the specification and the lead time, and it does
 * not carry the internal reference price. Importing the full record
 * here would publish the price to anyone who downloads the page.
 */
const CATALOGUE: ClientProduct[] = products;

export type QuoteFormProps = {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  currency: string;
  onCurrencyChange: (v: string) => void;
  incoterm: string;
  onIncotermChange: (v: string) => void;
  validityDays: string;
  onValidityDaysChange: (v: string) => void;
  leadTimeDays: string;
  onLeadTimeDaysChange: (v: string) => void;
  freight: string;
  onFreightChange: (v: string) => void;
  termsNote: string;
  onTermsNoteChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string;
  /** The products the buyer asked about, offered first. */
  suggested?: string[] | null;
};

export default function QuoteForm(props: QuoteFormProps) {
  const {
    lines, onChange, currency, onCurrencyChange, incoterm, onIncotermChange,
    validityDays, onValidityDaysChange, leadTimeDays, onLeadTimeDaysChange,
    freight, onFreightChange, termsNote, onTermsNoteChange,
    onSubmit, busy, error, suggested,
  } = props;

  /** The catalogue, the buyer's asks first. */
  const options = useMemo(() => {
    const asked = new Set((suggested ?? []).map((s) => String(s).trim()).filter(Boolean));
    const first = CATALOGUE.filter((p) => asked.has(p.id));
    const rest = CATALOGUE.filter((p) => !asked.has(p.id));
    return [...first, ...rest];
  }, [suggested]);

  function setLine(i: number, patch: Partial<DraftLine>) {
    onChange(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }

  /**
   * Choosing a SKU fills in what the catalogue knows, so the desk types
   * only the price and the quantity.
   */
  function chooseSku(i: number, sku: string) {
    const p = CATALOGUE.find((x) => x.id === sku);
    if (!p) {
      setLine(i, { sku, productName: '', minQty: '', maxQty: '', spec: '' });
      return;
    }
    setLine(i, {
      sku: p.id,
      productName: p.name_en,
      minQty: String(p.moq ?? ''),
      maxQty: '',
      qty: lines[i].qty || String(p.moq ?? ''),
      spec: p.specification ?? '',
      leadTimeNote: lines[i].leadTimeNote || `stock: ${p.lead_time_days_stock} days · OEM: ${p.lead_time_days_oem} days`,
    });
  }

  function addLine() {
    onChange([...lines, { ...EMPTY_LINE }]);
  }

  function removeLine(i: number) {
    onChange(lines.filter((_, k) => k !== i));
  }

  const subtotal = lines.reduce(
    (s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0,
  );

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}

      {/* the terms */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-v2-ink-600">
          币种
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm uppercase outline-none focus:border-v2-accent-500"
          >
            {['USD', 'CNY', 'EUR', 'GBP'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-v2-ink-600">
          贸易术语
          <select
            value={incoterm}
            onChange={(e) => onIncotermChange(e.target.value)}
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
          >
            {['FOB', 'CIF', 'EXW', 'DDP'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-v2-ink-600">
          有效期（天）
          <input
            type="number"
            value={validityDays}
            onChange={(e) => onValidityDaysChange(e.target.value)}
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
          />
        </label>
        <label className="block text-xs text-v2-ink-600">
          交期（天）
          <input
            type="number"
            value={leadTimeDays}
            onChange={(e) => onLeadTimeDaysChange(e.target.value)}
            placeholder="与各行交期不同时以行为准"
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
          />
        </label>
        <label className="block text-xs text-v2-ink-600">
          运费
          <input
            type="number"
            step="0.01"
            value={freight}
            onChange={(e) => onFreightChange(e.target.value)}
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
          />
        </label>
        <label className="block text-xs text-v2-ink-600 sm:col-span-3">
          付款条款（买家会看到）
          <input
            value={termsNote}
            onChange={(e) => onTermsNoteChange(e.target.value)}
            placeholder="T/T 30% 定金，尾款见提单副本"
            className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
          />
        </label>
      </div>

      {/* the lines */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
          报价明细
        </p>
        <ul className="mt-2 space-y-3">
          {lines.map((l, i) => (
            <li key={i} className="rounded border border-v2-ink-200 p-3">
              <div className="grid gap-2 sm:grid-cols-4">
                <label className="block text-[11px] text-v2-ink-600">
                  SKU
                  <select
                    value={l.sku}
                    onChange={(e) => chooseSku(i, e.target.value)}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  >
                    <option value="">选择</option>
                    {options.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} · {p.name_en}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] text-v2-ink-600">
                  产品名称
                  <input
                    value={l.productName}
                    onChange={(e) => setLine(i, { productName: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
                <label className="block text-[11px] text-v2-ink-600">
                  数量
                  <input
                    type="number"
                    value={l.qty}
                    onChange={(e) => setLine(i, { qty: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
                <label className="block text-[11px] text-v2-ink-600">
                  单价
                  <input
                    type="number"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
                <label className="block text-[11px] text-v2-ink-600">
                  规格
                  <input
                    value={l.spec}
                    onChange={(e) => setLine(i, { spec: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
                <label className="block text-[11px] text-v2-ink-600 sm:col-span-2">
                  交期说明（这一行的）
                  <input
                    value={l.leadTimeNote}
                    onChange={(e) => setLine(i, { leadTimeNote: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
                <label className="block text-[11px] text-v2-ink-600">
                  起订量
                  <input
                    type="number"
                    value={l.minQty}
                    onChange={(e) => setLine(i, { minQty: e.target.value })}
                    className="mt-1 w-full rounded border border-v2-ink-200 px-2 py-1.5 text-sm outline-none focus:border-v2-accent-500"
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-v2-ink-500">
                  小计 {((Number(l.qty) || 0) * (Number(l.unitPrice) || 0)).toLocaleString('en-US')} {currency}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded border border-v2-ink-200 px-2 py-0.5 text-[11px] text-v2-ink-500 hover:border-amber-400 hover:text-amber-700"
                  >
                    删掉这行
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addLine}
          className="mt-2 rounded border border-v2-ink-200 px-2 py-1 text-[11px] font-semibold text-v2-ink-600 hover:border-v2-ink-400"
        >
          加一行
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-v2-ink-100 pt-3">
        <span className="text-xs text-v2-ink-600">
          货值合计 {subtotal.toLocaleString('en-US')} {currency}
          {Number(freight) > 0 && ` + 运费 ${Number(freight).toLocaleString('en-US')}`}
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="rounded bg-v2-accent-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-v2-accent-700 disabled:opacity-50"
        >
          {busy ? '保存中…' : '保存为草稿'}
        </button>
      </div>
    </div>
  );
}
