/**
 * The translation lookup.
 *
 * WHY A FUNCTION AND NOT A CONTEXT
 * Most of the site is made of server components, and a server component
 * cannot read a React context — the context exists on the client. So the
 * lookup is a plain function that takes a locale and returns the strings
 * for that locale. A client component that needs the same thing uses the
 * useTranslation hook in the client file below.
 *
 * WHY A FALLBACK TO ENGLISH
 * A key that is missing from a translation should still show the reader
 * something rather than the word "undefined". The build checks that every
 * key is present, so the fallback is a safety net for a key added between
 * the check and the deploy, not a way of leaving a gap.
 */

import { de } from './de';
import { es } from './es';
import { en, type Dictionary, type TranslationKey } from './dictionary';
import { DEFAULT_LOCALE, type Locale, type TranslatedLocale } from './config';

/**
 * The dictionaries that exist.
 *
 * Keyed by TRANSLATED locale, not by every planned one: a locale without a
 * dictionary has no strings to look up, and typing the map as if it had one
 * would be a lie the compiler could not catch.
 */
const DICTIONARIES: Record<TranslatedLocale, Dictionary> = {
  en,
  de,
  es,
};

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/**
 * The strings for a locale.
 *
 * A locale that is planned but not published falls back to English, which is
 * what a build that asks for a language before it is finished should get.
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale as TranslatedLocale] ?? en;
}

/**
 * A lookup function for a locale.
 *
 * The variables are substituted into the string with {name}. A key that is
 * missing falls back to the English string, and a variable that is missing
 * is left in place rather than printing "undefined" in the middle of a
 * sentence.
 */
export function getT(locale: Locale): Translate {
  const dict = getDictionary(locale);
  const fallback = en;

  return (key, vars) => {
    const template = dict[key] ?? fallback[key] ?? String(key);
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
      const value = vars[name];
      return value === undefined || value === null ? whole : String(value);
    });
  };
}

/**
 * The dictionary for a locale, as a plain object, for the client.
 */
export function clientDictionary(locale: Locale): Dictionary {
  return getDictionary(locale);
}

export { DEFAULT_LOCALE };
export type { TranslationKey };
