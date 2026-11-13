/**
 * The guides, in the buyer's language.
 *
 * A guide is the thing a buyer reads before they trust a factory, and they
 * read it in their own language. A German importer looking for "Wie wähle
 * ich einen Tierpflege-Hersteller in China" wants a guide whose title says
 * that - not a German index page with an English article under it.
 *
 * The titles and descriptions are written here rather than pulled out of the
 * article files, because the article files carry the English body. A guide
 * with a German title and an English body is at least findable; a guide with
 * no German title at all is invisible to the search it was written for.
 */
export type ArticleCopy = {
  title: string;
  description: string;
};

export const ARTICLE_COPY: Record<string, Record<'de' | 'es', ArticleCopy>> = {
  'how-to-choose-a-pet-care-oem-manufacturer-in-china': {
    de: {
      title: 'Wie wählt man einen Tierpflege-OEM-Hersteller in China',
      description:
        'Die sieben Fragen, die vor dem ersten Angebot geklärt sein müssen: MOQ, Werksbesichtigung, Musterprüfung, Formulareigentum, Zahlungsbedingungen und Zertifikate.',
    },
    es: {
      title: 'Cómo elegir un fabricante OEM de productos para mascotas en China',
      description:
        'Las siete preguntas que conviene aclarar antes de la primera cotización: pedido mínimo, visita a la fábrica, muestra, propiedad de la fórmula, condiciones de pago y certificaciones.',
    },
  },
  'how-to-choose-a-pet-shampoo': {
    de: {
      title: 'Die 7 Fragen, die man vor dem Kauf eines Tier-Shampoos stellt',
      description:
        'Aktivstoffe, pH-Wert, Konzentrat oder fertig, Claims und Etikett — die Fragen, die über die Qualität eines Shampoos entscheiden.',
    },
    es: {
      title: '7 preguntas antes de comprar un champú para mascotas',
      description:
        'Principios activos, pH, concentrado o listo para usar, claims y etiquetado: las preguntas que deciden la calidad de un champú.',
    },
  },
  'pet-shampoo-ingredients-to-avoid': {
    de: {
      title: 'Welche Inhaltsstoffe im Tier-Shampoo besser nicht stehen',
      description:
        'Was auf dem Etikett steht, worauf man achten muss und welche Formulierungen für Haustiere ungeeignet sind.',
    },
    es: {
      title: 'Qué ingredientes conviene evitar en el champú para mascotas',
      description:
        'Qué aparece en la etiqueta, en qué hay que fijarse y qué formulaciones no son aptas para mascotas.',
    },
  },
  'pet-salon-shampoo-wholesale': {
    de: {
      title: 'Tier-Shampoo im Großhandel: Was der Lieferant fragen sollte',
      description:
        'MOQ, Mischungen, Verpackungsgrößen und Etikettierung — die Fragen, die den Einkaufspreis und die Lieferzeit bestimmen.',
    },
    es: {
      title: 'Champú para mascotas al por mayor: qué preguntar al proveedor',
      description:
        'Pedido mínimo, mezclas, formatos de envase y etiquetado: las preguntas que determinan el precio de compra y el plazo.',
    },
  },
  'pet-groomer-bulk-supply': {
    de: {
      title: 'Tierpflege im Großhandel für Salon und Händler',
      description:
        'Wie Salon- und Fachhändler ihre Tierpflege-Sortimente planen: Mindestmengen, Mischungen, Abverkaufspreise und Lieferrythmus.',
    },
    es: {
      title: 'Suministro a granel de productos para mascotas',
      description:
        'Cómo planification un salón o un distribuidor su surtido: pedidos mínimos, mezclas, precios de salida y ritmo de entrega.',
    },
  },
  'shelter-and-rescue-pet-wash': {
    de: {
      title: 'Tierwäsche im Tierheim und im Tierschutz: Was wirklich hilft',
      description:
        'Wie viele Tiere, wie viel Shampoo pro Tier und warum ein Tierheim eine eigene Mischung und einen eigenen Etikett braucht.',
    },
    es: {
      title: 'Lavado de mascotas en refugios y protectores: qué funciona de verdad',
      description:
        'Cuántas mascotas hay, cuánto champú por animal y por qué un refugio necesita su propia mezcla y su propia etiqueta.',
    },
  },
  'waterless-foam-or-wet-shampoo': {
    de: {
      title: 'Trockenschaum oder Nassshampoo: Welches ist das richtige?',
      description:
        'Wann trockener Schaum genügt, wann Shampoo nötig ist — und wie sich das auf Zeit, Wasser und Hautgesundheit auswirkt.',
    },
    es: {
      title: 'Espuma sin aclarado o champú: ¿cuál es el adecuado?',
      description:
        'Cuándo basta la espuma, cuándo hace falta champú, y qué efecto tiene en el tiempo, el agua y la piel.',
    },
  },
  'washing-a-cat-at-home': {
    de: {
      title: 'Eine Katze zu Hause waschen — und ihre Bettwäsche',
      description:
        'Wie man eine Katze ohne Stress wäscht, wann man es lieber lässt und wie das Bettzeug sauber wird.',
    },
    es: {
      title: 'Bañar a un gato en casa, y su ropa de cama',
      description:
        'Cómo bañar a un gato sin estrés, cuándo es mejor no hacerlo y cómo queda limpia su cama.',
    },
  },
  'why-does-cat-litter-smell': {
    de: {
      title: 'Warum riecht die Katzenstreu? 4 Ursachen und was wirklich hilft',
      description:
        'Urin, Kot, falsche Streu und zu wenig Streu — die vier Ursachen für Geruch im Katzenklo und was dagegen hilft.',
    },
    es: {
      title: '¿Por qué huele la arena del gato? 4 causas y qué funciona',
      description:
        'Orina, heces, arena inadecuada y poca arena: las cuatro causas del mal olor y qué hacer con cada una.',
    },
  },
};

/**
 * The copy of a guide, in the buyer's language.
 *
 * A guide with no translation keeps its English title, which is the honest
 * answer: it has not been translated yet.
 */
export function articleCopy(
  slug: string,
  locale: string,
): ArticleCopy | null {
  if (locale === 'en') return null;
  const entry = ARTICLE_COPY[slug];
  return entry ? entry[locale as 'de' | 'es'] ?? null : null;
}
