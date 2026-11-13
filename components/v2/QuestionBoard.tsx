'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import { QUESTIONS_BOARD_SIZE, type BuyerQuestion } from '@/content/v2/questions';

/**
 * QuestionBoard — the three questions buyers asked most recently, and the
 * form that adds one.
 *
 * HOW THE ROLLING WORKS
 * The visible board is always the newest three. A question asked from here
 * goes to the top and pushes the oldest one out of the visible three; the
 * one that falls off is the one the back office keeps and answers, and its
 * answer is then written into a guide.
 *
 * WHY IT STAYS IN THE BROWSER FOR NOW
 * There is no back end yet — the site is a static export. A question asked
 * here is written to this browser (so the visitor sees it in the board) and
 * handed to WhatsApp, which is the channel the factory already monitors, so
 * the question actually reaches a person. When the order system is live this
 * component swaps its local store for the API; the shape of the data does
 * not change.
 */

const STORE_KEY = 'shenhe:asked-questions:v1';

type Stored = { id: string; question: string; askedAt: string };

export default function QuestionBoard({
  seed,
  size = QUESTIONS_BOARD_SIZE,
}: {
  seed: BuyerQuestion[];
  size?: number;
}) {
  const [asked, setAsked] = useState<Stored[]>([]);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setAsked(JSON.parse(raw));
    } catch {
      /* private mode — the board still shows the seed */
    }
  }, []);

  const list: BuyerQuestion[] = [
    ...asked.map((a) => ({
      id: a.id,
      question: a.question,
      guideHref: '/sourcing-guides.html#markets',
      guideLabel: 'Per-market compliance detail',
      askedAt: a.askedAt,
      answered: false,
    })),
    ...seed,
  ].slice(0, size);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const question = draft.trim();
    if (!question) return;

    const entry: Stored = {
      id: `local-${Date.now()}`,
      question,
      askedAt: new Date().toISOString(),
    };
    const next = [entry, ...asked].slice(0, 20);
    setAsked(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the question still reaches us over WhatsApp */
    }
    setDraft('');
    setSent(true);

    const wa = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(
      `Question for shenhezhongke.com\n\n${question}`,
    )}`;
    window.open(wa, '_blank', 'noopener');
  }

  return (
    <section className="v3-section bg-v2-ink-050" id="questions">
      <div className="v2-container">
        <div className="v3-head">
          <span className="v3-head__dot" aria-hidden />
          <h2 className="v3-head__title">What buyers are asking right now</h2>
          <p className="v3-head__sub">
            The three most recent questions, newest first. A new one pushes the
            oldest out of sight — and the answer gets written into a guide, so
            the next buyer finds it without asking.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {list.map((q) => (
            <li key={q.id} className="v3-card p-6 md:p-7">
              <div className="flex items-center gap-3">
                {q.market && (
                  <span className="font-mono text-[11px] tracking-[0.14em] text-v2-accent-700">
                    {q.market}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    q.answered
                      ? 'bg-v2-accent-050 text-v2-accent-800 ring-1 ring-v2-accent-100'
                      : 'bg-v2-ink-050 text-v2-ink-500 ring-1 ring-v2-ink-200'
                  }`}
                >
                  {q.answered ? 'Answered in the guide' : 'Answer to follow'}
                </span>
              </div>
              <p className="mt-4 text-[0.9375rem] font-semibold leading-snug text-v2-ink-900">
                {q.question}
              </p>
              <a
                href={q.guideHref}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-v2-accent-700 hover:text-v2-accent-800"
              >
                {q.guideLabel}
                <span aria-hidden>→</span>
              </a>
            </li>
          ))}
        </ul>

        {/* ---------- ask ---------- */}
        <form
          id="ask"
          onSubmit={submit}
          className="mt-10 rounded-v2-lg border border-v2-ink-200 bg-white p-6 md:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
            <div className="flex-1">
              <label
                htmlFor="buyer-question"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500"
              >
                Your question
              </label>
              <input
                id="buyer-question"
                name="question"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setSent(false);
                }}
                placeholder="What do you need to know before ordering?"
                className="v2-input"
                maxLength={280}
              />
              <p className="mt-2 text-xs text-v2-ink-400">
                {draft.length}/280 — sent to our sales team on WhatsApp, and shown at the
                top of the board.
              </p>
            </div>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-v2-md bg-v2-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-v2-sm transition-colors hover:bg-v2-accent-700 disabled:opacity-50"
            >
              Ask this question
            </button>
          </div>

          {sent && (
            <p className="mt-5 flex items-start gap-2.5 border-t border-v2-ink-100 pt-5 text-sm text-v2-ink-600">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-v2-accent-600" />
              Asked. Your question is at the top of the board, and a WhatsApp message
              with it is opening — we answer in writing, then add it to the guide.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
