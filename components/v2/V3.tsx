/**
 * V3 vocabulary components.
 *
 * These are the primitives the pages are re-composed FROM. They exist so the
 * section rhythm is identical everywhere: a centred header with a green dot,
 * hairline-separated card grids, and two-column figure/caption pairs.
 */

export function V3Head({
  title,
  sub,
  dark,
  start,
}: {
  title: string;
  sub?: string;
  dark?: boolean;
  /** Left-aligns the block for sections that sit beside an image. */
  start?: boolean;
}) {
  return (
    <header
      className={[
        'v3-head',
        dark ? 'v3-head--dark' : '',
        start ? 'v3-head--start' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="v3-head__dot" aria-hidden />
      {/* An empty <h2> is still a heading in the document outline. The section
          header is decorative when it has no title, so the element is not
          rendered at all rather than rendered empty. */}
      {title ? <h2 className="v3-head__title">{title}</h2> : null}
      {sub && <p className="v3-head__sub">{sub}</p>}
    </header>
  );
}

export type V3CardItem = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  body?: string;
};

/**
 * Hairline grid of figure/caption pairs.
 *
 * `duo` is the default because a number alone is not information — the pairing
 * is the whole point of the two-column rule.
 */
export function V3DuoGrid({
  items,
  columns = 4,
  dark,
}: {
  items: V3CardItem[];
  columns?: 2 | 3 | 4;
  dark?: boolean;
}) {
  return (
    <dl className={`v3-hairgrid v3-hairgrid--${columns} ${dark ? 'v3-hairgrid--dark' : ''}`}>
      {items.map((it) => (
        <div key={it.label} className="v3-rise flex flex-col">
          {/* THE TERM FIRST, THEN THE FIGURE.
              A definition list is read as "term, then what the term is".
              Putting the figure first gives the reader a number with no
              name attached, and Google's PageSpeed reports that as a
              malformed accessibility tree. The order below is set with CSS
              so the page still LOOKS the same: the figure on top, the
              label under it. */}
          {/* The dark surface is chosen by the SECTION, not by the operating
              system. Tailwind's `dark:` variant follows the OS, so a band that
              is dark on a light desktop would still render its labels in ink
              on its own background — invisible. The variant has to be
              explicit. */}
          <dt
            className={`order-2 mt-3 text-sm font-medium ${
              dark ? 'text-white/80' : 'text-v2-ink-700'
            }`}
          >
            {it.label}
          </dt>
          <dd className="order-1">
            {it.icon && (
              <span className="mb-4 block">
                <span className="v3-icon-plate v3-icon">{it.icon}</span>
              </span>
            )}
            <span className="v3-figure block text-3xl lg:text-4xl">{it.value}</span>
            {it.note && (
              <span className={`mt-1 block text-xs ${dark ? 'text-white/50' : 'text-v2-ink-400'}`}>
                {it.note}
              </span>
            )}
            {it.body && (
              <span className={`mt-2 block text-sm leading-relaxed ${dark ? 'text-white/85' : 'text-v2-ink-500'}`}>
                {it.body}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Card grid with a hairline between neighbours, for prose-shaped content.
 *
 * It is the SAME primitive as V3DuoGrid — a hairline table of facts — so it
 * reuses `.v3-hairgrid` rather than re-implementing a grid. That matters: the
 * padding on the hairline grid's children is what keeps the card copy off the
 * divider, and a hand-rolled `grid gap-px` without that rule renders the title
 * flush against the rule, which reads as broken rather than dense.
 */
export function V3CardGrid({
  items,
  columns = 3,
}: {
  items: { title: string; body?: string; icon?: React.ReactNode; href?: string }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <ul className={`v3-hairgrid v3-hairgrid--${columns}`}>
      {items.map((it, i) => {
        const inner = (
          <>
            {it.icon && <span className="v3-icon-plate v3-icon mb-5">{it.icon}</span>}
            <h3 className="text-[0.9375rem] font-semibold tracking-tight text-v2-ink-900">{it.title}</h3>
            {it.body && <p className="mt-2 text-sm leading-relaxed text-v2-ink-500">{it.body}</p>}
          </>
        );
        return (
          <li key={i} className={`v3-rise ${it.href ? 'v3-card--interactive' : ''}`}>
            {it.href ? (
              <a href={it.href} className="block">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}