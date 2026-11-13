/**
 * The locales, and the rules for reading one.
 *
 * WHY THE DEFAULT IS ENGLISH AND NOT A LOCALE PREFIX
 * The English pages are the ones that already exist, they are the ones in
 * the sitemap, and their addresses are the ones other sites link to. Moving
 * them under /en/ would break every one of those links for no benefit. So
 * English stays at the root and the other languages sit beside it.
 *
 * WHY THE LOCALE IS READ FROM THE PATH AND NOT FROM A COOKIE
 * A cookie or a header makes the same address serve different content to
 * different people, which a search engine cannot index and a crawler cannot
 * follow. A language has to be part of the address or it does not exist.
 */

export const LOCALES = ['en', 'es', 'pt', 'ar', 'ru', 'de', 'ja', 'ko'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * THE LANGUAGES THAT ARE PUBLISHED — the ones a reader can actually reach
 * a page in.
 *
 * WHY THIS IS A SEPARATE LIST FROM THE PLAN AND FROM THE TRANSLATIONS
 * Eight languages are the plan. Translated and published are different
 * states, and the difference is what a search engine sees.
 *
 * A locale that is in LOCALES but not here is a language the site is being
 * BUILT in. It must not appear in the hreflang block, in the language
 * switcher, or in a sitemap, until its pages are actually translated:
 * declaring "/ru/products.html" to be the Russian version of a page that
 * is still in English is a worse signal than having no Russian version at
 * all — it teaches the engine that this site's alternates are unreliable.
 *
 * German and Spanish had a complete dictionary before they had a single
 * page, which is why the two lists are separate: a language whose strings
 * are ready but whose pages are not would be a URL that serves English,
 * and declaring that to a search engine is worse than having no alternate
 * at all.
 *
 * THEY ARE NOT PUBLISHED NOW, AND THAT IS A DELIBERATE DECISION.
 *
 * The German and Spanish pages were published as the English pages
 * rendered with a translated dictionary behind them: the navigation, the
 * breadcrumbs, the metadata, the FAQ and the product card fields were in
 * the buyer's language, and the body was English. Measured on
 * 2026-10-29, 104 language pages took 64% of the crawl weight, repeated
 * the English body 1.9 times, and brought in no human visitor at all —
 * 274 requests, of which 207 were this site's own deployment script and
 * the crawlers.
 *
 * Worse than the weight was the signal. hreflang and the sitemap said
 * "this is the German page", a German buyer arrived, found English and
 * left, and the page that had promised a German version was devalued. A
 * page that says it is German and then answers in English is worse than
 * no German page, because it takes the English page's own standing down
 * with it.
 *
 * So the language pages are withdrawn from publication. The routes, the
 * dictionaries, the translated SKU fields, the FAQ translations and the
 * translation pipeline all stay in the repository — the whole of the
 * translation work is one switch away, and the German and Spanish pages
 * come back the day the body is translated and not before.
 *
 * A language joins this list when its routes exist AND its body is in
 * that language. Not before.
 */
export const PUBLISHED_LOCALES = ['en'] as const;

export type PublishedLocale = (typeof PUBLISHED_LOCALES)[number];

/**
 * The languages whose strings are done: the dictionary is complete.
 *
 * A language here can go live the moment its routes exist — that is the
 * only thing left to do for it.
 */
export const TRANSLATED_LOCALES = ['en', 'de', 'es'] as const;

export type TranslatedLocale = (typeof TRANSLATED_LOCALES)[number];

/** The language every page falls back to. */
export const DEFAULT_LOCALE: Locale = 'en';

/** The published languages other than the default get a prefix. */
export const PREFIXED_LOCALES = PUBLISHED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  ar: 'Arabic',
  ru: 'Russian',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
};

/** What the language is called in that language, for the switcher. */
export const LOCALE_NATIVE: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  ru: 'Русский',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  pt: 'pt-BR',
  ar: 'ar',
  ru: 'ru',
  de: 'de',
  ja: 'ja',
  ko: 'ko',
};

/** The Open Graph locale, which uses a language and a region. */
export const LOCALE_OG: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  ar: 'ar_AR',
  ru: 'ru_RU',
  de: 'de_DE',
  ja: 'ja_JP',
  ko: 'ko_KR',
};

/**
 * Is this locale published — does it have pages behind it?
 *
 * Used by the switcher, the hreflang block and the sitemap generator, all
 * three of which must offer only the languages a reader can actually read.
 */
export function isPublishedLocale(value: string | undefined | null): value is PublishedLocale {
  return !!value && (PUBLISHED_LOCALES as readonly string[]).includes(value);
}

/**
 * Is this a locale we know?
 *
 * The check is against the list rather than a pattern, so a path segment
 * that merely looks like a locale is not treated as one.
 */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Read the locale out of a path segment.
 *
 * The default locale is the absence of a prefix, so an unprefixed path is
 * English and never "unknown".
 */
export function localeFromSegment(segment: string | undefined | null): Locale {
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

/**
 * Add the prefix to a path, or leave it alone.
 *
 * The default locale gets no prefix, so the English site keeps the
 * addresses it already has.
 */
export function withLocale(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}`;
  return `/${locale}${clean}`;
}

/**
 * Remove the prefix from a path.
 *
 * Used when a link is built from a path that may already carry one, so
 * that a link built for English and then given a locale does not end up
 * with two prefixes.
 */
export function stripLocale(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const parts = clean.split('/').filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) {
    return '/' + parts.slice(1).join('/');
  }
  /*
   * THE LANGUAGE HOME PAGE IS A FILE.
   *
   * The static export writes /de as /de.html, because the route is a
   * catch-all and a catch-all expands to a file rather than a directory.
   * So the German home page is "/de.html" and not "/de/index.html" - and
   * the first segment of that path is "de.html", which is not a locale.
   *
   * Without this branch, reading the locale off "/de.html" said "English",
   * and the client - which sees the real browser URL, not the route - then
   * re-rendered the German home page with English navigation and with
   * English marked as the current language.
   */
  if (parts.length === 1 && parts[0].endsWith('.html')) {
    const name = parts[0].slice(0, -'.html'.length);
    if (isLocale(name)) return '/';
  }
  return clean;
}

/**
 * The locale of a path that may or may not carry a prefix.
 */
export function localeOfPath(path: string): Locale {
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) return parts[0];
  /*
   * "/de.html" is the German home page - a FILE, because the static export
   * writes a catch-all route as a file. The build knows the route ("/de"),
   * so the prerendered page was right; the client only has the browser URL
   * ("/de.html"), and it said "English". The two disagreed, and the client
   * won after hydration: the German home page came up with English
   * navigation and with English underlined in the language switcher.
   */
  if (parts.length === 1 && parts[0].endsWith('.html')) {
    const name = parts[0].slice(0, -'.html'.length);
    if (isLocale(name)) return name;
  }
  return DEFAULT_LOCALE;
}

/**
 * The address of a page in one language.
 *
 * The router's pathname has no file extension - it reports
 * "/blog/howto/how-to-choose-a-pet-shampoo" for a page that lives at
 * "/blog/howto/how-to-choose-a-pet-shampoo.html". Every address on this
 * site carries the extension, because the site is a static export whose
 * URLs are files, and a link without the extension is a 404.
 *
 * The language home pages are /de.html and /es.html, because the static
 * export writes that route as a file rather than a directory - so
 * /de/index.html would be a 404.
 *
 * It lives here rather than in the switcher because the hreflang links
 * need exactly the same mapping, and two answers to "what is this page's
 * address in German" is how a site ends up advertising a URL that 404s.
 */
export function pageAddress(pathname: string, locale: Locale): string {
  const stripped = stripLocale(pathname);
  const isHome = stripped === '/' || stripped === '/index.html';
  if (isHome) {
    return locale === DEFAULT_LOCALE ? '/' : `/${locale}.html`;
  }
  const withExt = stripped.endsWith('.html') ? stripped : `${stripped}.html`;
  return locale === DEFAULT_LOCALE ? withExt : `/${locale}${withExt}`;
}

/**
 * The same page in another language.
 *
 * The path is taken apart and put back together, so switching from
 * /de/products/pet-shampoo to Spanish gives /es/products/pet-shampoo rather
 * than /es/de/products/pet-shampoo.
 */
export function switchLocale(path: string, to: Locale): string {
  return withLocale(stripLocale(path), to);
}

/**
 * The alternative languages of a page, for the hreflang links.
 *
 * Every language points at the same path in its own prefix, and the
 * default locale points at the unprefixed path.
 *
 * ONLY THE PUBLISHED ONES. A language that is planned but not translated
 * has no pages behind it, and advertising it here would be a promise the
 * site cannot keep.
 */
export function alternateLinks(path: string): { locale: Locale; href: string }[] {
  return PUBLISHED_LOCALES.map((locale) => ({
    locale,
    href: `https://shenhezhongke.com${pageAddress(path, locale)}`,
  }));
}
