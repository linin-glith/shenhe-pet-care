'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import { whatsappLink } from '@/lib/contact-links';
import { clientProducts, productLines, productsById } from '@/lib/client-products';
import { apiRecordInquiry } from '@/lib/api-client';
import { getT } from '@/lib/i18n';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';
import { journeyForEnquiry } from '@/components/v2/JourneyMarker';
import { deadlineLabel } from '@/lib/response-deadline';

/**
 * InquiryForm — the end of the conversion chain, built to not lose leads.
 *
 * WHY THIS IS A CLIENT COMPONENT AT ALL
 * The previous markup posted to `/api/inquiries`, an endpoint that does not
 * exist. Every enquiry from the previous four builds of this site ended in a
 * 404. A B2B site that cannot receive its own enquiries is not a funnel, it
 * is a brochure.
 *
 * THE THREE-LAYER GUARANTEE
 *   1. VALIDATE  — inline, on blur and on submit, in the buyer's language.
 *   2. QUEUE     — the payload is written to localStorage BEFORE any network
 *      call, so a closed laptop, a failed request or a dead endpoint still
 *      leaves the enquiry recoverable on the next visit.
 *   3. HAND OFF  — the enquiry is handed to WhatsApp as a pre-written message.
 *      WhatsApp is a channel the factory already monitors, so this route
 *      cannot silently vanish the way a POST to a missing API does.
 *
 * The form is honest about what it is: it does not claim to have emailed
 * anyone. It says what actually happened.
 */

type Values = {
  product: string;
  volume: string;
  contact: string;
  company?: string;
  /** The SKU the buyer picked, by id. Optional - the free text still works. */
  sku: string;
  /** How many units. Optional; the minimum order is shown under it. */
  quantity: string;
  /** Where the goods are going: country or region. */
  market: string;
  /** The trade term the buyer has in mind. */
  incoterm: string;
  /**
   * What kind of buyer this is.
   *
   * The same factory answers a first order, a repeat order and a
   * distributor differently: a first order needs a sample and a
   * price tier, a repeat order needs a booking slot, a distributor
   * needs wholesale terms, a brand needs a formulation brief and a
   * clinic needs a technical file. So the question is asked once, at
   * the top, and the quotation and the follow-up are both written for
   * the right case instead of being discovered later.
   */
  customerType: string;
};

/**
 * Is this address an email address?
 *
 * The same test the validation uses, so that a value which passed the
 * validation cannot fail the split into the email and phone columns. If the
 * two tests ever disagreed, a buyer could pass the form and still have
 * their enquiry refused by the API.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

/**
 * THE IDEMPOTENCY KEY.
 *
 * Two presses of the button carry the same words, and two enquiries do
 * not. So the key is a digest of what the buyer wrote: the same enquiry
 * always produces the same key, and the server can recognise a repeat.
 *
 * A digest rather than a counter, because a counter would have to
 * survive a reload to protect the buyer who reloads the page and presses
 * send again - and the thing that survives a reload is the content, not
 * a number.
 */
function enquiryKey(parts: string[]): string {
  const canonical = parts.join('\u001f');
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0') + '-' + canonical.length.toString(16);
}
type Errors = Partial<Record<keyof Values, string>>;
type Status = 'idle' | 'sending' | 'recorded' | 'queued' | 'handed-off';

const QUEUE_KEY = 'shenhe:inquiry-queue:v1';

/**
 * THE BUYER TYPES.
 *
 * Each one changes what the desk does next, which is the test for
 * whether a type belongs in the list: a type that does not change
 * the answer is noise on the form.
 *
 * - a first order needs a sample, a tier and a lead time
 * - a repeat order needs a booking slot and the last specification
 * - a distributor needs wholesale terms, a territory and a volume
 *   commitment
 * - a brand needs a formulation brief, a label and a regulatory file
 * - a clinic or a groomer needs a technical sheet and the safety data
 * - a buyer of an existing specification needs the certificate that
 *   matches their market
 *
 * The site sells only to businesses, so the list is of business
 * situations and there is no "consumer" on it.
 */
const CUSTOMER_TYPES = [
  'A first private-label order',
  'A repeat order for a product we already make',
  'A distributor or wholesaler',
  'A brand with its own formulation to match',
  'A grooming salon or veterinary clinic buying for use',
  'A buyer with an existing specification to match',
  'Something else — I will explain below',
];

/** The trade terms the site quotes. EXW Shenzhen is the default. */
const INCOTERMS = [
  'EXW Shenzhen (default)',
  'FOB Guangzhou / Shenzhen',
  'CIF',
  'DDP',
  'Not sure — advise me',
];

const VOLUMES = [
  'Under 50,000 bottles',
  '50,000–200,000 bottles',
  '200,000–500,000 bottles',
  'Above 500,000 bottles',
];

/** Rules live in one place so the message and the check cannot drift apart. */
function validate(v: Values): Errors {
  const e: Errors = {};

  const product = v.product.trim();
  if (!product) e.product = 'Tell us what you need — e.g. "pet shampoo, private label"';
  else if (product.length < 6) e.product = 'A little more, please — the product, the size or the packaging';

  if (!v.volume) e.volume = 'Pick a rough quantity so we can quote the right tier';

  if (v.quantity.trim() && !/^\d+$/.test(v.quantity.trim())) {
    e.quantity = 'A whole number of units, please — 2000, not "about two thousand"';
  } else if (v.quantity.trim() && Number(v.quantity.trim()) < 1) {
    e.quantity = 'At least one unit';
  }

  const c = v.contact.trim();
  if (!c) e.contact = 'We need an email address, a WhatsApp number or a phone number, or we cannot reply';
  else if (!looksLikeEmail(c) && !/^\+?[\d\s()-]{7,}$/.test(c)) {
    e.contact = 'That does not look like an email address or a phone number — check it';
  }

  return e;
}

function message(v: Values) {
  return [
    `New enquiry — shenhezhongke.com`,
    ``,
    `Product / project: ${v.product.trim()}`,
    `Estimated volume:    ${v.volume}`,
    v.sku ? `SKU:                 ${v.sku}` : null,
    v.quantity.trim() ? `Quantity:           ${v.quantity.trim()} units` : null,
    v.market.trim() ? `Ship to:             ${v.market.trim()}` : null,
    v.incoterm ? `Trade term:           ${v.incoterm}` : null,
    `Contact:              ${v.contact.trim()}`,
    v.company?.trim() ? `Company:              ${v.company.trim()}` : null,
    ``,
    `(sent from the website form)`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
}

/**
 * Where this enquiry came from.
 *
 * The server has had a column for this since the inquiry table was
 * made, and it keeps whatever it is sent. Nothing was ever sent, so
 * every enquiry so far says "contact_form" and nothing more - which
 * means there is no way to tell a search engine from a link somebody
 * sent.
 *
 * Four things are recorded, all of them facts and none of them
 * invented:
 *
 *   page      the page the form was sent from - which product page,
 *             which guide, which landing page
 *   referrer  where the visitor came from, as the browser reports it
 *   utm       the campaign parameters, when the link carried any
 *   skus      the products the form was on, by their ids
 *
 * The referrer is taken as the browser gives it. It is not a
 * measurement of anything - a visitor can set it, and a link inside a
 * chat app carries none - but it is what is available, and a column
 * that is empty tells nobody anything at all.
 */
function sourceDetail(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof window === 'undefined') return out;

  // the page
  try {
    out.page = window.location.pathname;
  } catch {
    /* a browser that will not say where it is gets no page */
  }

  // the referrer
  try {
    const r = document.referrer;
    if (r) out.referrer = r.slice(0, 300);
  } catch {
    /* no referrer */
  }

  // the campaign parameters
  try {
    const q = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = q.get(k);
      if (v) utm[k] = v.slice(0, 120);
    }
    if (Object.keys(utm).length) out.utm = utm;
  } catch {
    /* no parameters */
  }

  /*
   * THE JOURNEY
   *
   * The campaign the visitor arrived with is kept for thirty days, so
   * it is still here when the form is sent three pages later. And the
   * marks on the links they clicked are kept with it, so the desk can
   * see the road the buyer took - which product, which guide, which
   * button - not just the page they wrote from.
   */
  try {
    const j = journeyForEnquiry();
    if (j.source) {
      out.utm = {
        ...(out.utm ?? {}),
        utm_source: j.source,
        ...(j.medium ? { utm_medium: j.medium } : {}),
        ...(j.campaign ? { utm_campaign: j.campaign } : {}),
        ...(j.term ? { utm_term: j.term } : {}),
      };
    }
    if (j.steps && j.steps.length) out.journey = j.steps.slice(-20);
    if (j.first_seen) out.first_seen = j.first_seen;
  } catch {
    /* a browser that will not say where it came from gets no journey */
  }

  return out;
}

export default function InquiryForm({
  presetProduct,
  presetVolume,
  locale = DEFAULT_LOCALE,
}: {
  presetProduct?: string;
  presetVolume?: string;
  locale?: Locale;
}) {
  const t = getT(locale);
  const [values, setValues] = useState<Values>({
    product: presetProduct ?? '',
    volume: presetVolume ?? '',
    contact: '',
    company: '',
    sku: '',
    quantity: '',
    customerType: '',
    market: '',
    incoterm: '',
  });
  /** The minimum order of the SKU the buyer picked, from the record. */
  const pickedMoq = values.sku ? productsById[values.sku]?.moq : undefined;
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  /** True when the server recognised this as an enquiry it already holds. */
  const [duplicate, setDuplicate] = useState(false);
  /*
   * THE SECOND PRESS OF THE BUTTON.
   *
   * React state is not a lock: two clicks in the same tick both read the
   * same old state, so both pass a check written against it. A ref is
   * changed in place and read in the same turn, so it holds the line -
   * while one submission is in flight, the next one does not start. The
   * server recognises a repeat as well, but a buyer should never have
   * to be told about it twice.
   */
  const submittingRef = useRef(false);
  const [carried, setCarried] = useState<string[]>([]);
  /*
   * Two signals that a robot cannot produce.
   *
   * A human reads the questions and types. A robot fills every field
   * it can find and submits. Both facts are used here, and neither
   * costs the buyer anything: no third-party script, no puzzle, no
   * consent question, no delay in the page.
   *
   *   - the hidden field: a bot that fills every input it sees fills
   *     this one too. A human never sees it, so never fills it.
   *   - the clock: a human needs a few seconds to read and answer.
   *     A bot needs a fraction of one.
   */
  const [trap, setTrap] = useState('');
  const [openedAt] = useState(() => Date.now());
  /** The SKU ids this enquiry is about — what the back office will see. */
  const [carriedIds, setCarriedIds] = useState<string[]>([]);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (presetProduct) setValues((v) => ({ ...v, product: v.product || presetProduct }));
  }, [presetProduct]);

  /**
   * THE HAND-OFFS — and why they are read here, on the client.
   *
   * Two of them now:
   *
   *   ?range=P003,P007,…  the SKU composer sent its selection
   *   ?about=P012         the chat entry sent ONE product
   *
   * The contact page used to read the parameter in a server component
   * through `searchParams`, which is dead on a static export: the page is
   * rendered once at build time with no query string, so the parameter
   * arrived in the browser and nobody was there to read it. The buyer who
   * spent two minutes composing landed on an empty form.
   *
   * So the parameters are read in the browser, where they actually exist, and
   * the ids are written out as product names — "P003" means nothing to the
   * person typing.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // One product, from the chat entry.
    const about = params.get('about');
    if (about) {
      const lines = productLines([about]);
      if (lines.length && lines[0] !== about) {
        setCarried(lines);
        setCarriedIds([about]);
        setValues((v) => ({ ...v, product: v.product || lines[0] }));
        return;
      }
    }

    // A selection, from the composer.
    const raw = params.get('range');
    if (!raw) return;
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;

    const lines = productLines(ids);
    setCarried(lines);
    setCarriedIds(ids);
    setValues((v) => ({
      ...v,
      product: v.product || `Composed range:\n${lines.map((l) => `· ${l}`).join('\n')}`,
    }));
  }, []);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (touched[k]) setErrors(validate(next));
  };

  const blur = (k: keyof Values) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();

    const found = validate(values);
    setErrors(found);
    setTouched({ product: true, volume: true, contact: true });

    if (Object.keys(found).length > 0) {
      liveRef.current?.focus();
      return;
    }

    /*
     * THE SECOND PRESS OF THE BUTTON.
     *
     * React state is not a lock: two clicks in the same tick both read
     * the same old state, so both pass a check written against it. A
     * ref is changed in place and read in the same turn, so it holds
     * the line - while one submission is in flight, the next one does
     * not start.
     */
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      /*
       * THE TRAP.
       *
       * A bot that fills every field it can see fills the hidden one
       * too. A human never sees it, so it is never filled. This is the
       * signal worth acting on, and the enquiry is simply not sent.
       */
      if (trap !== '') {
        setStatus('idle');
        return;
      }

      /*
       * THE CLOCK, WAITED OUT RATHER THAN USED TO THROW THE ENQUIRY AWAY.
       *
       * The two-second rule is there to tell a robot from a person. A
       * robot can wait two seconds; a person cannot type a product, pick
       * a volume and write an address in two seconds. The rule therefore
       * almost never fires for a real buyer - and when it did fire, the
       * enquiry was dropped with no message at all, which lost a real
       * buyer for nothing. The old comment here promised that the
       * WhatsApp hand-off still ran; the code returned before it.
       *
       * Now the clock costs a robot two seconds and costs a buyer
       * nothing: the submission waits out the remainder and then goes
       * out as it is.
       */
      const elapsed = Date.now() - openedAt;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }

      setStatus('sending');

      // Persist FIRST. Anything after this point is best-effort.
      let queued = false;
      try {
        const prev = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
        // The queue keeps the address as the buyer typed it. If the request
        // below fails, the copy in the queue is still a complete enquiry.
        prev.push({ at: new Date().toISOString(), ...values });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(prev));
        queued = true;
      } catch {
        /* private mode / quota — WhatsApp hand-off below is the fallback */
      }

      /*
       * Record it in the back office.
       *
       * Until now an enquiry left the site as a WhatsApp message and nothing
       * else: no row, no product, no quantity — so "the back office can see
       * the basic information" was not a feature waiting to be built, it was
       * information that was never captured. With the API running, the enquiry
       * is written as a lead WITH the products it is about and the quantity
       * asked for.
       *
       * If the API is not there (the static preview, a server that is down),
       * the WhatsApp hand-off below still happens and nothing is lost — the
       * enquiry simply is not in the system yet.
       */
      const ids = carriedIds;
      // The SKU ids go as ids, not as names. The back office reads them against
      // the catalogue; sending a formatted string would make the enquiry
      // unreadable by a filter and impossible to match to an order line.
      // The contact field is one box the buyer may fill with an email address
      // or with a phone number. The API asks for one or the other, so the
      // address goes in the column it belongs to. Putting it in the name
      // column is what made every enquiry from this form fail.
      const contact = values.contact.trim();
      const isEmail = looksLikeEmail(contact);
      // The SKU the buyer picked joins the ones the composer carried, so the
      // desk reads a list of SKUs either way.
      const skuIds = [...new Set([...ids, ...(values.sku ? [values.sku] : [])])];
      const quantity = values.quantity.trim() ? Number(values.quantity.trim()) : undefined;
      const recorded = await apiRecordInquiry({
        products: skuIds,
        email: isEmail ? contact : undefined,
        phone: isEmail ? undefined : contact || undefined,
        company: values.company || undefined,
        country: values.market.trim() || undefined,
        quantity: Number.isFinite(quantity) && quantity! > 0 ? quantity : undefined,
        incoterm: values.incoterm && values.incoterm !== 'Not sure — advise me'
          ? values.incoterm
          : undefined,
        // The buyer type goes to the desk as it was chosen. The last
        // entry is "something else", and that one is worth keeping in
        // the answer to the buyer's own words rather than as a label,
        // so it is passed through as well.
        customerType: values.customerType || undefined,
        /*
         * THE ANNUAL VOLUME.
         *
         * The form refuses the submission without it - and then dropped it
         * here, so it never reached the api, never reached the table and
         * never reached the notice. The desk had to ask again for a
         * number the buyer had already typed.
         */
        volume: values.volume || undefined,
        message: values.product,
        source: 'contact_form',
        source_detail: { ...sourceDetail(), skus: skuIds },
        /*
         * THE KEY, AND THE TWO SIGNALS THE SERVER CHECKS AS WELL.
         *
         * The key is a digest of what the buyer wrote, so the same
         * enquiry always carries the same key and the server can
         * recognise a repeat of it.
         *
         * The two fields below are the bot signals the server already
         * looks for: the hidden field, and how long the form was open.
         * They were never sent, which left the server's own check
         * dormant - a request that reached the api without them could
         * not be judged at all. The clock has already been waited out
         * above, so the age sent here is a true one.
         */
        idempotency_key: enquiryKey([
          contact,
          values.product.trim(),
          values.volume,
          values.company?.trim() ?? '',
          values.market.trim(),
          values.incoterm,
          values.customerType,
          values.quantity.trim(),
          [...skuIds].sort().join(','),
        ]),
        company_website: trap,
        form_age_ms: Date.now() - openedAt,
      });

      const wa = whatsappLink({
        product: values.product || undefined,
        quantity: values.volume || undefined,
        note: [
          contact ? `Contact: ${contact}` : null,
          values.company?.trim() ? `Company: ${values.company.trim()}` : null,
          values.customerType ? `Buyer type: ${values.customerType}` : null,
        ]
          .filter(Boolean)
          .join('\n') || undefined,
        page: 'a pet care OEM/ODM project',
      });
      window.open(wa, '_blank', 'noopener');

      // The form does not claim to have recorded anything it did not record.
      // If the API refused the row, the state is "queued" — the enquiry is in
      // this browser and the hand-off to WhatsApp is the live channel — and
      // the message says so.
      setDuplicate(recorded.ok ? Boolean(recorded.data.duplicate) : false);
      setStatus(recorded.ok ? 'recorded' : queued ? 'queued' : 'handed-off');
    } finally {
      submittingRef.current = false;
    }
  }

  /** The day and the hour the answer is due, for the confirmation. */
  const deadline = deadlineLabel();

  const err = (k: keyof Values) => (touched[k] ? errors[k] : undefined);

  return (
    <div>
      <form
        onSubmit={onSubmit}
        noValidate
        data-clarity-mask
        className="rounded-v2-lg border border-v2-ink-200 bg-v2-ink-050 p-7 md:p-9"
      >
        <h2 className="text-xl font-semibold tracking-tight text-v2-ink-900">{t('form.submit')}</h2>
        <p className="mt-2 text-sm text-v2-ink-500">{t('form.messageHint')}</p>

        {/*
          THE PROMISE, WHERE THE BUYER CAN SEE IT BEFORE THEY TYPE.

          It used to appear only in the confirmation message, after the form
          had been sent — which is the one moment it cannot reassure anyone.
          A speed promise is a reason to fill in the form rather than a
          footnote under it, so it sits under the heading, in the same weight
          as the heading, with the working hours next to it: a buyer who
          needs an answer today can see that they will get one today.
        */}
        <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-v2-md border border-v2-accent-300 bg-v2-accent-050 px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-v2-accent-800">
            <Icon name="clock" size={16} />
            We reply {siteConfig.response.headline}
          </span>
          <span className="text-v2-accent-700/80">{siteConfig.response.hours}</span>
        </p>

        {/* Single live region: screen readers announce the first error once. */}
        <p
          ref={liveRef}
          tabIndex={-1}
          role="alert"
          aria-live="polite"
          className="sr-only"
        >
          {Object.values(errors).filter(Boolean)[0] ?? ''}
        </p>

        {/* The trap. Off-screen, not display:none, and not a type the
            browser autofills. A bot that reads the DOM fills it. */}
        <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="inq-company-website">{t('form.company')}</label>
          <input
            id="inq-company-website"
            name="company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
          />
        </div>

        <div className="mt-7 space-y-6">
          {/* ---------- product ---------- */}
          <div>
            {carried.length > 0 && (
              <p className="mb-3 flex items-start gap-2 rounded-v2-md border border-v2-accent-100 bg-v2-accent-050 px-4 py-3 text-xs leading-relaxed text-v2-accent-800">
                <span aria-hidden className="mt-0.5 shrink-0">
                  <Icon name="check" size={14} />
                </span>
                <span>
                  {carried.length === 1
                    ? 'Filled in from the product you were looking at. Edit it if you like.'
                    : `We brought over the ${carried.length} SKUs you picked in the composer. Edit them if you like.`}
                </span>
              </p>
            )}
            <label htmlFor="inq-product" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
              Product or project <span className="text-v2-signal-600">*</span>
            </label>
            <textarea
              id="inq-product"
              name="product"
              rows={3}
              value={values.product}
              onChange={set('product')}
              onBlur={blur('product')}
              aria-invalid={Boolean(err('product'))}
              aria-describedby={err('product') ? 'err-product' : undefined}
              placeholder={'e.g. "pet shampoo, private label"'}
              className={`v2-input resize-y ${err('product') ? 'v2-input--error' : ''}`}
            />
            <FieldError id="err-product" message={err('product')} />
          </div>

          {/* ---------- the SKU and how many ---------- */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="inq-sku" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                Which SKU <span className="font-normal normal-case tracking-normal text-v2-ink-400">(optional)</span>
              </label>
              <select
                id="inq-sku"
                name="sku"
                value={values.sku}
                onChange={set('sku')}
                className="v2-input"
              >
                <option value="">Not sure yet — I will describe it below</option>
                {clientProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_en} — {p.specification}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inq-quantity" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                Quantity <span className="font-normal normal-case tracking-normal text-v2-ink-400">(units)</span>
              </label>
              <input
                id="inq-quantity"
                name="quantity"
                inputMode="numeric"
                value={values.quantity}
                onChange={set('quantity')}
                onBlur={blur('quantity')}
                aria-invalid={Boolean(err('quantity'))}
                aria-describedby={err('quantity') ? 'err-quantity' : undefined}
                placeholder={pickedMoq ? `${pickedMoq.toLocaleString()} units minimum` : 'e.g. 2000'}
                className={`v2-input ${err('quantity') ? 'v2-input--error' : ''}`}
              />
              <FieldError id="err-quantity" message={err('quantity')} />

              {/* The buyer type. It goes first in the desk's reading of
                  the enquiry, because it decides what the answer is:
                  a first order and a repeat order are answered
                  differently, and a distributor is answered differently
                  again. */}
              <label htmlFor="inq-customer-type" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                You are <span className="font-normal normal-case tracking-normal text-v2-ink-400">(optional)</span>
              </label>
              <select
                id="inq-customer-type"
                name="customer_type"
                value={values.customerType}
                onChange={set('customerType')}
                onBlur={blur('customerType')}
                className="v2-input"
              >
                <option value="">Tell us who you are — it changes the answer</option>
                {CUSTOMER_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {pickedMoq && (
                <p className="mt-2 text-xs text-v2-ink-400">
                  The minimum order for this SKU is {pickedMoq.toLocaleString()} units.
                </p>
              )}
            </div>
          </div>

          {/* ---------- volume ---------- */}
          <div>
            <label htmlFor="inq-volume" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
              Estimated annual volume <span className="text-v2-signal-600">*</span>
            </label>
            <select
              id="inq-volume"
              name="volume"
              value={values.volume}
              onChange={set('volume')}
              onBlur={blur('volume')}
              aria-invalid={Boolean(err('volume'))}
              aria-describedby={err('volume') ? 'err-volume' : undefined}
              className={`v2-input ${err('volume') ? 'v2-input--error' : ''}`}
            >
              <option value="">{t('products.spec')}</option>
              {VOLUMES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <FieldError id="err-volume" message={err('volume')} />
          </div>

          {/* ---------- where it is going, and on what terms ---------- */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="inq-market" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                Ship to <span className="font-normal normal-case tracking-normal text-v2-ink-400">(optional)</span>
              </label>
              <input
                id="inq-market"
                name="market"
                list="inq-market-list"
                value={values.market}
                onChange={set('market')}
                placeholder="Country or region"
                autoComplete="country-name"
                className="v2-input"
              />
              <datalist id="inq-market-list">
                {siteConfig.metrics.targetMarkets.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="inq-incoterm" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
                Trade term <span className="font-normal normal-case tracking-normal text-v2-ink-400">(optional)</span>
              </label>
              <select
                id="inq-incoterm"
                name="incoterm"
                value={values.incoterm}
                onChange={set('incoterm')}
                className="v2-input"
              >
                <option value="">No preference</option>
                {INCOTERMS.map((t2) => (
                  <option key={t2} value={t2}>
                    {t2}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---------- contact ---------- */}
          <div>
            <label htmlFor="inq-contact" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
              How should we reply? <span className="text-v2-signal-600">*</span>
            </label>
            <input
              id="inq-contact"
              name="contact"
              value={values.contact}
              onChange={set('contact')}
              onBlur={blur('contact')}
              aria-invalid={Boolean(err('contact'))}
              aria-describedby={err('contact') ? 'err-contact' : undefined}
              placeholder="Work email, WhatsApp number or phone number"
              autoComplete="email"
              className={`v2-input ${err('contact') ? 'v2-input--error' : ''}`}
            />
            <FieldError id="err-contact" message={err('contact')} />
          </div>

          {/* ---------- company (optional) ---------- */}
          <div>
            <label htmlFor="inq-company" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-v2-ink-500">
              Company <span className="font-normal normal-case tracking-normal text-v2-ink-400">(optional)</span>
            </label>
            <input
              id="inq-company"
              name="company"
              value={values.company}
              onChange={set('company')}
              placeholder="So we can send it to the right salesperson"
              autoComplete="organization"
              className="v2-input"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending' || status === 'recorded'}
            className="w-full rounded-v2-md bg-v2-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-v2-sm transition-colors hover:bg-v2-accent-700 disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : status === 'recorded' ? 'Enquiry sent' : 'Send the enquiry'}
          </button>

          <p className="text-center text-xs leading-relaxed text-v2-ink-400">
            A named sales manager answers within one business day, China Standard Time.
          </p>
          <p className="text-center text-xs leading-relaxed text-v2-ink-400">
            WhatsApp opens with your enquiry filled in. {siteConfig.pricing.display}.
          </p>

          {/*
            WHAT HAPPENS TO THE DETAILS, SAID AT THE MOMENT THEY ARE GIVEN.

            A form that asks for a phone number and an email address owes the
            reader one sentence about what happens to them. Not a link to a
            policy page — the sentence, right here, with the policy beside
            it for anyone who wants the full text.
          */}
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs leading-relaxed text-v2-ink-500">
            <Icon name="shield" size={14} className="shrink-0" />
            <span>Your details are used to answer this enquiry and nothing else.</span>
            <a
              href="/privacy.html"
              className="font-semibold text-v2-ink-700 underline underline-offset-4 hover:text-v2-ink-900"
            >
              Privacy policy
            </a>
          </p>
        </div>
      </form>

      {status === 'recorded' && (
        <>
          <Notice
            icon="check"
            title={duplicate ? 'Already received' : 'Enquiry received'}
            body={
              duplicate
                ? 'This is the same enquiry you sent a moment ago. It has not been sent twice, and the same reference applies to it.'
                : `It is in our system with the product and quantity you asked for, and WhatsApp is open with a copy for you. You will get a reference number for it. Our sales team replies within one business day (CST) — by ${deadline.day}, ${deadline.time}.`
            }
          />
          {/*
            THE BUYER MAY WANT TO ASK ABOUT SOMETHING ELSE.

            The button stays disabled once the enquiry is recorded, because
            a live button is what produced two rows out of one enquiry.
            What the buyer gets instead is a way to start again, stated
            in words rather than implied by a greyed-out control.
          */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setDuplicate(false);
                setValues((v) => ({
                  ...v,
                  product: presetProduct ?? '',
                  contact: '',
                  company: '',
                  quantity: '',
                  customerType: '',
                }));
              }}
              className="text-sm font-semibold text-v2-accent-700 underline underline-offset-4 hover:text-v2-accent-800"
            >
              Send another enquiry
            </button>
          </div>
        </>
      )}
      {status === 'queued' && (
        <Notice
          icon="check"
          title="Enquiry saved"
          body="It is stored on this device and pre-filled in WhatsApp, so nothing is lost if you close the page."
        />
      )}
      {status === 'handed-off' && (
        <Notice
          icon="chat"
          title="WhatsApp is open"
          body="Your enquiry is pre-filled — press send. If the window did not open, use the WhatsApp number on the contact card above."
        />
      )}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-xs font-medium text-v2-signal-700">
      <span aria-hidden className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-v2-signal-600" />
      {message}
    </p>
  );
}

function Notice({ icon, title, body }: { icon: 'check' | 'chat'; title: string; body: string }) {
  return (
    <div className="mt-5 flex gap-3 rounded-v2-md border border-v2-accent-100 bg-v2-accent-050 p-5">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-v2-accent-700" />
      <div>
        <p className="text-sm font-semibold text-v2-ink-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-v2-ink-600">{body}</p>
      </div>
    </div>
  );
}
