/**
 * The words of the core pages, in the buyer's language.
 *
 * These are the five pages a buyer lands on and decides on: the
 * catalogue (what do you make), the contact page (how do I reach you),
 * the certifications (can I prove it), the factory (are you real) and
 * the compliance page (can you ship into my market).
 *
 * The headline of each is written in the buyer's own words, because
 * the headline is the sentence the buyer reads to decide whether to
 * keep reading. A translated headline is a headline that reads like a
 * translation, and a buyer who reads that reads the next page too.
 *
 * The meta description and the meta title are in the same table: they
 * are the same sentence, said to the search engine.
 */

/** The strings of one page, in one language. */
export type PageCopy = {
  title: string;
  description: string;
  h1: string;
  lead: string;
  eyebrow: string;
};

export const PAGE_COPY: Record<string, Record<string, PageCopy>> = {
  products: {
    en: {
      eyebrow: 'Catalogue',
      title: 'OEM Pet Care Catalogue',
      description: 'Private-label pet care SKUs from China manufacturers.',
      h1: '{count} private label pet products. Shampoo, deodorizer, foam and litter deodorizer. Quote on request.',
      lead: 'Four product lines, private label and white label across all of them. Every card leads with the commitments that decide an order — minimum quantity, stock lead time and shelf life. Can you order one SKU? Yes, from 1,000 sets on a bundled set or 2,000 on a catalogue SKU; below that the order has to be a set. Our factory in Heyuan, Guangdong produces up to 1,000,000 bottles a month in a 5,000 m² ISO 22716 GMP workshop; 10 third-party lab reports from GDDCM and NACC are published on this site.',
    },
    de: {
      eyebrow: 'Katalog',
      title: 'OEM Tierpflege Katalog',
      description: '20 Tierpflege-Produkte mit Private Label aus China: Geruchsneutralisierung, Katzenstreu, Shampoo, Schaum, Pfotenpflege. MOQ ab 1.000.',
      h1: '{count} Tierpflege-Produkte mit Private Label. Shampoo, Geruchsneutralisierung, Schaum und Katzenstreu-Deo. Preis auf Anfrage.',
      lead: 'Vier Produktlinien, alle mit Private Label. Auf jeder Karte steht zuerst, was eine Bestellung entscheidet — Mindestbestellmenge, Lieferzeit ab Lager und Haltbarkeit. Unser Werk in Heyuan, Guangdong produziert bis zu 300.000 Flaschen pro Monat in einer 5.000 m² ISO-22716-GMP-Werkstatt; 10 Laborberichte von GDDCM und NACC sind hier veröffentlicht.',
    },
    es: {
      eyebrow: 'Catálogo',
      title: 'Catálogo OEM para mascotas',
      description: '20 productos para mascotas con private label de China: desodorizantes, polvo para arena, champú, espuma, patas. Desde 1.000.',
      h1: '{count} productos para mascotas con private label. Champú, desodorizante, espuma y desodorizante de arena. Precio bajo solicitud.',
      lead: 'Cuatro líneas de producto, todas con private label. Cada ficha empieza por lo que decide un pedido: pedido mínimo, plazo de entrega de stock y vida útil. Nuestra planta en Heyuan, Guangdong produce hasta 300.000 botellas al mes en un taller GMP ISO 22716 de 5.000 m²; aquí publicamos 10 informes de laboratorio de GDDCM y NACC.',
    },
  },
  contact: {
    en: {
      eyebrow: 'Contact',
      title: 'Request a quotation',
      description: 'One business day to a first answer.',
      h1: 'Request a quotation for private-label pet care.',
      lead: 'One business day to a first answer.',
    },
    de: {
      eyebrow: 'Kontakt',
      title: 'Angebot anfordern',
      description: 'Angebot für Tierpflege-Produkte mit Private Label anfordern: erste Antwort innerhalb eines Arbeitstags, ISO 22716 GMP, FDA-registriert, Export seit 2020.',
      h1: 'Angebot für Tierpflege-Produkte mit Private Label anfordern.',
      lead: 'Erste Antwort innerhalb eines Arbeitstags.',
    },
    es: {
      eyebrow: 'Contacto',
      title: 'Solicitar cotización',
      description: 'Cotización de productos para mascotas con private label: primera respuesta en un día laborable, GMP ISO 22716, registrado en la FDA, exportando desde 2020.',
      h1: 'Solicite una cotización de productos para mascotas con private label.',
      lead: 'Primera respuesta en un día laborable.',
    },
  },
  certifications: {
    en: {
      eyebrow: 'Certifications',
      title: 'Third-party reports and licences',
      description: 'The lab reports themselves, not descriptions of them.',
      h1: 'Documents, not badges.',
      lead: 'These are the documents themselves, not descriptions of them.',
    },
    de: {
      eyebrow: 'Zertifizierungen',
      title: 'Laborberichte und Lizenzen',
      description: 'Die Laborberichte selbst: zehn Drittanbieter-Prüfberichte von GDDCM und NACC aus CMA- und CNAS-akreditierten Laboren, dazu drei chinesische Lizenzen.',
      h1: 'Dokumente, keine Abzeichen.',
      lead: 'Das sind die Dokumente selbst, keine Beschreibung von ihnen.',
    },
    es: {
      eyebrow: 'Certificaciones',
      title: 'Informes de laboratorio y licencias',
      description: 'Los informes en sí: diez informes de terceros de GDDCM y NACC de laboratorios acreditados CMA y CNAS, con número verificable, más tres licencias chinas.',
      h1: 'Documentos, no distintivos.',
      lead: 'Son los documentos en sí, no una descripción de ellos.',
    },
  },
  factory: {
    en: {
      eyebrow: 'Factory',
      title: 'Pet Care Factory China | 30,000m² GMP, 1M Bottles/Month',
      description: 'A 30,000 m² park, photographed.',
      h1: 'A 30,000 m² park, photographed.',
      lead: 'Visit in person or book a video audit — the same floor, the same lines, the same QC bench.',
    },
    de: {
      eyebrow: 'Werk',
      title: 'Tierpflege-Fabrik China | 30.000 m² GMP',
      description: 'Ein 30.000-m²-Gelände in Heyuan, Guangdong: 5.000 m² ISO-22716-GMP-Werkstatt, sechs Abfülllinien, 220 Mitarbeiter, 300.000 Flaschen pro Monat.',
      h1: 'Ein 30.000-m²-Gelände, fotografiert.',
      lead: 'Besuchen Sie uns persönlich oder buchen Sie ein Video-Audit — dieselbe Halle, dieselben Linien, derselbe QS-Prüfstand.',
    },
    es: {
      eyebrow: 'Fábrica',
      title: 'Fábrica de productos para mascotas | 30.000 m² GMP',
      description: 'Un recinto de 30.000 m² en Heyuan, Guangdong: 5.000 m² de taller GMP ISO 22716, seis líneas, 220 empleados, 300.000 botellas al mes.',
      h1: 'Un recinto de 30.000 m², fotografiado.',
      lead: 'Visítenos en persona o reserve una auditoría por vídeo: la misma nave, las mismas líneas, el mismo banco de control de calidad.',
    },
  },
  'global-compliance': {
    en: {
      eyebrow: 'Global Compliance',
      title: 'OEM Pet Product Compliance Support | FDA, CPNP, APVMA',
      description: 'Tell us the destination market and we will tell you in writing what has to be filed.',
      h1: 'Global regulatory compliance support.',
      lead: 'Tell us the destination market and we will tell you — in writing — what has to be filed, what we prepare, and what stays yours.',
    },
    de: {
      eyebrow: 'Globale Compliance',
      title: 'Compliance-Unterstützung für OEM Tierpflege | FDA, CPNP, APVMA',
      description: 'Nennen Sie uns den Zielmarkt — wir sagen Ihnen schriftlich, was einzureichen ist.',
      h1: 'Unterstützung bei der weltweiten regulatorischen Compliance.',
      lead: 'Nennen Sie uns den Zielmarkt — wir sagen Ihnen schriftlich, was einzureichen ist, was wir vorbereiten und was bei Ihnen bleibt.',
    },
    es: {
      eyebrow: 'Cumplimiento Global',
      title: 'Cumplimiento normativo OEM para mascotas | FDA, CPNP, APVMA',
      description: 'Indíquenos el mercado de destino y le diremos por escrito qué hay que presentar.',
      h1: 'Apoyo al cumplimiento normativo internacional.',
      lead: 'Indíquenos el mercado de destino y le diremos por escrito qué hay que presentar, qué preparamos nosotros y qué queda en sus manos.',
    },
  },

  /*
   * The rest of the public pages.
   *
   * The five above were the first five a buyer lands on. These are the
   * other public pages: the ones a buyer reaches after deciding to look
   * closer, and the legal ones every site has to carry.
   */
  home: {
    en: {
      eyebrow: 'Pet care OEM/ODM factory',
      title: 'Pet Care Products Manufacturers in China | SHENHE ZHONGKE',
      description:
        'ISO 22716 GMP pet care products manufacturers in Heyuan, China. 20 private-label SKUs — shampoo, deodorizing spray, litter powder, grooming, outdoor protection.',
      h1: 'Pet care products manufacturers in China: shampoo, deodorizer, grooming and outdoor protection.',
      lead: 'We formulate, fill and ship for pet brands, distributors and grooming suppliers — 20 ready-to-ship SKUs, 1,000,000 bottles a month, and the lab reports to back every claim.',
    },
    de: {
      eyebrow: 'Tierpflege OEM/ODM Hersteller',
      title: 'OEM Tierpflege Hersteller China | Shampoo & Geruchsneutralisierung',
      description:
        'Tierpflegehersteller mit ISO-22716-GMP in Heyuan, China. 20 Private-Label-SKUs — Shampoo, Geruchsneutralisierungsspray, Katzenstreu-Pulver, Pflege, Outdoor-Schutz.',
      h1: 'Tierpflege-Produktion mit Private Label: Shampoo, Geruchsneutralisierung, Pflege und Outdoor-Schutz.',
      lead: 'Wir entwickeln, abfüllen und verschiffen für Tiermarken, Distributoren und Beauty-Salons — 20 lieferfertige SKUs, 300.000 Flaschen pro Monat, und Laborberichte für jede Angabe.',
    },
    es: {
      eyebrow: 'Fabricante OEM/ODM de productos para mascotas',
      title: 'Fabricante de productos para mascotas OEM en China',
      description:
        'Fábrica de productos para mascotas con GMP ISO 22716 en Heyuan, China. 20 productos con private label: champú, spray desodorizante, polvo para arena, cuidado y protección exterior.',
      h1: 'Fabricación de productos para mascotas con private label: champú, neutralización de olores, cuidado y protección exterior.',
      lead: 'Formulamos, llenamos y enviamos para marcas de mascotas, distribuidores y salones de peluquería: 20 productos listos para enviar, 300.000 botellas al mes y los informes de laboratorio que respaldan cada afirmación.',
    },
  },
  about: {
    en: {
      eyebrow: 'About us',
      title: 'About SHENHE ZHONGKE · Pet Care Products Manufacturers Since 2020',
      description:
        'SHENHE ZHONGKE — a national high-tech pet care products manufacturer, founded 2020 in Heyuan, Guangdong. 20 private-label SKUs across 4 product lines.',
      h1: 'SHENHE ZHONGKE (深河中科) — a national high-tech pet care OEM and ODM manufacturer in China, exporting since 2020.',
      lead: 'In-house R&D, mature product lines, and a self-built independent export company. We help global pet brands ship faster with formulas that are lab-verified, patented, and ready to scale.',
    },
    de: {
      eyebrow: 'Über uns',
      title: 'Über SHENHE ZHONGKE · Tierpflege OEM/ODM Hersteller seit 2020',
      description:
        'SHENHE ZHONGKE — ein nationaler Hochtechnologie-Hersteller für Tierpflege, gegründet 2020 in Heyuan, Guangdong. 20 Private-Label-SKUs in 4 Produktlinien.',
      h1: 'SHENHE ZHONGKE (深河中科) — ein nationaler Hochtechnologie-Hersteller für Tierpflege-OEM und -ODM in China, exportiert seit 2020.',
      lead: 'F&E in Partnerschaft mit Hochschulen, ausgereifte Produktlinien und eine selbst gebaute, unabhängige Exportstation. Wir helfen globalen Tiermarken, schneller zu liefern — mit Rezepturen, die laborgeprüft, patentiert und skalierbar sind.',
    },
    es: {
      eyebrow: 'Sobre nosotros',
      title: 'Sobre SHENHE ZHONGKE | Fabricante OEM/ODM desde 2020',
      description:
        'SHENHE ZHONGKE — fabricante nacional de alta tecnología de productos para mascotas, fundado en 2020 en Heyuan, Guangdong. 20 productos con private label en 4 líneas de producto.',
      h1: 'SHENHE ZHONGKE (深河中科) — fabricante OEM y ODM de productos para mascotas de alta tecnología en China, exportando desde 2020.',
      lead: 'I+D en colaboración con universidades, líneas de producto maduras y una estación de exportación propia e independiente. Ayudamos a las marcas globales de mascotas a enviar más rápido con fórmulas verificadas en laboratorio, patentadas y listas para escalar.',
    },
  },
  'ai-customize': {
    en: {
      eyebrow: 'AI Product Match',
      title: 'AI Product Match for Pet Care Sourcing | SHENHE ZHONGKE',
      description:
        'AI customization wizard — answer 4 questions, get the top 5 SKU matches from our 20-product private-label catalogue.',
      h1: 'Four questions. Your top five SKUs.',
      lead: 'Answer four questions about your target product and we will match you to the five catalogue SKUs that fit — with the reason for each, the minimum order, and the private-label option. No account, no upload, nothing sent anywhere.',
    },
    de: {
      eyebrow: 'KI-Produktmatch',
      title: 'KI-Produktmatch für die Tierpflege-Beschaffung',
      description:
        'KI-Wizard zur Auswahl — 4 Fragen beantworten, die besten 5 SKU-Treffer aus unserem 20-Produkte-Private-Label-Katalog.',
      h1: 'Vier Fragen. Ihre besten fünf SKUs.',
      lead: 'Beantworten Sie vier Fragen zu Ihrem Zielprodukt, und wir ordnen Ihnen die fünf passenden Katalog-SKUs zu — mit der Begründung für jeden, der Mindestbestellmenge und der Private-Label-Option. Kein Konto, kein Upload, nichts wird übertragen.',
    },
    es: {
      eyebrow: 'Match de producto con IA',
      title: 'Match de producto con IA para compras de mascotas',
      description:
        'Asistente de selección con IA — responda 4 preguntas y obtenga las 5 mejores coincidencias de SKU de nuestro catálogo de 20 productos con private label.',
      h1: 'Cuatro preguntas. Sus cinco mejores SKU.',
      lead: 'Responda cuatro preguntas sobre su producto objetivo y le asignaremos los cinco SKU del catálogo que encajan — con el motivo de cada uno, el pedido mínimo y la opción de private label. Sin cuenta, sin subir nada, no se envía nada a ninguna parte.',
    },
  },
  blog: {
    en: {
      eyebrow: 'Guides',
      title: 'OEM Pet Care Insights & Guides | SHENHE ZHONGKE',
      description:
        'Practical guides for pet care brands sourcing from China manufacturers: formulation, MOQ, labelling and compliance per market.',
      h1: 'Sourcing & technical guides.',
      lead: 'Written by our R&D and compliance team for importers — the questions they actually answer on the first call.',
    },
    de: {
      eyebrow: 'Ratgeber',
      title: 'OEM Tierpflege: Insights & Ratgeber | SHENHE ZHONGKE',
      description:
        'Praxisnahe Ratgeber für Tierpflege-Marken, die bei einem Hersteller in China einkaufen: Rezeptur, MOQ, Etikettierung und Compliance je Markt.',
      h1: 'Einkaufs- und Technik-Ratgeber.',
      lead: 'Geschrieben von unserem F&E- und Compliance-Team für Importeure — die Fragen, die sie im ersten Gespräch tatsächlich stellen.',
    },
    es: {
      eyebrow: 'Guías',
      title: 'OEM de mascotas: ideas y guías | SHENHE ZHONGKE',
      description:
        'Guías prácticas para marcas de mascotas que compran a un fabricante en China: formulación, pedido mínimo, etiquetado y cumplimiento por mercado.',
      h1: 'Guías de compras y técnicas.',
      lead: 'Escrito por nuestro equipo de I+D y cumplimiento para importadores: las preguntas que realmente hacen en la primera llamada.',
    },
  },
  capabilities: {
    en: {
      eyebrow: 'R&D',
      title: 'Pet Care R&D Capabilities | Custom Formula Development',
      description:
        'Pet care R&D in China: 8 in-house chemists, 2 of them PhDs from South China University of Technology. Custom formula in 30–45 days, lab samples in 7–10 days. Six-step QC, batch COA.',
      h1: 'What we can develop.',
      lead: "A claim on your label has to survive someone else's QA team — and most suppliers cannot show you the file that proves it.",
    },
    de: {
      eyebrow: 'F&E',
      title: 'F&E-Kompetenz für Tierpflege | Entwicklung eigener Rezepturen',
      description:
        'Tierpflege-F&E in China: 8 Chemiker im Haus, 2 Hochschulkooperationen. Eigene Rezeptur in 30–45 Tagen, Laborproben in 7–10 Tagen. QC in sechs Schritten, Chargen-COA.',
      h1: 'Was wir entwickeln können.',
      lead: 'Eine Aussage auf Ihrem Etikett muss das QA-Team eines anderen überstehen — und die meisten Lieferanten können Ihnen die Datei nicht zeigen, die das belegt.',
    },
    es: {
      eyebrow: 'I+D',
      title: 'Capacidad de I+D en productos para mascotas',
      description:
        'I+D de productos para mascotas en China: 8 químicos internos, 2 alianzas con universidades. Fórmula propia en 30–45 días, muestras en 7–10 días. QC en seis pasos, COA por lote.',
      h1: 'Qué podemos desarrollar.',
      lead: 'Una afirmación en su etiqueta tiene que superar al equipo de calidad de otro: y la mayoría de proveedores no pueden mostrarle el archivo que lo demuestra.',
    },
  },
  msds: {
    en: {
      eyebrow: 'Safety data',
      title: 'Pet Product MSDS & SDS Sheets | SHENHE ZHONGKE',
      description:
        'MSDS and SDS for private-label pet care: deodorizing sprays, disinfectants, shampoos, cleansers and paw care. Ask for the safety data sheet of your SKU.',
      h1: 'Material Safety Data Sheets',
      lead: 'MSDS available for all 20 SKUs. Click any product to download.',
    },
    de: {
      eyebrow: 'Sicherheitsdaten',
      title: 'MSDS- und SDS-Blätter für Tierpflege | SHENHE ZHONGKE',
      description:
        'MSDS und SDS für Tierpflege mit Private Label: Geruchsneutralisierungssprays, Desinfektionsmittel, Shampoos, Reiniger und Pfotenpflege. Fordern Sie das Datenblatt Ihres SKU an.',
      h1: 'Sicherheitsdatenblätter (MSDS)',
      lead: 'Für alle 20 SKUs sind MSDS verfügbar. Klicken Sie auf ein Produkt, um es herunterzuladen.',
    },
    es: {
      eyebrow: 'Datos de seguridad',
      title: 'Fichas MSDS y SDS de productos para mascotas | SHENHE ZHONGKE',
      description:
        'MSDS y SDS para productos para mascotas con private label: sprays neutralizadores, desinfectantes, champús, limpiadores y cuidado de patas. Pida la ficha de seguridad de su SKU.',
      h1: 'Fichas de datos de seguridad (MSDS)',
      lead: 'Hay MSDS disponibles para los 20 SKU. Haga clic en cualquier producto para descargarla.',
    },
  },
  'oem-odm': {
    en: {
      eyebrow: 'OEM & ODM',
      title: 'Pet Care OEM ODM Manufacturers | MOQ from 1,000 Sets',
      description:
        'Compare OEM vs ODM for pet care: make-to-spec OEM from 1,000 sets, ODM from 1,000 sets. Chargeable samples, ISO 22716 GMP, China factory since 2020.',
      h1: 'Private label, white label or custom formulation?',
      lead: 'Two routes to a private-label pet care line — your formula, or ours. Compare them below, pick one, and request a quotation within one business day.',
    },
    de: {
      eyebrow: 'OEM & ODM',
      title: 'Tierpflege OEM/ODM Hersteller | MOQ ab 1.000 Stück',
      description:
        'OEM und ODM für Tierpflege vergleichen: Make-to-Spec-OEM ab 1.000 Stück, ODM ab 1.000 Sets. Kostenpflichtige Muster, ISO 22716 GMP, Hersteller in China seit 2020.',
      h1: 'Welche Leistung passt zu Ihrer Marke?',
      lead: 'Zwei Wege zu einer Tierpflege-Linie mit Private Label — Ihre Rezeptur oder unsere. Vergleichen Sie beide, wählen Sie einen, und erhalten Sie innerhalb eines Arbeitstags ein Angebot.',
    },
    es: {
      eyebrow: 'OEM y ODM',
      title: 'Fabricante OEM/ODM de productos para mascotas',
      description:
        'Compare OEM y ODM para productos para mascotas: OEM a su especificación desde 1.000 unidades, ODM desde 1.000 sets. Muestras de pago, ISO 22716 GMP, fábrica en China desde 2020.',
      h1: '¿Qué servicio encaja con su marca?',
      lead: 'Dos caminos hacia una línea de productos para mascotas con private label: su fórmula o la nuestra. Compárelos, elija uno y reciba una cotización en un día laborable.',
    },
  },
  privacy: {
    en: {
      eyebrow: 'Legal',
      title: 'Privacy Policy · SHENHE ZHONGKE',
      description:
        'Privacy policy of SHENHE ZHONGKE — how we collect, store and protect customer data on shenhezhongke.com. Covers enquiry forms, accounts and analytics.',
      h1: 'Privacy Policy',
      lead: 'Last updated: 2026-09-08',
    },
    de: {
      eyebrow: 'Rechtliches',
      title: 'Datenschutzerklärung · SHENHE ZHONGKE',
      description:
        'Datenschutzerklärung von SHENHE ZHONGKE — wie wir Kundendaten auf shenhezhongke.com erheben, speichern und schützen. Betrifft Anfrageformulare, Konten und Analytik.',
      h1: 'Datenschutzerklärung',
      lead: 'Zuletzt aktualisiert: 2026-09-08',
    },
    es: {
      eyebrow: 'Legal',
      title: 'Política de Privacidad · SHENHE ZHONGKE',
      description:
        'Política de privacidad de SHENHE ZHONGKE: cómo recopilamos, almacenamos y protegemos los datos de clientes en shenhezhongke.com. Cubre formularios de consulta, cuentas y analítica.',
      h1: 'Política de Privacidad',
      lead: 'Última actualización: 2026-09-08',
    },
  },
  terms: {
    en: {
      eyebrow: 'Legal',
      title: 'Terms of Service · SHENHE ZHONGKE',
      description:
        'Terms of Service for SHENHE ZHONGKE B2B portal. Covers OEM/ODM engagement, quotation, intellectual property, and dispute resolution.',
      h1: 'Terms of Service',
      lead: 'Last updated: 2026-09-08',
    },
    de: {
      eyebrow: 'Rechtliches',
      title: 'Nutzungsbedingungen · SHENHE ZHONGKE',
      description:
        'Nutzungsbedingungen für das B2B-Portal von SHENHE ZHONGKE: OEM/ODM-Projekte, Angebote, geistiges Eigentum und Streitbeilegung.',
      h1: 'Nutzungsbedingungen',
      lead: 'Zuletzt aktualisiert: 2026-09-08',
    },
    es: {
      eyebrow: 'Legal',
      title: 'Términos del Servicio · SHENHE ZHONGKE',
      description:
        'Términos del Servicio del portal B2B de SHENHE ZHONGKE: proyectos OEM/ODM, cotizaciones, propiedad intelectual y resolución de controversias.',
      h1: 'Términos del Servicio',
      lead: 'Última actualización: 2026-09-08',
    },
  },
  'sourcing-guides': {
    en: {
      eyebrow: 'Sourcing Guides',
      title: 'Pet Product Sourcing Guides | MOQ, Import, Compliance',
      description:
        'Guides for buyers importing pet care from China manufacturers: what MOQ really means, how to read an MSDS, compliance per destination market.',
      h1: 'The detail you need before the enquiry.',
      lead: 'Written by our R&D and compliance team for importers — the questions they actually answer on the first call.',
    },
    de: {
      eyebrow: 'Einkaufs-Ratgeber',
      title: 'Einkaufs-Ratgeber Tierpflege | MOQ, Import, Compliance',
      description:
        'Ratgeber für Käufer, die Tierpflege bei einem Hersteller in China importieren: was MOQ wirklich bedeutet, wie man ein MSDS liest, Compliance je Zielmarkt.',
      h1: 'Die Details, die Sie vor der Anfrage brauchen.',
      lead: 'Geschrieben von unserem F&E- und Compliance-Team für Importeure — die Fragen, die sie im ersten Gespräch tatsächlich stellen.',
    },
    es: {
      eyebrow: 'Guías de compras',
      title: 'Guías de compra de productos para mascotas | MOQ e importación',
      description:
        'Guías para quien compra productos para mascotas a un fabricante en China: qué significa realmente el pedido mínimo, cómo leer un MSDS y el cumplimiento por mercado de destino.',
      h1: 'El detalle que necesita antes de escribirnos.',
      lead: 'Escrito por nuestro equipo de I+D y cumplimiento para importadores: las preguntas que realmente hacen en la primera llamada.',
    },
  },
  standards: {
    en: {
      eyebrow: 'How we verify',
      title: 'How We Verify Pet Care Claims | SHENHE ZHONGKE',
      description:
        'Where every figure on this site comes from: the product catalogue, ten third-party laboratory reports with their numbers, the permits on file, and who reviews each guide.',
      h1: 'Every number here has a source you can check.',
      lead: 'The catalogue behind the product pages. Ten laboratory reports with their numbers on them. The permits we hold, with their validity dates. And the team that reads them before a guide goes out.',
    },
    de: {
      eyebrow: 'Wie wir prüfen',
      title: 'Wie wir Angaben zu Tierpflege belegen | SHENHE ZHONGKE',
      description:
        'Woher jede Zahl auf dieser Website stammt: den Produktkatalog, zehn Laborberichte Dritter mit ihren Nummern, die vorhandenen Genehmigungen und wer jeden Ratgeber prüft.',
      h1: 'Jede Zahl hier hat eine Quelle, die Sie prüfen können.',
      lead: 'Der Katalog hinter den Produktseiten. Zehn Laborberichte mit ihren Nummern. Die Genehmigungen, die wir halten, mit ihren Gültigkeitsdaten. Und das Team, das alles prüft, bevor ein Ratgeber veröffentlicht wird.',
    },
    es: {
      eyebrow: 'Cómo verificamos',
      title: 'Cómo verificamos las afirmaciones sobre productos para mascotas',
      description:
        'De dónde sale cada cifra de este sitio: el catálogo de productos, diez informes de laboratorio de terceros con sus números, los permisos que tenemos y quién revisa cada guía.',
      h1: 'Cada cifra de aquí tiene una fuente que usted puede comprobar.',
      lead: 'El catálogo detrás de las páginas de producto. Diez informes de laboratorio con sus números. Los permisos que poseemos, con sus fechas de validez. Y el equipo que los revisa antes de publicar una guía.',
    },
  },
  'trade-compliance': {
    en: {
      eyebrow: 'Trade compliance',
      title: 'Pet Product Export & Trade Terms | SHENHE ZHONGKE',
      description:
        'B2B export trade terms for pet product sourcing: VAT, Incoterms 2020, payment, FX, cancellation, dispute resolution, regulatory compliance, ESG.',
      h1: 'Trade Compliance Policies',
      lead: 'Full B2B export policies for pet care manufacturers in Heyuan, Guangdong, China. Effective 2026-09-15, reviewed annually or upon regulatory change, and applying to every RFQ, contract and shipment from an ISO 22716 GMP workshop.',
    },
    de: {
      eyebrow: 'Handels-Compliance',
      title: 'Export- und Handelsbedingungen für Tierpflege | SHENHE ZHONGKE',
      description:
        'B2B-Exportbedingungen für die Tierpflege-Beschaffung: USt, Incoterms 2020, Zahlung, Devisen, Storno, Streitbeilegung, regulatorische Compliance, ESG.',
      h1: 'Handels-Compliance-Richtlinien',
      lead: 'Die vollständigen B2B-Exportrichtlinien eines Tierpflege-Herstellers in Heyuan, Guangdong, China. Gültig ab 2026-09-15, jährlich oder bei regulatorischen Änderungen überprüft, und geltend für jede Anfrage, jeden Vertrag und jede Sendung aus einer ISO-22716-GMP-Produktion.',
    },
    es: {
      eyebrow: 'Cumplimiento comercial',
      title: 'Condiciones de exportación y comercio de productos para mascotas',
      description:
        'Condiciones B2B de exportación para la compra de productos para mascotas: IVA, Incoterms 2020, pago, divisas, cancelación, resolución de controversias, cumplimiento normativo y ESG.',
      h1: 'Políticas de cumplimiento comercial',
      lead: 'Políticas completas de exportación B2B de un fabricante de productos para mascotas en Heyuan, Guangdong, China. Vigentes desde 2026-09-15, revisadas cada año o ante cambios normativos, y aplicables a cada consulta, contrato y envío de un taller con GMP ISO 22716.',
    },
  },
  'why-us': {
    en: {
      eyebrow: 'Why us',
      title: 'Why Us — Four Checks, and How to Run Them | SHENHE ZHONGKE',
      description:
        'Four questions decide a pet care factory: can you make my format, can you prove it, what goes wrong if it does, and who answers. Here is how each is checked.',
      h1: 'Four checks. Here is how you run them on any factory — including this one.',
      lead:
        'Rather than say we are better, this page publishes the four questions that decide it, and the address of every document behind our answer to each one.',
    },
    de: {
      eyebrow: 'Warum wir',
      title: 'Warum wir — vier Prüfungen, die Sie selbst durchführen können',
      description:
        'Vier Fragen entscheiden eine Tierpflege-Fabrik: Können Sie mein Format, können Sie es belegen, was passiert, wenn nicht, und wer antwortet. So wird jede geprüft.',
      h1: 'Vier Prüfungen. So führen Sie sie bei jeder Fabrik — auch bei dieser.',
      lead:
        'Statt zu sagen, dass wir besser sind, veröffentlicht diese Seite die vier Fragen, die darüber entscheiden, und die Adresse jedes Dokuments hinter unserer Antwort.',
    },
    es: {
      eyebrow: 'Por qué nosotros',
      title: 'Por qué nosotros — cuatro comprobaciones que puede hacer usted',
      description:
        'Cuatro preguntas deciden una fábrica de productos para mascotas: puede fabricar mi formato, puede demostrarlo, qué pasa si no, y quién responde. Así se comprueba.',
      h1: 'Cuatro comprobaciones. Así se hacen en cualquier fábrica — también en esta.',
      lead:
        'En lugar de decir que somos mejores, esta página publica las cuatro preguntas que lo deciden y la dirección de cada documento que respalda nuestra respuesta.',
    },
  },
};

/**
 * The copy of a page, in the buyer's language.
 *
 * A page that has no translation yet falls back to English rather than
 * to nothing. The build gate checks that every published language has
 * the pages it claims to have, so this is a safety net for a page added
 * after the check.
 */
export function pageCopy(slug: string, locale: string): PageCopy {
  const table = PAGE_COPY[slug];
  if (!table) {
    return { eyebrow: '', title: '', description: '', h1: '', lead: '' };
  }
  return table[locale] ?? table.en;
}

/**
 * The slug of a page, for the copy table.
 *
 * The legacy page records carry a source path like "products/pet-shampoo.html"
 * or "certifications.html". The slug is that path without the extension, so
 * "products/index.html" is "products" and "blog/index.html" is "blog" — the
 * keys the copy table actually uses.
 *
 * WHY THE DIRECTORY IS KEPT
 * Two pages can share a last segment: the catalogue is "products/index.html"
 * and a product is "products/pet-shampoo.html". Taking only the last segment
 * collapses both onto "index" and "pet-shampoo", a slug the table answers to
 * for the wrong page.
 *
 * THIS FUNCTION USED TO EXIST TWICE.
 * One copy lived here and took the last segment; the other lived in
 * components/LegacyPage.tsx and kept the directory. The one here was dead
 * code, and it was wrong: it turned "blog/index.html" into "index", a key
 * the table does not have, so the blog index could never find its translation.
 * One definition, in the module that owns the table it indexes.
 */
export function pageSlug(source: string): string {
  const clean = source.replace(/^content\//, '').replace(/^\//, '');
  const withoutIndex = clean.replace(/index\.html$/, '');
  /* "blog/index.html" -> "blog", not "blog/" - a trailing slash is a
     different key and the translation table would not answer to it. */
  return withoutIndex.replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * The SKU count that goes after a catalogue title, in the buyer's language.
 *
 * The number is a fact; the word around it is not. The suffix used to be a
 * German word for every language, so the Spanish catalogue was titled
 * "… | 20 Private-Label-Produkte" — a German phrase on a Spanish page.
 */
export const SKU_COUNT_SUFFIX: Record<'de' | 'es', string> = {
  de: 'Private-Label-Produkte',
  es: 'productos private label',
};
