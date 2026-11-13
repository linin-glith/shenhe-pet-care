import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';

/**
 * THE LINK, AND WHY IT IS NOT NEXT'S
 *
 * Every address on this site ends in .html. That is a decision, not an
 * accident: one address per page, no redirects, and the crawler never has
 * to guess which of two shapes is the real one.
 *
 * Next's client router does not work that way. It maps an address to a
 * ROUTE, and the route here is /contact while the address is
 * /contact.html. So when a reader pressed a link, the router took the
 * click, stopped the browser's own navigation, looked for a route that
 * does not exist - and did nothing at all. The link was dead.
 *
 * It cost the reader twice. The prefetch that goes with the router
 * fetched the WHOLE page of every link in view, once per link, for a
 * navigation that never happened; on a phone that is megabytes of
 * nothing before the reader has read a word.
 *
 * So the site uses plain anchors. The browser fetches the page, the
 * reader gets there, and nothing is downloaded before it is needed.
 *
 * The props are the anchor's own, and the component is named Link so
 * that the places that use it read the same as before.
 */
export default function Link({
  href,
  children,
  ...rest
}: {
  href: string;
  children?: ReactNode;
  /* React 19 hands a ref to a function component as an ordinary prop. */
  ref?: Ref<HTMLAnchorElement>;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
