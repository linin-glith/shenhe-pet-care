import type { ProductSpec } from '@/lib/products';

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
const BY_CATEGORY: Record<string, Copy> = {
  cleansing_grooming: {
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
        q: 'What is the minimum order quantity?',
        a: 'MOQ is 2,000 bottles for catalogue SKUs. The ingredient and format are fixed at that volume; a private-label variation changes the MOQ and is quoted separately.',
      },
      {
        q: 'How long does production take?',
        a: '7–15 days for the stock formulation. Private label with your own artwork and label compliance adds 25–40 days because artwork has to be approved before the filling line is scheduled.',
      },
    ],
  },

  disinfection_deodorization: {
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
        q: 'What documentation ships with it?',
        a: 'A batch-specific COA, a 16-language SDS, an INCI disclosure and an allergen declaration accompany every shipment. The production line additionally holds a disinfectant licence and third-party laboratory determinations, downloadable from the certifications page.',
      },
      {
        q: 'What is the shelf life?',
        a: '18 months sealed. Store in a cool, dry place below 25 °C and away from direct sunlight.',
      },
    ],
  },

  outdoor_protection: {
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
        q: 'What is the minimum order quantity?',
        a: 'MOQ is 2,000 bottles. The 80 mL format is a hand-held bottle; larger formats change the MOQ and are quoted separately.',
      },
    ],
  },
};

const DEODOR_OR_LITTER = {
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
      a: '36 months sealed — the longest in the catalogue, because a powder has no aqueous phase to spoil. Store in a cool, dry place.',
    },
  ],
};

export { productCopy, productFacts } from './product-copy';
