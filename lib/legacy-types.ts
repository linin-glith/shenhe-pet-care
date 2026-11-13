/**
 * Legacy content block model.
 *
 * These types mirror the JSON emitted by `geo-build/legacy2json.py`, which
 * extracts the live static site's `<main>` markup. Every field is derived from
 * shipped HTML — nothing here is hand-invented copy, which is what keeps the
 * SEO baseline reproducible (same h1/h2 text, same word counts).
 *
 * A `richtext` block is the deliberate escape hatch: an unrecognised legacy
 * pattern renders as-is instead of silently disappearing.
 */

export type Bg = 'plain' | 'soft' | 'bg';

export interface Action {
  href: string;
  label: string;
  variant: 'primary' | 'secondary' | 'outlineWhite' | 'ghost' | 'textLink' | 'default';
}

export interface HeroStat {
  value?: string | null;
  label?: string | null;
  unit?: string | null;
  max?: string | null;
  tone?: string;
}

export interface HeroContent {
  title: string | null;
  titleAccent: string | null;
  eyebrow: string | null;
  lead: string | null;
  /**
   * The answer, and the limit of the answer.
   *
   * A headline on this site is a claim; the paragraph under it should
   * be the answer a buyer can act on, and an answer without a limit
   * is a sales line. Both sentences are rendered together so that the
   * answer cannot travel on its own.
   */
  answer?: string | null;
  boundary?: string | null;
  actions: Action[];
  stats: HeroStat[];
  panels: unknown[];
  image: { src?: string; alt?: string } | null;
  html?: string | null;
}

export interface Card {
  kind: 'card' | 'featureCard' | 'productCard';
  href?: string;
  no?: string;
  num?: string;
  tag?: string;
  meta?: string;
  category?: string;
  title?: string;
  size?: string;
  desc?: string;
  cta?: string;
  count?: string;
  stat?: string;
  image?: { src?: string; alt?: string };
  meta_rows?: { key: string; val: string }[];
  metaRows?: { key: string; val: string }[];
  html?: string;
}

export interface TableData {
  head: string[];
  rows: { cells: string[]; highlight: boolean }[];
}

export interface TimelineItem {
  year: string;
  title: string;
  desc: string;
}

export interface PhotoSlot {
  label: string;
  caption: string;
  filename: string;
  size: string;
  img: string | null;
}

export interface Block {
  type:
    | 'hero'
    | 'heroSimple'
    | 'statGrid'
    | 'cardGrid'
    | 'prose'
    | 'table'
    | 'priceTableFlagged'
    | 'timeline'
    | 'process'
    | 'photoSlots'
    | 'cta'
    | 'wizard'
    | 'richtext';
  classes: string;
  bg: Bg;
  content: any;
}

export interface PageHead {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  themeColor: string | null;
  hreflang: { lang: string; href: string }[];
  jsonLd: unknown[];
  hasGtm: boolean;
}

export interface LegacyPage {
  source: string;
  slug: string;
  isPortal: boolean;
  head: PageHead;
  blocks: Block[];
  stats: { blocks: number; richtextFallback: number };
}