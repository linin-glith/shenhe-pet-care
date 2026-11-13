type ProductLike = { id: string; category: string; moq: number; moq_unit: string; lead_time_days_stock: string; lead_time_days_oem: string; shelf_life_months: number; storage: string; sku_oem: string; ingredients_en?: string; };


/**
 * Product page depth — the copy layer that lifts a SKU page from a data sheet
 * to a page a buyer can rank on.
 *
 * WHY THIS EXISTS AND WHY IT IS DERIVED, NOT TYPED
 * A product page carried 583 words of visible text against 800–1,500 on
 * comparable supplier pages. Not because the record was thin — the record has
 * ingredients, application, storage, shelf life, cartons — but because none of
 * it was ever written out as prose. A spec table is not something a crawler can
 * rank for, and it is not something a buyer reads before deciding to enquire.
 *
 * Everything below is COMPOSED FROM ProductSpec. No sentence here states a
 * fact that is not already in lib/products.json, so a corrected record
 * corrects the page. Hand-written marketing copy would drift within a month and
 * nobody would notice.
 *
 * THE INDEXING CONTRACT PER PAGE
 *   one H1, one H2 per block, no level skips
 *   every block adds plain-language text a query can match
 *   the FAQ answers are specific enough to be quoted by an answer engine, and
 *   the same array feeds FAQPage schema so the two cannot disagree
 *   no price, anywhere — the site is quote-only
 */

type Copy = {
  /** What it does, in the buyer's words rather than the formula's. */
  summary: string;
  /** Where it goes and what it is for, as sentences rather than a table. */
  application: string;
  /** How it is used. Written to be safe to follow without a label in hand. */
  usage: string[];
  /** What buyers ask before they enquire. Answers carry real numbers. */
  faq: { q: string; a: string }[];
};

/**
 * Per-category copy. Keyed by category rather than SKU because twenty SKUs
 * genuinely share three lines of application — writing twenty near-identical
 * paragraphs would read as padding to a crawler and to a reader.
 *
 * Anything SKU-specific (size, MOQ, lead time, shelf life, storage) is
 * interpolated from the record rather than written per product.
 */
const BY_FAMILY: Record<string, Copy> = {
  cleansing: {
    summary:
      'A pH-balanced wash for everyday use that cleans the coat and conditions it in one step, so a second product is not needed on a regular schedule.',
    application:
      'Intended for the full body of cats and dogs, and suited to routine bathing rather than one-off treatment. Because it cleans and conditions together, it also works as a follow-up after a heavier grooming product rather than needing to replace one.',
    usage: [
      'Wet the coat thoroughly until the hair is fully saturated — product applied to dry hair does not distribute evenly.',
      'Dilute into lukewarm water rather than applying concentrate straight from the bottle.',
      'Work through the coat, avoiding the eyes, ears and mouth.',
      'Rinse completely. Leftover surfactant is the most common cause of a pet scratching after a bath.',
      'Towel dry and allow the coat to air-dry away from direct heat.',
    ],
    faq: [
      {
        q: 'Is it safe for cats with sensitive skin?',
        a: 'Yes. The formula is built around camellia seed extract and silk protein rather than harsh sulfates, and is intended for regular use on both cats and dogs. As with any pet product, patch-test on a small area first if the animal has a history of reacting to grooming products.',
      },
      {
        q: 'Can it be used on puppies and kittens?',
        a: 'It is intended for routine bathing of cats and dogs. For very young animals, or any animal under veterinary care for a skin condition, ask your vet before using any grooming product.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  disinfection: {
    summary:
      'A chlorine-dioxide solution for surfaces rather than for the animal: it disinfects the environment the pet lives in and removes the odor at the same time, without the residue a phenol or chlorine bleach leaves behind.',
    application:
      'Applied to environment rather than to the pet: floors, bedding, crates, carriers, bowls and any hard surface the animal contacts. It is a surface treatment, and it is not a spot-on or a coat product — those are separate SKUs in the catalogue.',
    usage: [
      'Remove loose dirt first. A disinfectant applied over grime disinfects the grime, not the surface underneath it.',
      'Apply to a clean, dry surface and keep visibly wet for the contact time stated on your label artwork.',
      'Wipe or allow to air-dry. No rinsing is required on non-porous hard surfaces.',
      'Do not mix with other cleaning products, particularly acidic ones — mixing generates gas.',
      'Store away from direct sunlight and below 25 °C. Do not expose the concentrate to heat.',
    ],
    faq: [
      {
        q: 'Is it safe to use around cats and dogs?',
        a: 'It is intended for use in the animal environment, on surfaces rather than on the animal. Keep treated surfaces dry before the animal returns to them, and follow the contact time on your label. For anything applied directly to an animal, use the coat and ear SKUs instead.',
      },
      {
        q: 'Does it need to be rinsed off?',
        a: 'No. On non-porous hard surfaces it is applied and left, then wiped or air-dried. On porous materials such as fabric bedding, test for colour fastness on an inconspicuous area first.',
      },
      {
        /*
         * THE PAPERWORK IS ANSWERED ONCE - IN THE PROCUREMENT FAQ.
         *
         * This asked "What documentation ships with it?" and the procurement
         * block further down the same page asked "What documentation ships
         * with this product?". Two questions about paperwork on one page,
         * two answers, and the buyer has to decide which to believe. The
         * procurement answer stays because it carries the HS code this
         * family block cannot see.
         *
         * What remains here is the fact only this line can state: a
         * disinfectant manufacturing licence. A licence and a document list
         * are two different questions, so this is not a reworded
         * duplicate.
         */
        q: 'Which production licences does this line hold?',
        a: 'The production line holds a disinfectant manufacturing licence, and the batch documents — a COA, a 16-language SDS, an INCI disclosure and an allergen declaration — travel with every shipment. The third-party laboratory determinations covering this line are downloadable from the certifications page.',
      },
      {
        q: 'What is the shelf life?',
        a: '18 months sealed. Store in a cool, dry place below 25 °C and away from direct sunlight.',
      },
    ],
  },

  outdoor: {
    summary:
      'A coat spray for use before outdoor activity, combining plant extracts with citronella and mugwort essential oils to reduce insect attention during walks and hikes.',
    application:
      'Intended for outdoor use on the coat, applied before the walk rather than after the bites have landed. Suited to walks and hiking where exposure is expected; it is not a treatment for an animal that already has fleas or a skin reaction.',
    usage: [
      'Apply to a dry coat. Wet hair dilutes the spray and reduces coverage.',
      'Part the coat and spray close to the skin, working from the back forward.',
      'Cover the areas most exposed: ears, neck, shoulders, chest and between the toes.',
      'Allow to dry fully before the animal goes outside.',
      'Reapply after swimming or heavy rain.',
    ],
    faq: [
      {
        q: 'Can it be used on cats?',
        a: 'It is intended for dogs and outdoor walks. Cats lick their coats, and a product designed for outdoor exposure is not formulated with that in mind. For cats, use the grooming and odor-control SKUs instead.',
      },
      {
        q: 'How often can it be used?',
        a: 'Before each outdoor session, and again after swimming or heavy rain. Daily use is reasonable for a dog that walks several times a day.',
      },
      {
        q: 'Does it work on ticks?',
        a: 'It is an insect repellent, not an acaricide. It reduces insect attention on the coat during exposure. If the animal already has fleas or ticks, that is a treatment problem rather than a prevention one, and it needs a product registered for it.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. The 80 mL format is a hand-held bottle; larger formats change the MOQ and are quoted separately.',
      },
    ],
  },

  /**
   * The deodorizing sprays. P001 (the gift set), P002 (the 350 mL spray) and
   * P009 (the 220 mL × 2 kit with a spray gun). Same formulation, three
   * formats — and the one family the catalogue files under odor control
   * rather than under disinfection.
   *
   * WHY THIS IS SPLIT INTO TWO FAMILIES
   *
   * The three share a formulation, but they do not share a use. The
   * catalogue's own `application` field says so:
   *
   *   P002  Pet body · Pet waste · Bedding · Floors · Litter boxes · Living areas
   *   P001  Pet waste · Litter boxes · Bedding · Living areas
   *   P009  (the spray gun kit) surfaces around the animal
   *
   * One family copy was used for all three, and it said the spray "is safe
   * if licked" while its own application line said the products treat
   * surfaces around the animal. So a reader on the gift-set page or the
   * spray-gun page saw two sentences that cannot both be true of that SKU:
   * one saying the product is not catalogued for an animal's coat or skin,
   * the other saying it is safe to lick.
   *
   * The claim is true for P002 and only P002 — P002 is the SKU the
   * laboratory report names, and the only one whose application includes
   * the pet body. For the other two the claim is dropped rather than
   * softened, because a buyer reading "safe if licked" on a surface
   * product will take away permission the catalogue does not give.
   *
   * A shared formulation is not a shared use, and the copy has to follow
   * the catalogue record rather than the formulation.
   */
  deodorizing: {
    summary:
      'An enzyme and plant-extract deodorizer that breaks the odor source down instead of masking it, for the places odor collects around an animal.',
    application:
      'Intended for the places odor collects around an animal: bedding, floors, carriers, waste areas and the litter box. The same formulation is supplied as a 350 mL spray, a 1-spray-plus-two-refill gift set, and a 220 mL × 2 refill kit with a spray gun for volume work.',
    usage: [
      'Remove the source first. A deodorizer applied over a fresh accident treats the smell, not the cause.',
      'Apply to the surface and let it dry rather than soaking fabrics or bedding.',
      'On a litter box, treat the rim and the floor around it rather than the litter itself.',
      'Choose the format by the work: the spray for a single animal, the refill kit with the spray gun for a run of crates.',
    ],
    faq: [
      {
        q: 'How effective is it?',
        a: '94.2% ammonia removal, report NACCYH25014722, and 93.3% hydrogen sulfide removal, report NACCYH25014721. Both were measured by an independent laboratory on the deodorant sample.',
      },
      {
        q: 'Can it be used on the animal itself?',
        a: 'This SKU is catalogued for surfaces around the animal — bedding, floors, carriers, waste areas and the litter box. The catalogue does not record this SKU for use on an animal\u2019s coat or skin; the spray that is catalogued for the pet body is the 350 mL Power Odor Eliminator, which is a separate SKU.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  /**
   * P002 alone: the 350 mL Power Odor Eliminator.
   *
   * The one SKU in this family the catalogue records for the pet body, and
   * the one the laboratory report names. It is the only SKU that can carry
   * the "safe if licked" claim, and it carries it because the record
   * supports it — not because the family does.
   */
  deodorizingOnAnimal: {
    summary:
      'An enzyme and plant-extract deodorizer that breaks the odor source down instead of masking it, formulated for coats an animal may lick — safety assessment 2024FM11611R02D.',
    application:
      'Intended for the places odor collects on and around an animal: the coat, bedding, floors, carriers, waste areas and the litter box. The same formulation is supplied as a 1-spray-plus-two-refill gift set and a 220 mL × 2 refill kit with a spray gun, which are catalogued for surfaces only.',
    usage: [
      'Remove the source first. A deodorizer applied over a fresh accident treats the smell, not the cause.',
      'Apply to the surface and let it dry rather than soaking fabrics or bedding.',
      'On a litter box, treat the rim and the floor around it rather than the litter itself.',
      'Choose the format by the work: the spray for a single animal, the refill kit with the spray gun for a run of crates.',
    ],
    faq: [
      {
        q: 'How effective is it?',
        a: '94.2% ammonia removal, report NACCYH25014722, and 93.3% hydrogen sulfide removal, report NACCYH25014721. Both were measured by an independent laboratory on the deodorant sample.',
      },
      {
        q: 'Is it safe if an animal licks its coat?',
        a: 'The formulation is assessed for use on a coat an animal may lick — report 2024FM11611R02D, downloadable on the certifications page. It is not an oral product or a drinking water; keep it out of eyes and bowls.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  /**
   * The ear solution (P005). It files under odor control in the catalogue
   * because it is a hygiene product, but it goes in an ear, not on a floor.
   */
  ear: {
    summary:
      'A gentle cleansing solution for the ear canal: it loosens ear wax so it can be removed, and helps keep the canal clear between washes.',
    application:
      'Intended for routine cleaning of the ear canal of cats and dogs. It is a cleanser rather than a treatment, and it is not a substitute for veterinary care of an ear that is already inflamed, bleeding or infected.',
    usage: [
      'Warm the bottle in your hands before use; a cold solution is uncomfortable in the canal.',
      'Fill the canal with a small amount, massage the base of the ear, then let the animal shake it out.',
      'Wipe the outer ear and the ear flap. Do not push a cotton bud into the canal.',
      'Clean the bottle and the dispenser after each use so nothing is carried between animals.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Cocamidopropyl betaine with a low concentration of tea tree oil. Cocamidopropyl betaine is the surfactant that lifts wax and debris off the skin.',
      },
      {
        q: 'Can it be used on kittens and puppies?',
        a: 'It is intended for routine cleaning of cats and dogs. For very young animals, or any animal under veterinary care for an ear or skin condition, ask your vet before using any ear product.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  /**
   * The probiotic dental water (P006).
   */
  dental: {
    summary:
      'A probiotic dental water for the drinking bowl: it balances the oral flora and reduces the plaque and bad breath that come with it.',
    application:
      'Intended to be added to a pet\'s drinking water daily. It is daily oral care rather than a treatment: it works by keeping the mouth environment in balance, not by removing tartar once it has hardened.',
    usage: [
      'Add it to the drinking water once a day and stir, so it distributes instead of settling at the bottom of the bowl.',
      'Top the water up rather than replacing it entirely, so the concentration stays even.',
      'Expect the breath to change over a couple of weeks rather than after one use.',
      'Rinse the bowl regularly: residue in a bowl left for days is what you are trying to avoid.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Lactobacillus probiotics with mint extract in deionized water. The probiotics are what balances the oral flora; the mint is there to keep the breath pleasant while it works.',
      },
      {
        q: 'Does it replace tooth brushing?',
        a: 'No. It reduces plaque and bad breath as part of daily care, but it does not remove tartar that has already hardened on the teeth, and it is not a dental treatment for a diseased mouth.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  /**
   * The laundry detergent (P017) — a laundry product, not a grooming one.
   */
  laundry: {
    summary:
      'A bio-enzyme laundry detergent for pet hair and the odor that comes with it, formulated for fabrics an animal lies on.',
    application:
      'Intended for washing pet bedding, blankets, towels and clothing that has been in contact with an animal. It is a laundry product rather than a grooming product: it does not go on the animal.',
    usage: [
      'Use it through the detergent dispenser rather than straight onto the fabric, so it disperses instead of leaving a residue.',
      'Wash pet bedding separately and dry it fully — damp bedding is what holds the smell.',
      'Pre-treat a heavy hair load and let the enzyme work on the fabric before the cycle starts.',
      'It is formulated for pet textiles and for fabrics a baby comes into contact with.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'A bio-enzyme with a surfactant and plant extracts. The enzyme breaks down the proteins in urine and dander that cause the smell; the surfactant lifts the hair out of the fabric.',
      },
      {
        q: 'Is it safe for baby clothing?',
        a: 'Yes. It is formulated for pet textiles and for fabrics a baby comes into contact with.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: 'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
      },
    ],
  },

  /**
   * The paw balm (P018) — a cosmetic pad balm, not a treatment.
   */
  paw: {
    summary:
      'A paw balm that moisturizes and repairs dry or cracked pads, with camellia and aloe to keep the skin supple.',
    application:
      'Intended for the paw pads of cats and dogs, applied after walks or whenever the pads are dry, rough or cracked. It is a cosmetic pad balm, not a treatment for an injury or an infection.',
    usage: [
      'Wipe the pads clean and let them dry before applying — a balm on a wet pad wears off immediately.',
      'A thin layer is enough; it is absorbed rather than sitting on the surface.',
      'Apply before a walk as well as after one, in winter or on hot, dry ground, when the pads take the most abrasion.',
      'Massage it into the pad edges, where the skin splits first.',
    ],
    faq: [
      {
        q: 'What is in it?',
        a: 'Camellia seed extract, aloe vera and glycerin. The camellia and the aloe condition the skin; the glycerin is what keeps it from drying out again between applications.',
      },
      {
        q: 'How often should it be used?',
        a: 'As often as the pads need it — daily for a dog that walks a lot on hard ground, weekly for one that does not. The pads themselves are the guide: the moment they feel rough again, it is time.',
      },
      {
        q: 'What is the MOQ (minimum order quantity)?',
        a: 'MOQ is {MOQ} for this SKU. A private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'What is the shelf life?',
        a: '{SHELF} months sealed. Store in a cool, dry place below 25 °C.',
      },
    ],
  },


  /**
   * The cat litter powders (P007 500 g, P008 300 g).
   */
  litter: {
  summary:
    'A powder treatment for litter boxes that neutralises odor in the litter bed rather than masking it at the surface, so it keeps working between scoops.',
  application:
    'Intended for litter boxes. It is added to the litter bed after each scoop, where it reaches the urine clumps wherever they form — including the ones buried below the visible layer, which are the source of most of the odor.',
  usage: [
    'Scoop first. Adding powder to a soiled box wastes it.',
    'Spread a thin, even layer over the litter surface rather than a mound in one corner.',
    'Mix gently into the top layer so it distributes through the bed.',
    'Leave a minute before replacing the tray.',
    'Add again after every scoop, and after the box is refilled.',
  ],
  faq: [
    {
      q: 'How long does a pack last?',
      a: 'A 500 g pack covers roughly 60–90 days in a single-box household scooped daily. A multi-cat household with the same daily routine uses it considerably faster, which is why the 500 g and 1.5 kg formats both exist.',
    },
    {
      q: 'Does it change the litter texture?',
      a: 'No, and that matters. A change in texture or smell is one of the common reasons a cat stops using its box, so the formulation is unscented and does not alter how the litter clumps.',
    },
    {
      q: 'What is in it?',
      a: 'Sodium bicarbonate, silicon dioxide, bio-enzyme and plant extracts. The bicarbonate and silica absorb moisture; the enzyme breaks down the urea that produces ammonia.',
    },
    {
      q: 'What is the shelf life?',
      a: '{SHELF} months sealed — a powder has no aqueous phase to spoil. Store in a cool, dry place.',
    },
  ],
  },
};


/**
 * THE SEVEN INTENTS, ONE ANSWER EACH, THE SAME ON EVERY SKU PAGE.
 *
 * A SKU page is declared to serve seven intents - MOQ, lead time, price,
 * specification, private label, certification and samples. The family
 * blocks answered the ones that differ by product and left the rest to
 * the catalogue page, so a buyer who landed on a SKU from a search for
 * "private label pet shampoo" read a page that never used those words.
 *
 * WHY THESE ARE SHARED RATHER THAN WRITTEN ELEVEN TIMES
 * The answers are the same for every SKU because the policy is the same
 * for every SKU: no prices are listed, a sample is credited against the
 * first order, documentation ships with the goods. Writing them eleven
 * times would let them drift between families, which is the exact failure
 * the catalogue FAQ already has a single source to prevent.
 *
 * THE QUESTION TEXTS ARE COPIED FROM THE FAMILY BLOCKS ON PURPOSE. Where
 * a family already answers one of these - the cleansing family answers
 * MOQ and lead time, the litter family answers what is in it - the merge
 * below keeps the family's answer and drops this one, because the question
 * strings match. A family answer carries a figure this file cannot see
 * (a pack's coverage, a format's hand-held size), so it wins.
 *
 * WHAT IS NOT HERE, DELIBERATELY: no price. The site is quote-only.
 */
const SHARED_FAQ = [
  {
    q: 'What is the MOQ (minimum order quantity)?',
    a:
      'MOQ is {MOQ} for {SKU}. A private-label variation changes the MOQ and is quoted separately.',
  },
  {
    q: 'How long does production take?',
    a:
      'Stock lead time is {LEAD} days after payment is confirmed. Private-label lead time is {OEM_LEAD} days after the sample is approved.',
  },
  {
    q: 'How is this product priced?',
    a:
      'Not on this page. Price for {SKU} depends on volume tier, packaging specification and destination port, so it is quoted per RFQ rather than listed. Send the annual volume and the destination and you have tiered pricing within one business day.',
  },
  {
    q: 'Can I get a sample before placing an order?',
    a:
      'Yes. A physical sample of {SKU} plus a written specification sheet is the first stage of the order, and the sample cost is credited against the first production run.',
  },
  /*
   * PRIVATE LABEL AND DOCUMENTATION USED TO LIVE HERE TOO.
   *
   * Both were asked here AND in the procurement block that renders further
   * down the same page, under different wording ("Can this be
   * private-labelled?" here, "Can it be private-labelled with our own
   * formula and artwork?" there), which gave one page two answers to one
   * question and put both into the FAQPage.
   *
   * They are now single entries in lib/products.ts productFaq(), asking the
   * buyer's question, keeping the facts that used to be here - a 16-language
   * SDS, an INCI disclosure, an allergen declaration, the ISO 22716 GMP
   * cleanroom, the "a formula outside the catalogue is a development
   * programme" boundary - and adding the two facts this file cannot see:
   * the pack format and the HS code.
   */
  {
    q: 'What is in it?',
    a:
      '{INGREDIENTS}. The published specification for {SKU} is the record this page renders from, so a corrected record corrects the answer.',
  },
];


/**
 * Which copy describes which product.
 *
 * The catalogue's three categories are too coarse for prose: the odor-control
 * category holds a surface disinfectant, a pet deodorizing spray, an ear
 * solution, a dental water, two cat litter powders, a spray gun kit and an
 * odor-control gift set. Copy keyed by category alone puts "apply to floors
 * and bedding" on the ear-cleansing page, so the copy is keyed by product and
 * the category is only the default.
 */
const BY_SKU: Record<string, string> = {
  P001: 'deodorizing',
  // The one SKU in the family the catalogue records for the pet body, and
  // therefore the only one that carries the "safe if licked" claim.
  P002: 'deodorizingOnAnimal',
  P009: 'deodorizing',
  P003: 'disinfection',
  P004: 'disinfection',
  P005: 'ear',
  P006: 'dental',
  P007: 'litter',
  P008: 'litter',
  P010: 'cleansing',
  P011: 'cleansing',
  P012: 'cleansing',
  P013: 'cleansing',
  P014: 'cleansing',
  P015: 'cleansing',
  P016: 'cleansing',
  P017: 'laundry',
  P018: 'paw',
  P019: 'outdoor',
  P020: 'outdoor',
};

/** The category fallback, for a SKU that is not in the map. */
const CATEGORY_FAMILY: Record<string, string> = {
  cleansing_grooming: 'cleansing',
  disinfection_odor_control: 'disinfection',
  outdoor_protection: 'outdoor',
};

/**
 * THE FOUR PRODUCT LINES, EACH WITH ITS OWN OPENING.
 *
 * WHY FOUR OPENINGS AND NOT ONE
 * Twenty product pages carried the same paragraph. A buyer who opened
 * three of them before the fourth had learned nothing the second
 * time, and stopped reading. The four lines are four different
 * businesses - odor control, grooming, outdoor protection and oral
 * products - and each one answers a different question, so each one
 * opens differently.
 *
 * WHAT AN OPENING MAY NOT DO
 * It describes the LINE, not one SKU, so it never carries a number
 * that belongs to a single formulation. The ammonia figure below is
 * the deodorizer's, and the report number sits beside it so a buyer
 * can see which SKU the report covers.
 */
const LINE_INTRO: Record<string, string> = {
  deodorizing_disinfection:
    'Enzyme and probiotic systems, built to break the odor source down rather than mask it. Ammonia removal is measured by an independent laboratory — 94.2% on report NACCYH25014722 — and the report number is printed on the page of every SKU the report covers.',
  grooming_care:
    'Shampoos, foams and gels for coats that are washed often. The formulation decisions that matter here are surfactant strength and what the coat feels like after drying, not the fragrance.',
  outdoor_protection:
    'Short-contact sprays for use before the animal goes outside. Registration route differs by market, so the destination decides the claim we can print, not the other way round.',
  pet_nutrition:
    'Oral products are a separate regulatory route in every market — feed additive, supplement, or drug. We tell you which side of that line a formula sits on before the label is commissioned, not after.',
};

/**
 * The opening for one product line.
 *
 * An empty string for a line that has no opening of its own, so the
 * caller leaves the block off the page rather than print a
 * placeholder.
 */
export function lineIntro(line: string): string {
  return LINE_INTRO[line] ?? '';
}

/** Compose the copy for a SKU. */
export function productCopy(p: ProductLike) {
  const family = BY_SKU[p.id] ?? CATEGORY_FAMILY[p.category] ?? 'litter';
  const base = BY_FAMILY[family] ?? BY_FAMILY.litter;
  const values = {
    MOQ: `${p.moq.toLocaleString()} ${p.moq_unit}`,
    LEAD: p.lead_time_days_stock,
    OEM_LEAD: p.lead_time_days_oem,
    SHELF: String(p.shelf_life_months),
    SKU: p.sku_oem,
    INGREDIENTS: (p.ingredients_en || '').trim(),
  };
  const fill = (text: string) =>
    text.replace(/\{(MOQ|LEAD|OEM_LEAD|SHELF|SKU|INGREDIENTS)\}/g,
      (_m, k: keyof typeof values) => values[k]);

  /*
   * THE MERGE, AND WHY IT DEDUPLICATES BY QUESTION.
   *
   * Family answers are specific - a 500 g pack covers 60-90 days, the
   * 80 mL format is hand-held - and the shared answers are the policy
   * that applies to all twenty. They overlap on MOQ, lead time and
   * composition, and the question strings were written to be identical
   * so that a Set of them settles it: whichever comes first wins, and
   * family answers come first because they carry the figures.
   *
   * An empty ingredient list drops the composition answer rather than
   * printing a sentence that starts with a full stop. If a record has no
   * `ingredients_en`, the page has nothing honest to say about what is
   * in the bottle, and saying it anyway is how a spec sheet becomes
   * fiction.
   */
  const seen = new Set<string>();
  const faq: { q: string; a: string }[] = [];
  for (const item of [...base.faq, ...SHARED_FAQ]) {
    const q = fill(item.q);
    if (seen.has(q)) continue;
    if (q === 'What is in it?' && !values.INGREDIENTS) continue;
    seen.add(q);
    faq.push({ q, a: fill(item.a) });
  }

  return {
    ...base,
    summary: fill(base.summary),
    application: fill(base.application),
    usage: base.usage.map(fill),
    faq,
  };
}

/** Facts an answer engine can quote, with their provenance. */
export function productFacts(p: ProductLike) {
  return [
    { label: 'Minimum order', value: `${p.moq.toLocaleString()} ${p.moq_unit}` },
    { label: 'Stock lead time', value: `${p.lead_time_days_stock} days` },
    /*
     * 'Private-label lead time', and not the buyer's-OEM label.
     *
     * OEM on this site means the BUYER's formula - a 30-45 day job,
     * and not a field of any product. The field below holds the
     * 25-40 day private-label window, and calling it 'OEM' made the
     * site contradict the trade page, where OEM is defined.
     */
    { label: 'Private-label lead time', value: `${p.lead_time_days_oem} days` },
    { label: 'Shelf life', value: `${p.shelf_life_months} months` },
    { label: 'Storage', value: p.storage },
    { label: 'OEM SKU code', value: p.sku_oem },
  ];
}