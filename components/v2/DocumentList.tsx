'use client';

/**
 * The buyer's files.
 *
 * A file is fetched through /api/portal/files/:id, which checks that this
 * buyer owns the row before it sends a byte. The stored path never appears
 * in the response, so it cannot be guessed or walked.
 */

import {
  Empty, Failed, PageHead, formatDate, usePortalData, type DocumentRow,
} from './portal-shared';

type Payload = { documents: DocumentRow[] };

export default function DocumentList() {
  const { state } = usePortalData<Payload>('/api/portal/documents');

  if (state.kind === 'loading') {
    return <p className="py-16 text-sm text-v2-ink-500">Loading…</p>;
  }
  if (state.kind === 'error') {
    return <Failed message={state.message} status={state.status} />;
  }

  const list = state.data.documents ?? [];

  if (list.length === 0) {
    return (
      <>
        <PageHead
          title="Documents"
          lead="Invoices, packing lists, bills of lading and certificates, as they are issued."
        />
        <Empty
          title="No documents yet"
          body="Shipping and compliance documents are issued against an order and appear here as soon as they are ready. Message us on WhatsApp if you need one sooner."
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Documents"
        lead="Invoices, packing lists, bills of lading and certificates, as they are issued."
      />

      <ul className="mt-8 divide-y divide-v2-ink-100 rounded-v2-md border border-v2-ink-200 bg-white">
        {list.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-v2-ink-900">{d.title}</p>
              <p className="mt-0.5 text-xs text-v2-ink-500">
                {d.label}
                {d.order_no ? ` · ${d.order_no}` : ''}
                {d.issued_at ? ` · issued ${formatDate(d.issued_at)}` : ''}
              </p>
            </div>
            {d.download_url ? (
              <a
                href={d.download_url}
                className="rounded-v2-md border border-v2-ink-200 px-4 py-2 text-xs font-semibold text-v2-ink-700 transition-colors hover:border-v2-accent-500 hover:text-v2-accent-700"
              >
                Download
              </a>
            ) : (
              /* No file yet. The link used to point at /portal/documents/<id>,
                 a page that does not exist, so every Download button in this
                 list led to a 404. A document that has not been issued says
                 so instead of pretending to be downloadable. */
              <span className="rounded-v2-md border border-dashed border-v2-ink-200 px-4 py-2 text-xs font-medium text-v2-ink-400">
                Not issued yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
