'use client';

/**
 * The buyer's orders.
 *
 * WHAT IS DELIBERATELY ABSENT
 * The unit price and the order total. The API does not select those columns,
 * so there is nothing here to strip — and nothing for a later change to
 * forget to strip. A buyer sees what was ordered, where it is, and when we
 * have promised to ship it. The price is a conversation between the buyer and
 * the sales manager, not a line on a page.
 */

import {
  Chip, Empty, Failed, PageHead, formatDate, orderedQty, shippedQty, stageTone,
  usePortalData, type Order,
} from './portal-shared';
import { BANK_DETAILS, hasBankDetails } from '@/lib/bank-details';

type Payload = { orders: Order[] };

export default function OrderList() {
  const { state } = usePortalData<Payload>('/api/portal/orders');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const list = state.data.orders ?? [];

  if (list.length === 0) {
    return (
      <>
        <PageHead
          title="Orders"
          lead="Your orders, the stage each is at and the date we have promised to ship."
        />
        <Empty
          title="No orders yet"
          body="Once you have confirmed a quotation it becomes an order and appears here, with its production stage and the shipping documents."
          action={{ href: '/portal/inquiry.html', label: 'See your enquiries' }}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Orders"
        lead="Your orders, the stage each is at and the date we have promised to ship."
      />

      <ul className="mt-8 space-y-5">
        {list.map((o) => (
          <li key={o.id} className="rounded-v2-md border border-v2-ink-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-v2-ink-900">{o.order_no}</span>
              <Chip tone={stageTone(o.status)}>{o.stage?.label ?? o.status}</Chip>
            </div>

            {o.stage?.note && (
              <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">{o.stage.note}</p>
            )}

            <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Promised ship date
                </dt>
                <dd className="mt-1 text-v2-ink-800">
                  {formatDate(o.promised_ship_date)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Quantity
                </dt>
                <dd className="mt-1 text-v2-ink-800">
                  {o.total_qty.toLocaleString()} units
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Terms
                </dt>
                <dd className="mt-1 text-v2-ink-800">{o.incoterm ?? '—'}</dd>
              </div>
            </dl>

            {/*
              HOW TO PAY.
              *
              * The buyer pays by bank transfer, into the company's
              * account, in the currency of the order. There is no card
              * and no gateway here on purpose: a buyer in Moscow or
              * São Paulo wiring money to a Chinese factory sends it to
              * a bank account, and what they need from us is whose
              * name the account is in and the reference to put on the
              * transfer.
              *
              * The details are read from one file, so the page, the
              * quotation email and the order documents cannot disagree
              * about where the money goes.
              */}
            <div className="mt-5 border-t border-v2-ink-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                How to pay
              </p>
              {hasBankDetails() ? (
                <>
                  <div className="mt-3 space-y-4">
                    {BANK_DETAILS.accounts.map((a) => (
                      <div key={a.label} className="rounded-v2-sm border border-v2-ink-100 bg-v2-ink-050/40 p-4 text-sm">
                        <p className="font-semibold text-v2-ink-900">{a.label}</p>
                        <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="text-v2-ink-400">Account name</dt>
                            <dd className="text-v2-ink-800">{a.beneficiary}</dd>
                          </div>
                          {a.bank && (
                            <div>
                              <dt className="text-v2-ink-400">Bank</dt>
                              <dd className="text-v2-ink-800">{a.bank}{a.branch ? ` — ${a.branch}` : ''}</dd>
                            </div>
                          )}
                          {a.accountNumber && (
                            <div>
                              <dt className="text-v2-ink-400">Account number</dt>
                              <dd className="font-mono text-v2-ink-800">{a.accountNumber}</dd>
                            </div>
                          )}
                          {a.swift && (
                            <div>
                              <dt className="text-v2-ink-400">SWIFT / BIC</dt>
                              <dd className="font-mono text-v2-ink-800">{a.swift}</dd>
                            </div>
                          )}
                          {a.iban && (
                            <div>
                              <dt className="text-v2-ink-400">IBAN</dt>
                              <dd className="font-mono text-v2-ink-800">{a.iban}</dd>
                            </div>
                          )}
                          {a.reference && (
                            <div>
                              <dt className="text-v2-ink-400">Transfer reference</dt>
                              <dd className="text-v2-ink-800">{a.reference}</dd>
                            </div>
                          )}
                        </dl>
                        {a.note && <p className="mt-2 text-xs text-v2-ink-600">{a.note}</p>}
                      </div>
                    ))}
                  </div>
                  {BANK_DETAILS.terms && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-v2-ink-600">
                      {BANK_DETAILS.terms.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">
                  {BANK_DETAILS.fallback}
                </p>
              )}
            </div>

            {/*
              THE BATCHES, AND THE PROOF.
              *
              * The buyer has to see that the batch they are receiving was
              * attested, and has to be able to check it without trusting
              * us. So the transaction is linked, and the wording says
              * exactly what the chain proves: this report has not been
              * changed since it was recorded.
              */}
            {o.batches && o.batches.length > 0 && (
              <div className="mt-5 border-t border-v2-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Batches and chain attestation
                </p>
                <ul className="mt-3 space-y-3">
                  {o.batches.map((bt) => {
                    const live = bt.onchain_status === 'attested' && bt.onchain_tx_hash;
                    const explorer = bt.onchain_chain === 'base'
                      ? 'https://basescan.org'
                      : 'https://sepolia.basescan.org';
                    return (
                      <li key={bt.id} className="rounded-v2-sm border border-v2-ink-100 bg-v2-ink-050/40 p-4 text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-mono text-xs text-v2-ink-600">{bt.batch_no}</span>
                          <span className="font-medium text-v2-ink-800">{bt.product_name ?? bt.sku}</span>
                          <span className="text-v2-ink-500">{bt.qty.toLocaleString()} units</span>
                        </div>
                        {live ? (
                          <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                            <span className="font-semibold">Attested on {bt.onchain_chain === 'base' ? 'Base' : 'Base Sepolia'}.</span>{' '}
                            The laboratory report for this batch has not changed since it was recorded. Check it yourself:{' '}
                            <a
                              href={explorer + '/tx/' + bt.onchain_tx_hash}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono underline underline-offset-2"
                            >
                              {bt.onchain_tx_hash?.slice(0, 18)}… (block {bt.onchain_block})
                            </a>
                          </p>
                        ) : bt.onchain_status === 'simulated' ? (
                          <p className="mt-2 text-xs leading-relaxed text-amber-800">
                            <span className="font-semibold">Attestation prepared, not yet written to the chain.</span>{' '}
                            The report hash has been computed and recorded on our side; no transaction has been sent yet.
                          </p>
                        ) : (
                          <p className="mt-2 text-xs leading-relaxed text-v2-ink-500">
                            The attestation for this batch has not been written yet. The laboratory report is available
                            in your documents.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {o.lines && o.lines.length > 0 && (
              <div className="mt-5 border-t border-v2-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  What is in it
                </p>
                <ul className="mt-3 space-y-2">
                  {o.lines.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                      <span className="font-mono text-xs text-v2-ink-500">{l.sku}</span>
                      <span className="font-medium text-v2-ink-800">
                        {l.product_name ?? l.sku}
                      </span>
                      <span className="text-v2-ink-500">{l.spec}</span>
                      <span className="ml-auto tabular-nums text-v2-ink-700">
                        {orderedQty(l).toLocaleString()} units
                        {shippedQty(l) > 0 && (
                          <span className="ml-2 text-emerald-700">
                            {shippedQty(l).toLocaleString()} shipped
                          </span>
                        )}
                      </span>
                      {l.lead_time_note && (
                        <span className="w-full text-xs text-v2-ink-500">
                          {l.lead_time_note}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
