'use client';

/**
 * The footer's cookie-settings control.
 *
 * WHY IT IS A SEPARATE FILE
 * The footer is a server component — it prints the legal row on every
 * page and has no state. A control that listens for a click is a client
 * component, and the only way to have one inside a server component is
 * to give it its own file. The label arrives as a prop because the words
 * belong to the language of the page, and the footer already knows its
 * language.
 *
 * WHY IT DISPATCHES AN EVENT INSTEAD OF CALLING THE GATE
 * The gate lives in the root layout, far above the footer, and it holds
 * the decision. There is no shared state between them, and there should
 * not be: one decision, one owner. The event is the message between
 * them — the footer says "open the panel", and the gate decides what
 * that means.
 */
import { OPEN_CONSENT_EVENT } from '@/lib/consent';

export default function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="text-white/60 transition-colors hover:text-white"
    >
      {label}
    </button>
  );
}
