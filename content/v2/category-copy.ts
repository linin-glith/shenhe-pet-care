/**
 * Category page depth.
 *
 * A category page lists the SKUs in a line, and that alone is a thin page:
 * 217–307 words, no FAQ, nothing for a crawler to rank on beyond the product
 * cards it links to. The cards are already linked from the catalogue, so
 * repeating them in prose would be padding.
 *
 * What a category page should answer instead is the question the buyer has
 * BEFORE they know which SKU they want: what is in this line, what is the
 * difference between the products in it, and how do I choose. That is a
 * different question from the one the SKU pages answer, and it is the one
 * that brings a buyer into the line in the first place.
 *
 * The copy is derived from the product records in the category, so the
 * figures quoted here are the figures on the product pages.
 */

export type CategoryCopy = {
  /** One paragraph on what this line is for. */
  intro: string;
  /** How to choose within the line. Bulleted, one line each. */
  choosing: { q: string; a: string }[];
  /** Questions buyers ask about the line as a whole. */
  faq: { q: string; a: string }[];
};

/**
 * Per-line copy. The lines are real product families, so each one gets its
 * own explanation rather than a template with the category name swapped in.
 */
export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  cleansing_grooming: {
    intro:
      'This line covers routine cleansing and coat care for cats and dogs. Every product in it is a catalogue formulation that has been produced at scale, which means the ingredient list, the stability data and the packaging format are already proven rather than something a buyer has to develop from scratch. Private label is available on every SKU, with your formula, your artwork and your market’s label compliance.',
    choosing: [
      {
        q: 'Shampoo or waterless foam?',
        a: 'A shampoo needs water and a rinse. A waterless foam is used between baths, on animals who will not stand still for a full bath, or on short journeys. Buyers who need both usually take the shampoo as the core SKU and the waterless format as the second line.',
      },
      {
        q: 'Which one for sensitive skin?',
        a: 'The regular shampoo is built around camellia seed extract and silk protein rather than harsh sulfates. For an animal under veterinary care for a skin condition, ask your vet before using any grooming product.',
      },
      {
        q: 'Do these work on cats as well as dogs?',
        a: 'Yes, both are formulated for cats and dogs. The outdoor-protection spray is the exception in this site’s range and is intended for dogs.',
      },
    ],
    faq: [
      {
        q: 'How many SKUs are in this line?',
        a: 'Five catalogue SKUs covering shampoo in two sizes, waterless foam in two sizes, and a paw-care product. Each is available separately or as a private-label programme.',
      },
      {
        q: 'Can these be produced with my own formula?',
        a: 'Yes. Private label covers the formula, the bottle or carton artwork, and EN / Chinese label compliance for your destination market. The catalogue SKU is a starting point, not a limit.',
      },
      {
        q: 'What is the minimum order across the line?',
        a: 'MOQ is 2,000 bottles per SKU. Ordering two SKUs does not halve either minimum — the minimum is per formulation, because each one needs its own production run and its own documentation.',
      },
    ],
  },

  disinfection_odor_control: {
    /*
     * WHY THIS DOES NOT SAY "SURFACES, NOT THE ANIMAL" ANY MORE.
     *
     * It did, and the line page listed a SKU whose own catalogue record
     * says "Pet body". A reader on the line page read "the products here
     * treat surfaces, not the animal" and then, two cards down, read a
     * product whose applications began "Pet body". Both were on the page
     * at once, and both could not be true.
     *
     * The line holds two kinds of product: surface deodorizers and
     * disinfectants, and the pet-body deodorizing spray. The distinction
     * is still worth making — a buyer planning paperwork needs to know
     * which side of the line each product sits on — so it is now made
     * per product rather than across the whole line.
     */
    intro:
      'This line is for odor and disinfection around the animal — floors, bedding, crates, carriers, bowls and equipment — and for the coat itself where a product is catalogued for it. That distinction matters commercially as well as technically: surface products carry a different regulatory profile from coat products, and a buyer entering a new market needs to know which side of that line each product sits on before they plan the paperwork. Each product page states its own applications.',
    choosing: [
      {
        q: 'Deodorizer or disinfectant?',
        a: 'A deodorizer removes odor. A disinfectant kills pathogens. Products that do both exist in this line and carry a disinfectant licence with the supporting laboratory determinations; a pure deodorizer does not need that licence.',
      },
      {
        q: 'Powder or spray?',
        a: 'Powder goes into litter boxes, where it reaches urine clumps throughout the bed. Spray goes onto hard surfaces and into the general environment. They solve different problems and are usually bought together.',
      },
      {
        q: 'Does this replace a veterinary product?',
        a: 'No. These are environmental treatments. If an animal has a skin condition, an ear infection or a parasite problem, that is a veterinary question, not a cleaning one.',
      },
    ],
    faq: [
      {
        q: 'What regulatory support does this line need?',
        a: 'A disinfectant licence where the product makes a biocidal claim, an SDS in 16 languages, a batch-specific COA, and an INCI or ingredient disclosure. The compliance support page describes which market requires what.',
      },
      {
        q: 'Are the lab reports available before we order?',
        a: 'Yes. The laboratory determinations for each SKU — including ammonia removal efficiency and antibacterial performance — are published on the certifications page and can be reviewed before any commitment.',
      },
      {
        q: 'Can these be private-labelled?',
        a: 'Yes, including the artwork and the label claims. One point to note: the label claims have to remain consistent with what the laboratory work supports, so a change to a claim is a change to the evidence, not only to the artwork.',
      },
    ],
  },

  outdoor_protection: {
    intro:
      'This line is for use before and during outdoor activity: walks, hikes, and time in areas where insects are a concern. It is a prevention line, applied to the coat before exposure. If an animal already has fleas or ticks, or a skin reaction, that is a treatment question and needs a product registered for treatment rather than one registered for repellent use — a distinction that also determines the regulatory paperwork in your destination market.',
    choosing: [
      {
        q: 'Spray or pump?',
        a: 'The 80 mL bottle is a hand-held format for individual walks. Larger pack sizes suit distribution into a kennel or grooming salon where the bottle is passed between handlers.',
      },
      {
        q: 'Is it safe for cats?',
        a: 'Not as the intended use. Cats lick their coats, and a product designed for outdoor exposure is not formulated with that in mind. For cats, the grooming and odor-control lines are the right reference point.',
      },
      {
        q: 'How often does it need reapplying?',
        a: 'Before each outdoor session, and again after swimming or heavy rain. Daily use is reasonable for a dog that walks several times a day.',
      },
    ],
    faq: [
      {
        q: 'What is the minimum order?',
        a: '2,000 bottles for the 80 mL format. Larger formats have their own minimum, which is quoted per enquiry because it changes with the filling line and the packaging.',
      },
      {
        q: 'Does it work on ticks?',
        a: 'It is an insect repellent, not an acaricide. It reduces insect attention during exposure. An animal that already has fleas or ticks needs a product registered to treat them.',
      },
      {
        q: 'What documentation ships with the order?',
        a: 'A batch-specific certificate of analysis, a 16-language safety data sheet, an ingredient and allergen declaration, and the commercial invoice with the HS code. lab reports for the range are on the certifications page.',
      },
    ],
  },

  pet_nutrition: {
    intro:
      'This line covers oral supplements and digestive support for cats and dogs. It sits inside a category where the evidence bar is different from the rest of the catalogue: a probiotic or an immunoglobulin is a nutritional product, and the claim language allowed on the label is narrower and more tightly regulated than for a cleaning product. Buyers entering this category usually start with the documentation rather than the formula, because the documentation is what determines what can be written on the pack.',
    choosing: [
      {
        q: 'Probiotic or immunoglobulin?',
        a: 'Different mechanisms entirely. The probiotic is a live-culture product for the digestive tract; the immunoglobulin is an antibody protein for immune support. They are bought for different reasons and are not substitutes for each other.',
      },
      {
        q: 'What format does this ship in?',
        a: 'The probiotic is a 8 mL × 9 vials course, dosed daily by mouth. The immunoglobulin is a 15 g × 8 sachets format, dosed as a powder in food or water. Both formats and their packaging are available for private label.',
      },
      {
        q: 'What claims can the label carry?',
        a: 'That depends on the destination market and on what the supporting evidence covers. Send the intended claim wording with your enquiry and it will be answered against the documentation, not estimated.',
      },
    ],
    faq: [
      {
        q: 'Is there a minimum order?',
        a: 'MOQ is 1,000 sets per SKU — 1,000 vials for the probiotic, 1,000 sachets for the immunoglobulin. These two carry no catalogue SKU code, so they are quoted per project rather than per unit. A repeat run is quoted on its own volume, and the minimum for it is agreed in the quotation.',
      },
      {
        q: 'Can the formulation be developed with us?',
        a: 'Yes, under the same private-label programme as the rest of the catalogue. The R&D page describes the stages a new formula goes through, including the sample and the stability work.',
      },
      {
        q: 'How long does production take?',
        a: '7–15 days for stock formulations, and 25–40 days for private label measured from sample approval, because artwork and label compliance have to be settled before the filling run is scheduled.',
      },
    ],
  },
};

/** Fallback for a line with no bespoke copy yet. */
export const GENERIC_CATEGORY: CategoryCopy = {
  intro:
    'Every SKU on this page is a catalogue formulation that has been produced at scale, so the ingredient list, the stability data and the packaging format are already proven. Private label is available on each one, with your formula, your artwork and your market’s label compliance.',
  choosing: [
    {
      q: 'Can I mix SKUs in one order?',
      a: 'Yes, and buyers usually do. The minimum order applies per SKU rather than per shipment, because each formulation needs its own production run and its own documentation.',
    },
    {
      q: 'Is private label available on all of these?',
      a: 'Yes. Private label covers the formula, the artwork, and EN / Chinese label compliance for your destination market.',
    },
  ],
  faq: [
    {
      q: 'What is the minimum order?',
      a: 'MOQ is 2,000 per SKU — 2,000 bottles, 2,000 packs or 2,000 sachets, depending on the product. A repeat run is quoted on its own volume, and the minimum for it is agreed in the quotation.',
    },
    {
      q: 'How long does production take?',
      a: '7–15 days for stock formulations and 25–40 days for private label from sample approval.',
    },
    {
      q: 'Which documents ship with the order?',
      a: 'A batch-specific certificate of analysis, a 16-language safety data sheet, an ingredient declaration, and the commercial invoice with the HS code.',
    },
  ],
};

export function categoryCopy(category: string): CategoryCopy {
  return CATEGORY_COPY[category] ?? GENERIC_CATEGORY;
}
