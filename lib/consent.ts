/**
 * The event that re-opens the consent banner.
 *
 * WHY IT IS IN ITS OWN FILE
 * The footer is a server component and the consent gate is a client
 * component. A server component cannot listen for an event, so the
 * footer's "cookie settings" control dispatches one and the gate
 * listens. The name of that event has to be the same string in both
 * places, and a string that has to match in two places belongs in one
 * file — otherwise a rename breaks the withdrawal route and nobody
 * notices, because the banner simply stops re-opening.
 *
 * WHAT IT IS FOR
 * The banner tells the visitor they can change their mind "at any time
 * from the footer". Consent that can only be given and never taken back
 * is not consent: the GDPR asks for withdrawal to be as easy as giving,
 * and a banner that promises a control the page does not have is a
 * claim the page cannot support.
 */
export const OPEN_CONSENT_EVENT = 'shenhe:open-consent';
