/**
 * The commercial facts of a SKU, in the buyer's language.
 *
 * WHY THIS IS A SEPARATE FILE AND NOT A DICTIONARY
 * A dictionary holds the words of the SITE — the navigation, the labels,
 * the buttons. A SKU's name, its function and its application are not
 * words of the site: they are facts about a product, and they live with
 * the product data. Putting 20 products x 2 languages x 5 fields into
 * the site dictionary would turn one product's copy into a change to
 * every page, and a translator would have to know that "P014" means
 * "Flea & Tick Shampoo" before they could translate anything.
 *
 * WHAT IS NOT TRANSLATED, AND WHY
 *   HS code      an international customs code. Translating it makes it
 *                a different code, and the wrong one at a customs desk.
 *   OEM SKU code our own article number.
 *   INCI names   the chemical names are the chemical names. A German
 *                buyer looking for Aqua needs "Aqua", not "Wasser".
 *
 * The MOQ unit and the application names are here rather than in the
 * dictionary because they are vocabulary the SITE uses to describe
 * products, and they have to match the catalogue, the spec table and
 * the buyer's quote letter.
 */

/** The MOQ unit, in the buyer's language. */
export const MOQ_UNITS: Record<string, Record<string, string>> = {
  en: { sets: 'sets', bottles: 'bottles', packs: 'packs', sachets: 'sachets' },
  de: { sets: 'Sets', bottles: 'Flaschen', packs: 'Packungen', sachets: 'Beutel' },
  es: { sets: 'sets', bottles: 'botellas', packs: 'paquetes', sachets: 'sobres' },
};

/**
 * The application names, in the buyer's language.
 *
 * These are the phrases that appear under "Where it is used" and in the
 * catalogue's application column. They are the words a buyer uses when
 * they describe the job the product has to do — which is why they are
 * translated as phrases and not word by word.
 */
export const APPLICATIONS: Record<string, Record<string, string>> = {
  en: {
    'Pet body': 'Pet body',
    'Litter boxes': 'Litter boxes',
    'Cat litter boxes': 'Cat litter boxes',
    'Bedding': 'Bedding',
    'Cat bedding': 'Cat bedding',
    'Pet bedding': 'Pet bedding',
    'Living areas': 'Living areas',
    'Pet waste': 'Pet waste',
    'Floors': 'Floors',
    'Pet paws': 'Pet paws',
    'Pet paw pads': 'Pet paw pads',
    'Outdoor walks': 'Outdoor walks',
    'Hiking': 'Hiking',
    'Pet equipment': 'Pet equipment',
    'Pet coat': 'Pet coat',
    'Pet clothing': 'Pet clothing',
    'Routine bath': 'Routine bath',
    'Regular bath': 'Regular bath',
    'Local cleaning': 'Local cleaning',
    'Travel': 'Travel',
    'Pet ear canal': 'Pet ear canal',
    'Routine ear care': 'Routine ear care',
    'Feline skin lesions': 'Feline skin lesions',
    'Skin problem relief': 'Skin problem relief',
    'Cracked paw care': 'Cracked paw care',
    'Daily oral care': 'Daily oral care',
    'Pet drinking water': 'Pet drinking water',
    'Household laundry': 'Household laundry',
    'Retail bundle': 'Retail bundle',
    'Pet households': 'Pet households',
  },
  de: {
    'Pet body': 'Tierkörper',
    'Litter boxes': 'Katzenklos',
    'Cat litter boxes': 'Katzenklos',
    'Bedding': 'Liegeflächen',
    'Cat bedding': 'Katzenliegeflächen',
    'Pet bedding': 'Tierliegeflächen',
    'Living areas': 'Wohnbereiche',
    'Pet waste': 'Tierkot',
    'Floors': 'Bodenflächen',
    'Pet paws': 'Pfoten',
    'Pet paw pads': 'Pfotenballen',
    'Outdoor walks': 'Spaziergänge',
    'Hiking': 'Wandern',
    'Pet equipment': 'Tierzubehör',
    'Pet coat': 'Tierfell',
    'Pet clothing': 'Tierbekleidung',
    'Routine bath': 'Regelmäßiges Bad',
    'Regular bath': 'Regelmäßiges Bad',
    'Local cleaning': 'Flächenreinigung',
    'Travel': 'Reisen',
    'Pet ear canal': 'Gehörgang des Tieres',
    'Routine ear care': 'Regelmäßige Ohrenpflege',
    'Feline skin lesions': 'Hautläsionen bei Katzen',
    'Skin problem relief': 'Lindering von Hautproblemen',
    'Cracked paw care': 'Pflege rissiger Pfoten',
    'Daily oral care': 'Tägliche Zahnpflege',
    'Pet drinking water': 'Trinkwasser für Tiere',
    'Household laundry': 'Haushaltswäsche',
    'Retail bundle': 'Handelspaket',
    'Pet households': 'Tierhaushalte',
  },
  es: {
    'Pet body': 'Cuerpo de la mascota',
    'Litter boxes': 'Areneros',
    'Cat litter boxes': 'Areneros para gatos',
    'Bedding': 'Mantas y camas',
    'Cat bedding': 'Camas para gatos',
    'Pet bedding': 'Camas para mascotas',
    'Living areas': 'Zonas de estar',
    'Pet waste': 'Excrementos de mascotas',
    'Floors': 'Suelos',
    'Pet paws': 'Patas',
    'Pet paw pads': 'Almohadillas plantares',
    'Outdoor walks': 'Paseos al aire libre',
    'Hiking': 'Senderismo',
    'Pet equipment': 'Equipamiento para mascotas',
    'Pet coat': 'Pelo de la mascota',
    'Pet clothing': 'Ropa para mascotas',
    'Routine bath': 'Baño habitual',
    'Regular bath': 'Baño regular',
    'Local cleaning': 'Limpieza de superficies',
    'Travel': 'Viajes',
    'Pet ear canal': 'Conducto auditivo de la mascota',
    'Routine ear care': 'Cuidado habitual del oído',
    'Feline skin lesions': 'Lesiones cutáneas en gatos',
    'Skin problem relief': 'Alivio de problemas cutáneos',
    'Cracked paw care': 'Cuidado de patas agrietadas',
    'Daily oral care': 'Cuidado dental diario',
    'Pet drinking water': 'Agua de bebida para mascotas',
    'Household laundry': 'Lavado del hogar',
    'Retail bundle': 'Pack de venta',
    'Pet households': 'Hogares con mascotas',
  },
};

/**
 * The name of a product, in the buyer's language.
 *
 * A product name is a name, not a description: a German buyer looks for
 * "Hundeshampoo", not "Haustier Shampoo Anti Bakteriell 300". The name
 * is what the buyer will type into a supplier search, so it is written
 * the way a German buyer would write it — with the noun capitalised and
 * the technical detail where a German product page puts it.
 */
export const PRODUCT_NAMES: Record<string, Record<string, string>> = {
  en: {},
  de: {
    'P001': 'Probiotik + Bio-Enzym Geruchs-Kontroll-Set',
    'P002': 'Power Geruchs-Eliminator (Extra-Strong)',
    'P003': 'Desinfektions- und Geruchsneutralisierungslösung',
    'P004': 'CatClean Anti-Pilz- und Geruchsneutralisierungslösung',
    'P005': 'Ohrreinigungslösung für Tiere',
    'P006': 'Probiotisches Zahnwasser für Tiere',
    'P007': 'Cat Litter Partner — Geruchsneutralisierendes Pulver 500 g',
    'P008': 'Cat Litter Partner — Geruchsneutralisierendes Pulver 300 g',
    'P009': 'Geruchsneutralisierendes Sprühpistolen-Set für Tiere',
    'P010': 'Multifunktions-Waschlotion für Tiere 300 mL',
    'P011': 'Multifunktions-Waschlotion für Tiere 200 mL',
    'P012': 'Haustier-Shampoo für Katzen oder Hunde 500 mL',
    'P013': 'Haustier-Shampoo — Antibakteriell · Milbenbekämpfung 300 mL',
    'P014': 'Ohne Abspülen: Reinigungsschaum für Tiere 500 mL',
    'P015': 'Ohne Abspülen: Reinigungsschaum für Tiere 300 mL',
    'P016': 'Pfotenreinigungsschaum für Tiere 200 mL',
    'P017': 'Waschmittel für Haushalte mit Haustieren 1,5 kg',
    'P018': 'Feuchtigkeitsgel für Pfoten 10 g',
    'P019': 'Outdoorschutz-Spray für Tiere 80 mL',
    'P020': 'Outdoorspray gegen Insekten 80 mL',
  },
  es: {
    'P001': 'Set de Control de Olores con Probióticos y Bioenzimas',
    'P002': 'Eliminador de Olores Powerful (Fuerza Extra)',
    'P003': 'Solución Desinfectante y Neutralizadora de Olores',
    'P004': 'Solución CatClean Antifúngica y Neutralizadora de Olores',
    'P005': 'Solución Limpiadora de Oídos para Mascotas',
    'P006': 'Agua Dental Probiótica para Mascotas',
    'P007': 'Cat Litter Partner — Polvo Neutralizador de Olores 500 g',
    'P008': 'Cat Litter Partner — Polvo Neutralizador de Olores 300 g',
    'P009': 'Kit de Pistola Spray Neutralizadora de Olores para Mascotas',
    'P010': 'Champú Multiusos para Mascotas 300 mL',
    'P011': 'Champú Multiusos para Mascotas 200 mL',
    'P012': 'Champú para Mascotas para Gatos o Perros 500 mL',
    'P013': 'Champú para Mascotas — Antibacteriano · Control de Ácaros 300 mL',
    'P014': 'Espuma Limpiadora para Mascotas sin Enjuagar 500 mL',
    'P015': 'Espuma Limpiadora para Mascotas sin Enjuagar 300 mL',
    'P016': 'Espuma Limpiadora de Patas para Mascotas 200 mL',
    'P017': 'Detergente para Hogares con Mascotas 1,5 kg',
    'P018': 'Gel Hidratante para Patas 10 g',
    'P019': 'Spray de Protección Exterior para Mascotas 80 mL',
    'P020': 'Spray Repelente de Insectos para Exterior 80 mL',
  },
};

/**
 * The MOQ unit for a product, in the buyer's language.
 *
 * A unit the site does not know falls back to the English one rather than
 * to nothing: an unknown unit printed as "undefined" is worse than an
 * English word in a German sentence.
 */
export function moqUnit(unit: string, locale: string): string {
  const table = MOQ_UNITS[locale] ?? MOQ_UNITS.en;
  return table[unit] ?? unit;
}

/**
 * An application name, in the buyer's language.
 */
export function applicationName(name: string, locale: string): string {
  const table = APPLICATIONS[locale] ?? APPLICATIONS.en;
  return table[name] ?? name;
}

/**
 * The name of a product, in the buyer's language.
 */
export function productName(
  id: string,
  english: string,
  locale: string,
): string {
  const table = PRODUCT_NAMES[locale];
  if (!table) return english;
  return table[id] ?? english;
}

/**
 * The function of a product, in the buyer's language.
 *
 * This is the one sentence under the name, and it is the sentence the
 * buyer reads to decide whether this is the product they are looking
 * for. It carries the claim — the percentage, the pathogen names, the
 * mechanism — and a claim has to survive the translation intact.
 */
export const PRODUCT_FUNCTIONS: Record<string, Record<string, string>> = {
  en: {},
  de: {
    'P001': 'Wirkt gegen Gerüche an der Ursache; 94,2 % Geruchsreduktion, Messbericht NACCYH25014722; für Fell, das das Tier ablecken kann, Sicherheitsbewertung 2024FM11611R02D',
    'P002': 'Wirkt gegen Gerüche an der Ursache; 94,2 % Geruchsreduktion, Messbericht NACCYH25014722; für Fell, das das Tier ablecken kann, Sicherheitsbewertung 2024FM11611R02D',
    'P003': 'Reinigt und neutralisiert Gerüche auf Flächen; biozide Abtötungsangaben nur für Märkte, in denen das Produkt registriert ist, die Registriernummer steht auf dem Etikett',
    'P004': 'Antipilz und geruchsneutralisierend; wirkt gegen feline Dermatophytose (Trichophyton mentagrophytes, Microsporum canis)',
    'P005': 'Sanfte Reinigung des Gehörgangs; löst Ohrenschmalz; hilft gegen Ohrmilben vorzubeugen',
    'P006': 'Zum Trinkwasser geben; Balance der Mundflora; reduziert Plaque und Mundgeruch',
    'P007': 'Bindet und zersetzt Gerüche im Katzenklo; beschleunigt das Klumpen; verlängert die Nutzungsdauer der Streu',
    'P008': 'Bindet und zersetzt Gerüche im Katzenklo; beschleunigt das Klumpen; verlängert die Nutzungsdauer der Streu',
    'P009': 'Set: praktisches Nachfüllen-und-Sprühen-Format für Endverbraucher',
    'P010': 'Multifunktionswaschmittel; sanfte Reinigung und antibakteriell',
    'P011': 'Multifunktionswaschmittel; sanfte Reinigung und antibakteriell',
    'P012': 'Sanfte Reinigung und Pflege; für Katzen und Hunde geeignet',
    'P013': 'Antibakteriell und gegen Milben; wirkt gegen typische Tiermilben und bakterielle Infektionen',
    'P014': 'Reinigungsschaum ohne Abspülen; praktisch zur punktuellen Reinigung von Tieren',
    'P015': 'Reinigungsschaum ohne Abspülen; praktisch zur punktuellen Reinigung von Tieren',
    'P016': 'Reinigt Pfoten vor und nach Spaziergängen',
    'P017': 'Waschmittel, speziell formuliert für Tierhaare und Tiergerüche',
    'P018': 'Pflegt und repariert die Pfotenballen von Tieren',
    'P019': 'Wehrt Insekten bei Outdoor-Aktivitäten ab',
    'P020': 'Wehrt Mücken und Insekten bei Outdoor-Aktivitäten ab',
  },
  es: {
    'P001': 'Actúa sobre el origen del olor; 94,2 % de eliminación de amoníaco, informe NACCYH25014722; formulado para el pelaje que el animal pueda lamer, evaluación de seguridad 2024FM11611R02D',
    'P002': 'Actúa sobre el origen del olor; 94,2 % de eliminación de amoníaco, informe NACCYH25014722; formulado para el pelaje que el animal pueda lamer, evaluación de seguridad 2024FM11611R02D',
    'P003': 'Limpia y desodoriza superficies; las afirmaciones biocidas solo se hacen en mercados donde el producto está registrado, y el número de registro está en la etiqueta',
    'P004': 'Antifúngico y neutralizador de olores; actúa contra los hongos de la tiña felina (Trichophyton mentagrophytes, Microsporum canis)',
    'P005': 'Limpieza suave del conducto auditivo; disuelve la cerumen; ayuda a prevenir ácaros',
    'P006': 'Se añade al agua de bebida; equilibra la flora oral; reduce la placa y el mal aliento',
    'P007': 'Absorbe y descompone el olor del arenero; acelera el agrupamiento; prolonga la vida de la arena',
    'P008': 'Absorbe y descompone el olor del arenero; acelera el agrupamiento; prolonga la vida de la arena',
    'P009': 'Kit: formato práctico de recargar y rociar para el consumidor final',
    'P010': 'Lavado multiusos; limpieza suave y efecto antibacteriano',
    'P011': 'Lavado multiusos; limpieza suave y efecto antibacteriano',
    'P012': 'Limpieza suave y acondicionamiento; apto para gatos y perros',
    'P013': 'Antibacteriano y control de ácaros; actúa contra ácaros comunes e infecciones bacterianas',
    'P014': 'Espuma limpiadora sin enjuagar; práctico para la limpieza puntual de mascotas',
    'P015': 'Espuma limpiadora sin enjuagar; práctico para la limpieza puntual de mascotas',
    'P016': 'Limpia las patas antes y después de los paseos',
    'P017': 'Detergente formulado específicamente para el pelo y los olores de las mascotas',
    'P018': 'Hidrata y repara las almohadillas plantares de las mascotas',
    'P019': 'Repele insectos durante las actividades al aire libre',
    'P020': 'Repele mosquitos e insectos durante las actividades al aire libre',
  },
};

/**
 * The function of a product, in the buyer's language.
 */
export function productFunction(id: string, english: string, locale: string): string {
  const table = PRODUCT_FUNCTIONS[locale];
  if (!table) return english;
  return table[id] ?? english;
}
