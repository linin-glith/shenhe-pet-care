/*
 * THE DAY THE SITE'S CONTENT WAS LAST CHANGED.
 *
 * A page carries the date it was last changed, and the honest answer for a
 * page whose content has not been edited since the site was put up is the
 * date the content was last touched.
 *
 * It is written into the markup at build time and it does not move on
 * every build - otherwise every page would look new every day, and a date
 * that changes on its own is not a fact about the content. The date is
 * changed by hand when the content is changed, not by the clock.
 *
 * WHY IT IS ALSO USED AS THE PUBLICATION DATE
 * A page that says when it was published tells a search engine how old the
 * claim is, and a reader how long the page has been standing. The site has
 * one date rather than one per page, and the rule that makes that honest
 * is the rule below.
 *
 * THE RULE: THE DATE IS NEVER EARLIER THAN A PAGE'S EXISTENCE.
 * `datePublished` is the day the site's content was last changed. Every
 * page on the site was published on or before that day, so the date a
 * page publishes is never a day before the page existed - it is the
 * latest day the page could have gone live. That direction is the safe
 * one: a freshness signal that is too old understates a page, and one
 * that is too new overstates it.
 *
 * The date is bumped when the content changes. It was 2026-11-08 and it
 * became 2026-11-12 when the semantic structure and the credentials
 * changed, and 2026-11-13 when the intellectual-property page and the
 * product feed went out.
 *
 * IT IS WRITTEN DOWN ONCE. lib/seo/build-date.ts is the only place the
 * string appears; the report generator and the AI-file builder both read
 * it from here. Three copies of one date is three places for it to drift,
 * and it did.
 */
export const BUILD_DATE = '2026-11-13';
