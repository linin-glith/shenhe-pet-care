// Register — v2 engine, hand-built.
//
// WHY THIS PAGE IS BUILT BY HAND RATHER THAN CONVERTED
// The old page shipped legacy markup: the labels and the boxes were there,
// but the form had no submit path, no validation and no error state — the
// same hole the sign-in page had. Converted, it rendered as a stack of plain
// text with a "Create account" line that did nothing when it was clicked.
// A register page that looks like a form and is not a form is worse than no
// register page: the buyer believes they have an account and they do not.
//
// WHAT THE FORM DOES
// It creates the account against the API the server actually runs (see
// lib/api-client.ts), signs the buyer in as it goes, and hands them to their
// own inquiries. The address they type is the address their inquiries are
// already filed under, so the account opens onto something real.
//
// SEO is untouched — metadata still comes from the extracted legacy head.
import type { Metadata } from 'next';
import page from '@/content/portal__register.json';
import { legacyMetadata, JsonLd } from '@/components/LegacyPage';
import type { LegacyPage } from '@/lib/legacy-types';
import { Icon, type IconName } from '@/components/v2/Icon';
import { siteConfig } from '@/lib/shenhe.config';
import RegisterForm from '@/components/v2/RegisterForm';
import WhatsAppHelp from '@/components/v2/WhatsAppHelp';

const data = page as unknown as LegacyPage;

export const metadata: Metadata = legacyMetadata(data);

export const dynamic = 'force-static';

/** What the account is for — the same list the sign-in page shows. */
const PERKS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'target',
    title: 'Enquiry progress',
    body: 'Where your quote request is: received, quoted, sampling, or in production.',
  },
  {
    icon: 'chat',
    title: 'Message history',
    body: 'Every answer we have sent you, with the documents behind it, in one place.',
  },
  {
    icon: 'truck',
    title: 'Shipping updates',
    body: 'Bookings, production dates and the shipping documents as they are issued.',
  },
  {
    icon: 'sparkle',
    title: 'Your saved SKUs',
    body: 'The products and sizes you quoted, with the specification you agreed.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd page={data} />

      {/* ---------------- header ---------------- */}
      <section className="on-dark relative overflow-hidden bg-v2-ink-900">
        <div className="v2-mesh" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="v2-container relative py-14 md:py-20">
          <p className="v2-eyebrow v2-eyebrow--light">Customer account</p>
          <h1 className="v2-display v2-display--light mt-5 max-w-3xl text-4xl md:text-6xl">
            Create your account.
          </h1>
          <p className="v2-lead v2-lead--light mt-5 max-w-xl">
            One place for your enquiry progress, our messages and your shipping documents.{' '}
            {siteConfig.response.headline} to a first answer, with or without an account.
          </p>
        </div>
      </section>

      {/* ---------------- form + what an account is for ---------------- */}
      <section className="v2-section">
        <div className="v2-container">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* left: the form */}
            <div>
              <RegisterForm />
            </div>

            {/* right: why sign in, and the no-account path */}
            <div>
              <h2 className="v2-display text-3xl md:text-4xl">What an account gives you</h2>
              <ul className="mt-8 space-y-3">
                {PERKS.map((p) => (
                  <li
                    key={p.title}
                    className="flex items-start gap-4 rounded-v2-md border border-v2-ink-200 bg-white p-5"
                  >
                    <span
                      aria-hidden
                      className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-v2-sm bg-v2-accent-050 text-v2-accent-700 ring-1 ring-v2-accent-100"
                    >
                      <Icon name={p.icon} size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-v2-ink-900">{p.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-v2-ink-500">
                        {p.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 rounded-v2-md border border-v2-ink-200 bg-v2-ink-050 p-6">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-v2-ink-400">
                  Registering is not required
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-v2-ink-600">
                  Asking for a price does not need an account. Send the product, your annual
                  volume and where you ship, and we will quote you — {siteConfig.response.headline},
                  on the channel you pick.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <a
                    href="/contact.html"
                    className="inline-flex items-center gap-2 rounded-v2-md bg-v2-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-v2-accent-700"
                  >
                    Request a quotation
                  </a>
                  <a
                    href="/portal/track.html"
                    className="text-sm font-semibold text-v2-accent-700 underline underline-offset-4"
                  >
                    Track an enquiry without an account
                  </a>
                </div>
              </div>

              <div className="mt-10">
                <WhatsAppHelp
                  title="Trouble creating your account?"
                  body="Message us on WhatsApp and we will create the account for you, or confirm the one you already have."
                  note={`Our number is ${siteConfig.brand.whatsappDisplay}. We reply within one business day.`}
                  prefilled="Hello, I would like to create a customer account."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
