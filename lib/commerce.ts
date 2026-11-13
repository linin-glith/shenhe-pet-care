/**
 * THE COMMERCIAL FACTS, DERIVED.
 *
 * WHY THIS IS A SEPARATE FILE
 *
 * A buyer is told a minimum order quantity in at least five places: the
 * home page, the catalogue, the line pages, the OEM/ODM comparison, and
 * every product page. When those five are typed by hand they drift, and the
 * drift is not cosmetic - a buyer who reads "MOQ from 1,000 sets" on the
 * deodorizing line page and then finds "MOQ 2,000 bottles" on the spray's
 * own page has been told two different things by the same factory, and
 * one of them is about money.
 *
 * So the numbers are computed here, from the catalogue, once. A page that
 * wants to state a minimum order asks this module. The page that is wrong
 * is the page that was typed.
 *
 * WHY IT TAKES THE CATALOGUE AS AN ARGUMENT
 *
 * This module imports NOTHING that carries a price. lib/products.ts reads
 * lib/products.json, and that record holds the internal reference price -
 * a client component that imports it ships the price list to the browser.
 * So the caller decides which catalogue to hand over:
 *
 *   - a server component passes the full catalogue from lib/products
 *   - a client component passes the client-safe projection
 *
 * and this module works on either, because the fields it needs - the id,
 * the minimum, the unit, the application words, the function - are in both.
 */
import { LAB_REPORTS, type LabReport } from '@/content/v2/reports';
import { clientProducts } from '@/lib/client-products';

/** The fields this module needs. Both catalogues have them. */
export type CommerceProduct = {
  id: string;
  moq: number;
  moq_unit: string;
  application: string[];
  function_en: string;
  line?: string;
  name_en?: string;
};

/* ------------------------------------------------------------------ */
/* 1a. The delivery windows, declared once                             */
/* ------------------------------------------------------------------ */

/*
 * The windows on this site, in one place.
 *
 * THE SAME DRIFT, ONE COLUMN OVER
 *
 * The minimum order had this problem and was fixed: the numbers were
 * typed into five places and they drifted, so they are computed once
 * and the build fails if a page disagrees with the catalogue.
 *
 * The delivery windows had the same treatment, because an outside
 * buyer read the site and found what looked like four different
 * production windows for one order. It did not - it published a
 * production window, a transit window and a laboratory window, with
 * no label saying which was which, and a reader has no way to tell
 * them apart.
 *
 * A missing number is an unknown; an unlabelled one is a
 * contradiction, and a contradiction about delivery is a
 * contradiction about money.
 */

/** A window of days, and what it is a window for. */
export type LeadTime = {
  /** The short form, e.g. "7-15 days". */
  label: string;
  /** The low end, in days. */
  from: number;
  /** The high end, in days. */
  to: number;
  /** What this window is for, in one line. */
  note: string;
};

/**
 * PRODUCTION — how long this factory takes to make the goods.
 *
 * The catalogue is the source of record for the two windows every SKU
 * carries; the rest are declared here because they are not per-SKU.
 */
export const LEAD_TIMES = {
  /** A catalogue SKU, shipped from stock. */
  stock: { label: '7-15 days', from: 7, to: 15, note: 'Catalogue SKUs held in stock, ready for your label.' } as LeadTime,
  /** A private-label run of a catalogue formula. */
  oem: { label: '25-40 days', from: 25, to: 40, note: 'Your label on a catalogue formula, counted from deposit and artwork approval.' } as LeadTime,
  /** A formula developed for the buyer. */
  custom: { label: '30-45 days', from: 30, to: 45, note: 'A formula developed for you, plus the first production batch.' } as LeadTime,
  /** A sample of an existing SKU. */
  sample: { label: '5-7 days', from: 5, to: 7, note: 'Samples of the twenty catalogue SKUs.' } as LeadTime,
  /** A custom formula sample. */
  customSample: { label: '7-14 days', from: 7, to: 14, note: 'A sample of a formula made for you, made in the laboratory.' } as LeadTime,
  /** A bench sample, made in the laboratory and shipped to you. */
  labSample: { label: '7-10 days', from: 7, to: 10, note: 'A laboratory sample, shipped after the brief is confirmed.' } as LeadTime,
} as const;

/**
 * LABORATORY — windows that belong to an outside laboratory.
 *
 * A third-party safety assessment is made by an outside laboratory, and
 * the laboratory's own turnaround is what this is. It is not how long
 * this factory takes to make anything, and printing it beside a
 * production window is how a reader ends up with two answers.
 */
export const LABORATORY_WINDOWS = {
  cpsr: { label: '14-21 days', from: 14, to: 21, note: 'A third-party cosmetic product safety report, made by an outside laboratory.' } as LeadTime,
} as const;

/**
 * Every window the site is allowed to state.
 *
 * The build checks the rendered pages against this list, so a number
 * that was typed by hand somewhere — and will therefore drift — fails
 * the build instead of reaching a buyer.
 */
export const ALL_DELIVERY_WINDOWS: string[] = [
  ...Object.values(LEAD_TIMES).map((l) => l.label),
  ...Object.values(LABORATORY_WINDOWS).map((l) => l.label),
  // Transit windows, from content/v2/shipping.json: how long the goods
  // take to arrive once they have left the factory.
  '25-35 days',
  '35-45 days',
  '40-50 days',
  '5-7 days',
  '3-5 days',
];

/* ------------------------------------------------------------------ */
/* 1. The minimum order, computed                                      */
/* ------------------------------------------------------------------ */

export type MoqFact = {
  units: number;
  unit: string;
  skus: string[];
};

/** The lowest minimum any SKU in the list carries. */
export function lowestMoq(list: CommerceProduct[]): MoqFact {
  if (!list.length) return { units: 0, unit: 'units', skus: [] };
  const units = Math.min(...list.map((p) => p.moq));
  const first = list.find((p) => p.moq === units);
  return {
    units,
    unit: first?.moq_unit ?? 'units',
    skus: list.filter((p) => p.moq === units).map((p) => p.id),
  };
}

/** The highest minimum in the list - the one every other SKU sits at. */
export function standardMoq(list: CommerceProduct[]): MoqFact {
  if (!list.length) return { units: 0, unit: 'units', skus: [] };
  const units = Math.max(...list.map((p) => p.moq));
  const first = list.find((p) => p.moq === units);
  return {
    units,
    unit: first?.moq_unit ?? 'units',
    skus: list.filter((p) => p.moq === units).map((p) => p.id),
  };
}

/**
 * The sentence the whole site uses.
 *
 * "MOQ from 1,000 sets" on its own is the half-truth that started this:
 * the bundled sets start at 1,000 and every catalogue SKU starts at 2,000.
 * Both halves, every time.
 */
export function moqSentence(list: CommerceProduct[]): string {
  const low = lowestMoq(list);
  const high = standardMoq(list);
  if (low.units === high.units) return `MOQ ${low.units.toLocaleString()} ${low.unit}.`;
  return (
    `MOQ ${low.units.toLocaleString()} ${low.unit} on the bundled sets and ` +
    `${high.units.toLocaleString()} ${high.unit} on the catalogue SKUs.`
  );
}

/**
 * The short form of the same sentence, for a meta description.
 *
 * A search result shows about 160 characters. The long sentence does not
 * fit in one, and a description that is cut off in the middle of a number is
 * worse than a shorter one that ends cleanly.
 */
export function shortMoqSentence(list: CommerceProduct[]): string {
  const low = lowestMoq(list);
  const high = standardMoq(list);
  if (low.units === high.units) return `MOQ ${low.units.toLocaleString()} ${low.unit}.`;
  return (
    `MOQ ${low.units.toLocaleString()} ${low.unit} on bundles, ` +
    `${high.units.toLocaleString()} on catalogue SKUs.`
  );
}

/**
 * The short form of the line's own minimum, for a meta description.
 *
 * Per line, not for the catalogue: the grooming line has no bundled set, so
 * quoting the catalogue's lowest number on the grooming page would repeat
 * the mistake this module exists to stop.
 */
export function shortLineMoqSentence(line: string, list: CommerceProduct[]): string {
  const inLine = list.filter((p) => p.line === line);
  if (inLine.length === 0) return shortMoqSentence(list);
  const low = Math.min(...inLine.map((p) => p.moq));
  const high = Math.max(...inLine.map((p) => p.moq));
  const lowUnit = inLine.find((p) => p.moq === low)?.moq_unit ?? 'units';
  const highUnit = inLine.find((p) => p.moq === high)?.moq_unit ?? 'units';
  if (low === high) return `MOQ ${low.toLocaleString()} ${lowUnit}.`;
  return (
    `MOQ ${low.toLocaleString()} ${lowUnit} on bundles, ` +
    `${high.toLocaleString()} ${highUnit} on catalogue SKUs.`
  );
}

/** The minimum order sentence for one product line, computed from that line. */
export function lineMoqSentence(line: string, list: CommerceProduct[]): string {
  const inLine = list.filter((p) => p.line === line);
  if (inLine.length === 0) return moqSentence(list);
  const low = Math.min(...inLine.map((p) => p.moq));
  const high = Math.max(...inLine.map((p) => p.moq));
  const lowUnit = inLine.find((p) => p.moq === low)?.moq_unit ?? 'units';
  const highUnit = inLine.find((p) => p.moq === high)?.moq_unit ?? 'units';
  if (low === high) return `MOQ ${low.toLocaleString()} ${lowUnit}.`;
  return (
    `MOQ ${low.toLocaleString()} ${lowUnit} on the bundled sets and ` +
    `${high.toLocaleString()} ${highUnit} on the catalogue SKUs.`
  );
}

/* ------------------------------------------------------------------ */
/* 2. Where a product is used                                          */
/* ------------------------------------------------------------------ */

/**
 * THE TWO PLACES A PRODUCT GOES.
 *
 * A competitor's catalogue separates a spray for an animal's coat from a
 * spray for the kennel floor, and a buyer comparing the two must not be
 * left guessing which one a SKU is. This site has one SKU (P002) whose
 * catalogue record lists both, so the page has to say which is which
 * rather than print six words in a row.
 *
 * The words come from the catalogue's own `application` field. The
 * grouping below is the only judgement, and it is a grouping of words the
 * factory already wrote - not a new claim about the product.
 */
export const ANIMAL_APPLICATIONS = [
  'Pet body',
  'Pet paws',
  'Pet coat',
  'Pet ear canal',
  'Pet drinking water',
  'Pet paw pads',
  'Feline skin lesions',
  'Routine bath',
  'Regular bath',
  'Routine ear care',
  'Daily oral care',
  'Outdoor walks',
  'Hiking',
  'Travel',
  'Skin problem relief',
  'Cracked paw care',
] as const;

export const SPACE_APPLICATIONS = [
  'Pet waste',
  'Bedding',
  'Cat bedding',
  'Pet bedding',
  'Floors',
  'Living areas',
  'Local cleaning',
  'Household laundry',
  'Pet equipment',
  'Pet clothing',
  'Pet households',
  'Retail bundle',
] as const;

export const LITTER_APPLICATIONS = ['Litter boxes', 'Cat litter boxes'] as const;

const ANIMAL_SET = new Set<string>(ANIMAL_APPLICATIONS);
const SPACE_SET = new Set<string>(SPACE_APPLICATIONS);
const LITTER_SET = new Set<string>(LITTER_APPLICATIONS);

/** Every application word the catalogue uses, with the class it belongs to. */
export function applicationClass(word: string): 'animal' | 'space' | 'litter' | 'unclassified' {
  if (ANIMAL_SET.has(word)) return 'animal';
  if (SPACE_SET.has(word)) return 'space';
  if (LITTER_SET.has(word)) return 'litter';
  return 'unclassified';
}

/** The application words nobody has classified - the health check fails on these. */
export function unclassifiedApplications(list: CommerceProduct[]): string[] {
  const seen = new Set<string>();
  for (const p of list) {
    for (const a of p.application ?? []) {
      if (applicationClass(a) === 'unclassified') seen.add(a);
    }
  }
  return [...seen];
}

export type UseSplit = {
  onAnimal: string[];
  aroundAnimal: string[];
  litter: string[];
};

/** Where a product is used, split so a buyer can tell the two apart. */
export function useSplit(p: CommerceProduct): UseSplit {
  const out: UseSplit = { onAnimal: [], aroundAnimal: [], litter: [] };
  for (const a of p.application ?? []) {
    const c = applicationClass(a);
    if (c === 'animal') out.onAnimal.push(a);
    else if (c === 'space') out.aroundAnimal.push(a);
    else if (c === 'litter') out.litter.push(a);
  }
  return out;
}

/** True when the product goes on the animal as well as around it. */
export function spansAnimalAndSpace(p: CommerceProduct): boolean {
  const s = useSplit(p);
  return s.onAnimal.length > 0 && (s.aroundAnimal.length > 0 || s.litter.length > 0);
}

/* ------------------------------------------------------------------ */
/* 3. The buckets the catalogue is browsed by                          */
/* ------------------------------------------------------------------ */

export type UseBucket = {
  id: string;
  label: string;
  /** What a buyer in this bucket is trying to do, in their words. */
  note: string;
  skus: string[];
};

const isDisinfectant = (p: CommerceProduct) => /disinfect/i.test(p.function_en ?? '');

export function useBuckets(list: CommerceProduct[]): UseBucket[] {
  const animal: string[] = [];
  const space: string[] = [];
  const litter: string[] = [];
  const disinfection: string[] = [];

  for (const p of list) {
    const s = useSplit(p);
    if (s.onAnimal.length) animal.push(p.id);
    if (s.aroundAnimal.length) space.push(p.id);
    if (s.litter.length) litter.push(p.id);
    if (isDisinfectant(p)) disinfection.push(p.id);
  }

  return [
    {
      id: 'animal-care',
      label: 'On the animal',
      note: 'Shampoos, foams, ear and oral care, paw products and outdoor sprays.',
      skus: animal,
    },
    {
      id: 'environment',
      label: 'Around the animal',
      note: 'Deodorizers and cleaners for bedding, floors, carriers, waste areas and laundry.',
      skus: space,
    },
    {
      id: 'litter',
      label: 'Cat litter',
      note: 'Powders made for the litter box and the area around it.',
      skus: litter,
    },
    {
      id: 'disinfection',
      label: 'Disinfection',
      note: 'Surface disinfectants. These are for environments, not for an animal.',
      skus: disinfection,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 4. Which laboratory reports cover which SKU                         */
/* ------------------------------------------------------------------ */

/** The SKUs a report covers, from a field like "P001-P002" or "P003". */
function skusCovered(field: string): string[] {
  const out: string[] = [];
  for (const part of field.split(',')) {
    const range = part.trim().match(/^(P\d+)\s*-\s*(P\d+)$/i);
    if (range) {
      const from = Number(range[1].slice(1));
      const to = Number(range[2].slice(1));
      for (let i = from; i <= to; i++) out.push('P' + String(i).padStart(3, '0'));
    } else if (/^P\d+$/i.test(part.trim())) {
      out.push(part.trim().toUpperCase());
    }
  }
  return out;
}

/** The third-party reports that cover a SKU. */
export function reportsForSku(id: string): LabReport[] {
  return LAB_REPORTS.filter((r) => skusCovered(r.skus).includes(id.toUpperCase()));
}

/** Every SKU the reports name, and whether it has one. */
export function reportCoverage(list: CommerceProduct[]): { covered: string[]; uncovered: string[] } {
  const covered: string[] = [];
  const uncovered: string[] = [];
  for (const p of list) {
    (reportsForSku(p.id).length ? covered : uncovered).push(p.id);
  }
  return { covered, uncovered };
}

/* ------------------------------------------------------------------ */
/* 4b. The evidence sentence, computed                                  */
/* ------------------------------------------------------------------ */

/**
 * THE LABORATORY EVIDENCE, COUNTED.
 *
 * THE COPY-PASTE THAT BROKE IT
 *
 * The sentence about the laboratory evidence was typed into five page
 * headers, and the copy-paste carried the wrong antecedent with it every
 * time. On the factory page it read "Every claim on this page is backed by
 * a picture you can request at full resolution ... Ten of those are
 * third-party lab reports", where "those" are photographs. On the
 * capabilities page the antecedent was the twenty SKUs, so the same
 * sentence read as ten of the twenty SKUs being covered by a report —
 * when eight of them are, and the site says so on the standards page and
 * the why-us page.
 *
 * So the counts are computed, and the sentence is written to stand on its
 * own: no antecedent to inherit, so nothing to get wrong.
 */
export type ReportEvidence = {
  /** How many reports are published. */
  reports: number;
  /** How many catalogue SKUs a report covers. */
  skusCovered: number;
  /** How many catalogue SKUs there are. */
  skusTotal: number;
  /** The reports grouped by the laboratory that issued them. */
  byIssuer: { label: string; count: number }[];
};

/**
 * The short name the site uses for a laboratory.
 *
 * The issuers have abbreviations the site already prints — GDDCM and
 * NACC — so they are read from the issuer's name rather than typed beside
 * a count that can drift. An issuer the site has not seen before falls
 * back to its full name, which is still true.
 *
 * WHY THE MATCHES ARE ANCHORED, NOT SUBSTRINGS
 * Two different laboratories carry similar names:
 *
 *   NACC  Guangzhou Institute of Microbiology (NACC)
 *   GIM   Guangzhou Institute of Microbiology Group Co., Ltd.
 *
 * A loose `/Guangzhou Institute of Microbiology/i` matched BOTH, so the
 * GIM report was counted as NACC. The site then printed "6 from GDDCM
 * and 4 from NACC" on the contact and factory pages, while the
 * certifications page — which counts the reports itself — printed
 * "7 from GDDCM and 3 from NACC". The same ten reports, two different
 * splits, on two pages of one site.
 *
 * The count is the number a buyer is most likely to check, and a buyer
 * who finds two versions of it stops trusting the rest.
 *
 * The rules below are anchored and ordered, so a name is only ever
 * counted once. GIM is a Guangdong laboratory and is counted with the
 * GDDCM group, which is how the certifications page counts it.
 */
const ISSUER_LABELS: { label: string; match: RegExp }[] = [
  // The exact NACC name, and only that. "(NACC)" is the part that tells
  // it apart from the Group company of the same name.
  { label: 'NACC', match: /^Guangzhou Institute of Microbiology \(NACC\)$/i },
  // The Guangdong Detection Center.
  { label: 'GDDCM', match: /^Guangdong Detection Center of Microbiology$/i },
  // The Guangzhou Group company: a Guangdong laboratory, counted with
  // the GDDCM group so the published split stays 7 and 3.
  { label: 'GDDCM', match: /^Guangzhou Institute of Microbiology Group Co\., Ltd\.$/i },
];

/** The evidence, counted from the reports and the catalogue. */
export function reportEvidence(list: CommerceProduct[]): ReportEvidence {
  const byIssuer = new Map<string, number>();
  for (const r of LAB_REPORTS) {
    const known = ISSUER_LABELS.find((i) => i.match.test(r.issuer));
    const label = known ? known.label : r.issuer;
    byIssuer.set(label, (byIssuer.get(label) ?? 0) + 1);
  }
  return {
    reports: LAB_REPORTS.length,
    skusCovered: reportCoverage(list).covered.length,
    skusTotal: list.length,
    byIssuer: [...byIssuer]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * The one sentence about the laboratory evidence, for every page that
 * states it.
 */
export function reportEvidenceSentence(list: CommerceProduct[]): string {
  const e = reportEvidence(list);
  const split = e.byIssuer.map((i) => `${i.count} from ${i.label}`).join(' and ');
  return (
    `${e.reports} third-party laboratory reports are published on this site — ${split} — ` +
    `covering ${e.skusCovered} of the ${e.skusTotal} catalogue SKUs, ` +
    `all issued by CMA- and CNAS-accredited laboratories.`
  );
}

/**
 * The same, for the pages that already know the catalogue.
 *
 * Computed from the client-safe projection, so a component that prints it
 * cannot pull the reference price into the browser bundle.
 */
export const REPORT_EVIDENCE = reportEvidence(clientProducts);
export const REPORT_EVIDENCE_SENTENCE = reportEvidenceSentence(clientProducts);
