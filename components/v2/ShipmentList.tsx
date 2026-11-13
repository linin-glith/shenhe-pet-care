'use client';

/**
 * The shipments and where each one is.
 *
 * A tracking number is only useful next to the carrier and the dates, so all
 * three travel together. The route is shown because the port of loading and
 * the port of destination are what a buyer's own freight forwarder asks for.
 */

import {
  Chip, Empty, Failed, PageHead, formatDate, stageTone, usePortalData, type Shipment,
} from './portal-shared';

type Payload = { shipments: Shipment[] };

export default function ShipmentList() {
  const { state } = usePortalData<Payload>('/api/portal/shipments');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const list = state.data.shipments ?? [];

  if (list.length === 0) {
    return (
      <>
        <PageHead
          title="Shipments"
          lead="Bookings, tracking numbers and the documents issued for each shipment."
        />
        <Empty
          title="Nothing shipped yet"
          body="When your order leaves the factory the booking, the carrier and the tracking number appear here, and the shipping documents are issued to your file list."
          action={{ href: '/portal/orders.html', label: 'See your orders' }}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Shipments"
        lead="Bookings, tracking numbers and the documents issued for each shipment."
      />

      <ul className="mt-8 space-y-5">
        {list.map((s) => (
          <li key={s.id} className="rounded-v2-md border border-v2-ink-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-v2-ink-900">
                {s.shipment_no}
              </span>
              <Chip tone={stageTone(s.status)}>{s.stage?.label ?? s.status}</Chip>
            </div>

            {s.stage?.note && (
              <p className="mt-3 text-sm leading-relaxed text-v2-ink-600">{s.stage.note}</p>
            )}

            <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Order
                </dt>
                <dd className="mt-1 font-mono text-v2-ink-800">{s.order_no}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Carrier
                </dt>
                <dd className="mt-1 text-v2-ink-800">{s.carrier ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Tracking
                </dt>
                <dd className="mt-1 font-mono text-v2-ink-800">{s.tracking_no ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Terms
                </dt>
                <dd className="mt-1 text-v2-ink-800">{s.incoterm ?? '—'}</dd>
              </div>
            </dl>

            <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  From
                </dt>
                <dd className="mt-1 text-v2-ink-800">{s.port_of_loading ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  To
                </dt>
                <dd className="mt-1 text-v2-ink-800">{s.port_of_destination ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Departed
                </dt>
                <dd className="mt-1 text-v2-ink-800">{formatDate(s.etd)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Arriving
                </dt>
                <dd className="mt-1 text-v2-ink-800">{formatDate(s.eta)}</dd>
              </div>
            </dl>

            {s.items && s.items.length > 0 && (
              <div className="mt-5 border-t border-v2-ink-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Contents
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {s.items.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-mono text-xs text-v2-ink-500">{it.sku}</span>
                      <span className="text-v2-ink-800">{it.product_name ?? it.sku}</span>
                      <span className="ml-auto tabular-nums text-v2-ink-600">
                        {it.qty.toLocaleString()} units
                      </span>
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
