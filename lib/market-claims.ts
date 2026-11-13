/**
 * ONE SKU, TWO MARKETS, ONE ANSWER EACH.
 *
 * WHY THIS FILE EXISTS
 * The US fit table was first written inline on /usa. The EU table would have
 * been a copy of it with different legal citations, and the SKU pages need the
 * same two answers in a third place. Three copies of a compliance judgement is
 * three chances to drift apart, and the thing that drifts is the claim — which
 * is the one part a buyer will check against the pack in their hand.
 *
 * So the judgement lives here, once, keyed by SKU id, and the three surfaces
 * read it: /usa, /europe, and the note on every product page.
 *
 * WHAT `claim` IS
 * A quotation of what OUR OWN product page says today, taken from
 * lib/products.json (`function_en`) and from the product copy. It is not a
 * hypothetical: where a row says the claim comes off, the page says it now.
 *
 * WHY `note` IS SHORT
 * These render twenty times per market page. The first draft ran to a full
 * sentence per row and pushed the two market pages under the entity-density
 * floor — the words were ours, the entities were not. A note that fits on one
 * line in a table is read; a note that wraps three times is skipped.
 *
 * WHAT THIS IS NOT
 * Not legal advice and not a registration filing. It is the position we are
 * willing to publish and be held to: what we will and will not print on a pack
 * bound for a given market. Anything narrower is the buyer's adviser's call.
 */

export type MarketPosition = 'ships' | 'off' | 'authorisation' | 'check';

export type MarketEntry = {
  /** Where this SKU stands in that market. */
  position: MarketPosition;
  /** The instrument that decides it, by number — not a link, see below. */
  basis: string;
  /** One sentence a buyer can act on. */
  note: string;
};

export type SkuMarket = {
  /** What the SKU's own page claims today. */
  claim: string;
  us: MarketEntry;
  eu: MarketEntry;
};

/**
 * WHY THE EU CITATIONS CARRY NO HYPERLINK
 *
 * eCFR answers a normal request, so /usa links to the section that decides each
 * rule. EUR-Lex does not: every URL under eur-lex.europa.eu returns HTTP 202
 * with an empty body to a script, and a deliberately fictional regulation number
 * returns the same 202 — so a link there cannot be tested before it ships, and
 * an untested legal link is a dead link waiting for a buyer to find it. The EU
 * rows therefore cite the instrument by number and article, which is what a
 * compliance officer cites anyway, and ECHA's own pages (403 to scripts) are
 * left unlinked for the same reason.
 */
export const SKU_MARKET: Record<string, SkuMarket> = {
  P001: {
    claim: '94.2% ammonia removal, report NACCYH25014722',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'An efficacy claim with a report behind it, not an antimicrobial claim.' },
    eu: { position: 'ships', basis: '(EU) 528/2012 Art. 3(1)(a) — not biocidal', note: 'Odor removal is not biocidal, so no authorisation is needed.' },
  },
  P002: {
    claim: '94.2% ammonia removal, report NACCYH25014722',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Same report as P001; the licking safety assessment is not a kill claim.' },
    eu: { position: 'ships', basis: '(EU) 528/2012 Art. 3(1)(a) — not biocidal', note: 'Same position as P001 at the stronger concentration.' },
  },
  P003: {
    claim: 'Disinfectant & Deodorizing Solution',
    us: { position: 'off', basis: 'FIFRA — 40 CFR 152', note: 'The name is the claim: ship as a cleaner, kill claim only where registered.' },
    eu: { position: 'off', basis: 'BPR (EU) 528/2012, product-type 3', note: 'A kill claim needs a member-state authorisation we do not hold.' },
  },
  P004: {
    claim: 'Targets feline ringworm fungi',
    us: { position: 'off', basis: 'Animal drug — 21 CFR 514', note: 'Treating a fungus is a drug claim; the deodorizing half is fine.' },
    eu: { position: 'off', basis: 'BPR (EU) 528/2012 or VMP (EU) 2019/6', note: 'Veterinary medicine on the animal, biocide on the surface — both need an authorisation.' },
  },
  P005: {
    claim: 'Helps prevent ear mites',
    us: { position: 'off', basis: 'FIFRA / animal drug', note: 'Mite prevention is a FIFRA claim; ear cleaning and wax removal are not.' },
    eu: { position: 'off', basis: 'VMP — (EU) 2019/6 Art. 5', note: 'Preventing mites is a veterinary-medicinal claim; cleaning is not.' },
  },
  P006: {
    claim: 'Reduces plaque and bad breath',
    us: { position: 'off', basis: 'Animal drug — 21 CFR 514', note: 'A dental claim on an animal is a drug claim; the water ships as a supplement.' },
    eu: { position: 'off', basis: 'Feed additives (EC) 1831/2003; VMP for the dental claim', note: 'An oral product is feed, and the dental claim adds a second authorisation.' },
  },
  P007: {
    claim: 'Absorbs and decomposes litter box odor',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Absorption and clumping — no biocidal claim on the page.' },
    eu: { position: 'ships', basis: '(EU) 528/2012 Art. 3(1)(a) — not biocidal', note: 'Physical functions only, so no biocidal authorisation is needed.' },
  },
  P008: {
    claim: 'Absorbs and decomposes litter box odor',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Same formula as P007 at 300 g; no biocidal claim in either pack.' },
    eu: { position: 'ships', basis: '(EU) 528/2012 Art. 3(1)(a) — not biocidal', note: 'Same formula and position as P007, repacked at 300 g.' },
  },
  P009: {
    claim: 'Refill-and-spray format',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'A format bundle; it carries the claim of the bottle it refills.' },
    eu: { position: 'ships', basis: '(EU) 528/2012 Art. 3(1)(a) — not biocidal', note: 'A format bundle, not a new product; the claim travels with the refill.' },
  },
  P010: {
    claim: 'Gentle cleansing + antibacterial',
    us: { position: 'off', basis: 'FIFRA — 40 CFR 152', note: '"Antibacterial" makes it a pesticide; drop it and it ships.' },
    eu: { position: 'off', basis: 'BPR (EU) 528/2012, product-type 3', note: '"Antibacterial" makes it biocidal here too; only the detergent duties remain.' },
  },
  P011: {
    claim: 'Gentle cleansing + antibacterial',
    us: { position: 'off', basis: 'FIFRA — 40 CFR 152', note: 'Same wording as P010, same consequence.' },
    eu: { position: 'off', basis: 'BPR (EU) 528/2012, product-type 3', note: 'Same wording as P010 in the 200 mL pack.' },
  },
  P012: {
    claim: 'Gentle cleansing + conditioning',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Cleansing and conditioning are not drug claims; no change needed.' },
    eu: { position: 'ships', basis: 'Detergents (EC) 648/2004; not a cosmetic under 1223/2009', note: 'No CPSR exists for an animal shampoo; 1223/2009 covers humans only.' },
  },
  P013: {
    claim: 'Antibacterial + mite control',
    us: { position: 'off', basis: 'FIFRA + 21 CFR 514', note: 'Two claims, two registrations we do not hold.' },
    eu: { position: 'off', basis: 'BPR (EU) 528/2012 + VMP (EU) 2019/6', note: 'One biocidal and one veterinary authorisation, then both claims can stand.' },
  },
  P014: {
    claim: 'Waterless cleansing foam',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Spot cleaning only; no claim that needs a registration.' },
    eu: { position: 'ships', basis: 'Detergents (EC) 648/2004', note: 'Cleaning only; the detergent label declaration is the remaining duty.' },
  },
  P015: {
    claim: 'Waterless cleansing foam',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'Same product as P014 in a 300 mL pack.' },
    eu: { position: 'ships', basis: 'Detergents (EC) 648/2004', note: 'Same product and duties as P014, in 300 mL.' },
  },
  P016: {
    claim: 'Cleans pet paws before/after walks',
    us: { position: 'ships', basis: 'No FIFRA claim', note: 'A cleaning claim on paws; nothing to strip.' },
    eu: { position: 'ships', basis: 'Detergents (EC) 648/2004', note: 'A cleaning claim on paws; nothing to strip or authorise.' },
  },
  P017: {
    claim: 'Formulated for pet hair and pet odors',
    us: { position: 'ships', basis: 'CPSC consumer product', note: 'A household detergent, not an animal product.' },
    eu: { position: 'ships', basis: 'Detergents (EC) 648/2004, Annex VII', note: 'Ingredient ranges, allergens above 0.01%, data sheet kept for medical use.' },
  },
  P018: {
    claim: 'Moisturizes and repairs paw pads',
    us: { position: 'check', basis: 'Animal drug — 21 CFR 514, borderline', note: '"Moisturizes" is fine; "repairs" may read as a structure/function claim.' },
    eu: { position: 'check', basis: 'VMP (EU) 2019/6, borderline', note: 'Same borderline here: moisturising is not medicinal, repairing may be.' },
  },
  P019: {
    claim: 'Repels insects during outdoor activities',
    us: { position: 'authorisation', basis: 'FIFRA — 40 CFR 152', note: 'Repellency is a pesticide claim; nothing ships until a registrant holds it.' },
    eu: { position: 'authorisation', basis: 'BPR (EU) 528/2012, product-type 19', note: 'A product-type 19 repellent needs a member-state authorisation first.' },
  },
  P020: {
    claim: 'Repels mosquitoes and insects',
    us: { position: 'authorisation', basis: 'FIFRA — 40 CFR 152', note: 'Same position as P019, and the claim checked hardest at the border.' },
    eu: { position: 'authorisation', basis: 'BPR (EU) 528/2012, product-type 19', note: 'Same position as P019; mosquito claims face the closest check.' },
  },
};

export const MARKET_LABEL: Record<MarketPosition, string> = {
  ships: 'ships as written',
  off: 'claim comes off',
  authorisation: 'needs an authorisation',
  check: 'depends on the wording',
};

/** Where each market's full table lives, so a product page can point at it. */
export const MARKET_PAGE: Record<'us' | 'eu', { name: string; href: string }> = {
  us: { name: 'United States', href: '/usa.html#sku-map' },
  eu: { name: 'European Union', href: '/europe.html#sku-map' },
};

/** Counts for the summary line above each table. */
export function marketCounts(market: 'us' | 'eu'): Record<MarketPosition, number> {
  return Object.values(SKU_MARKET).reduce(
    (acc, row) => {
      acc[row[market].position] += 1;
      return acc;
    },
    { ships: 0, off: 0, authorisation: 0, check: 0 } as Record<MarketPosition, number>,
  );
}
