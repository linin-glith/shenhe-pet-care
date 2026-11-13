/**
 * The questions a page answers, in the buyer's language.
 *
 * WHY A FAQPage IS LOCALISED WITH EVERYTHING ELSE
 * A FAQPage schema is a claim: "these questions are answered here". On a
 * German page, a German buyer, a German search engine and a German
 * assistant all read that claim. An English FAQ on a German page says
 * two things at once — that the page is German, and that the answer to a
 * German buyer's question is in English. The second half undoes the
 * first, and a page that says it is German and then answers in English
 * is worse for the engine than a page with no FAQ at all.
 *
 * So the questions and the answers are translated together, and the
 * schema is generated from the same array the page renders — the schema
 * cannot claim an answer the page does not show.
 *
 * THE ANSWERS KEEP THEIR NUMBERS
 * The minimum order, the lead time, the report numbers, the licence
 * numbers and the dates are facts, not sentences, and a fact does not
 * change with the language. 2,000 bottles is 2.000 Flaschen and 2.000
 * botellas; the report number NACCYH25014722 is the same string in all
 * three languages.
 */

/** One question and its answer, in one language. */
export type LocalisedFaq = { q: string; a: string };

export type FaqSet = 'home' | 'catalogue' | 'certifications';

/**
 * The questions, in each language.
 *
 * The English set lives with the page that owns it — home-faq.ts,
 * catalogue-faq.ts, certifications-faq.ts — because the English
 * questions are the ones that were written and reviewed. This table
 * holds only the translations, so a change to the English question is a
 * change in one file and the missing translation shows up here.
 */
export const FAQ_LOCALISED: Record<FaqSet, Record<'de' | 'es', LocalisedFaq[]>> = {
  home: {
    de: [
      {
        q: 'Wie hoch ist Ihre Mindestbestellmenge?',
        a: '1.000 Stück für die gebündelten Sets (das Probiotik-Set und die Sprühpistolen-Kit) und 2.000 Stück für die übrigen Katalog-SKUs. Beide Werte stehen je SKU auf der Produktseite. Bei Folgebestellungen entfällt die Mindestbestellmenge, sobald eine Rezeptur unterzeichnet ist.',
      },
      {
        q: 'Wie lange dauert die Produktion?',
        a: '7–15 Tage für gelagerte Katalogrezepturen, 25–40 Tage für Private Label einschließlich Muster und Freigabe der Etikettengestaltung. Die Lieferzeit steht je SKU auf der Produktseite.',
      },
      {
        q: 'Welche Zertifizierungen und Prüfberichte besitzen Sie?',
        a: 'ISO 22716 Kosmetik-GMP mit Reinheitsklasse D, FDA-Betriebsregistrierung sowie eine Produktionserlaubnis für Desinfektionsmittel und Futtermittelzusätze. Zehn Drittanbieter-Prüfberichte stehen auf der Zertifizierungsseite zum Download bereit.',
      },
      {
        q: 'In welche Märkte exportieren Sie bereits?',
        a: 'In zwölf oder mehr, konzentriert auf Russland, Brasilien, die EAEU und die EU. Die Handelskonformitätsdokumente für diese Ziele stehen auf der Trade-Compliance-Seite.',
      },
      {
        q: 'Veröffentlichen Sie Preise?',
        a: 'Nein. Die Preise werden ausschließlich auf Anfrage erstellt, weil sie von Mengenstaffel, Verpackungsspezifikation und Zielmarkt abhängen. Senden Sie uns SKU und Jahresmenge — Sie erhalten gestaffelte Preise innerhalb eines Arbeitstags.',
      },
      {
        q: 'Wie schnell antworten Sie?',
        a: 'Innerhalb einer Arbeitsstunde per WhatsApp während der chinesischen Arbeitszeit, am selben Tag per E-Mail. Die Kontaktseite fragt nur drei Dinge: das Produkt, die Menge und wie wir Sie erreichen.',
      },
    ],
    es: [
      {
        q: '¿Cuál es su cantidad mínima de pedido?',
        a: '1.000 unidades para los conjuntos (el set probiótico y el kit de pistola) y 2.000 unidades para el resto de referencias del catálogo. Ambas cifras figuran en cada ficha de producto. En pedidos de repetición la cantidad mínima desaparece cuando una fórmula ya está firmada.',
      },
      {
        q: '¿Cuánto tarda la producción?',
        a: '7–15 días para las fórmulas de catálogo en stock, y 25–40 días para private label, incluyendo muestras y aprobación del arte. El plazo figura en cada ficha de producto.',
      },
      {
        q: '¿Qué certificaciones e informes de laboratorio tienen?',
        a: 'GMP ISO 22716 de cosméticos con sala limpia de clase D, registro del establishment ante la FDA y permiso de producción para desinfectantes y aditivos para alimentación animal. Diez informes de terceros están disponibles para descarga en la página de certificaciones.',
      },
      {
        q: '¿A qué mercados exportan ya?',
        a: 'A doce o más, concentrados en Rusia, Brasil, la EAEU y la UE. La documentación de cumplimiento comercial para esos destinos está en la página de cumplimiento comercial.',
      },
      {
        q: '¿Publican precios?',
        a: 'No. El precio se cotiza por separado porque depende del escalón de volumen, la especificación del envase y el destino. Envíenos la referencia y su volumen anual y tendrá precios por escalones en un día laborable.',
      },
      {
        q: '¿Cuánto responden?',
        a: 'En un día laborable por WhatsApp durante el horario chino, y el mismo día por correo. La página de contacto pide solo tres cosas: el producto, el volumen y cómo contactarles.',
      },
    ],
  },
  catalogue: {
    de: [
      {
        q: 'Wie klein kann meine Bestellung sein?',
        a: '1.000 Stück für die beiden gebündelten Sets — das Probiotik-Geruchs-Kontroll-Set und das Sprühpistolen-Kit. Alle übrigen Katalog-SKUs beginnen bei 2.000 Stück. Zahl und Einheit stehen auf jeder Produktkarte.',
      },
      {
        q: 'Können diese Produkte mit meinem Label versehen werden?',
        a: 'Ja, über alle drei Linien hinweg. Private Label umfasst die Rezeptur, das Flaschen- oder Kartonlayout und die EN-/ chinesische Etikettenkonformität für Ihren Zielmarkt. Eigene Rezepturen sind für Claims möglich, die nicht im Katalog stehen.',
      },
      {
        q: 'Wie schnell können Sie versenden?',
        a: 'Gelagerte Katalogrezepturen versenden in 7–15 Tagen. Private Label dauert 25–40 Tage einschließlich Muster und Etikettenfreigabe. Beide Lieferzeiten stehen je SKU auf der Produktseite.',
      },
      {
        q: 'Welche Zertifizierungen decken diese Produkte ab?',
        a: 'ISO 22716 Kosmetik-GMP mit Reinheitsklasse D deckt die Reinigungs- und Pflegelinien ab. Die Desinfektionslinie ist zusätzlich durch eine Erlaubnis für Desinfektionsmittel abgedeckt. Zehn Drittanbieter-Prüfberichte und das Werksaudit stehen zum Download bereit.',
      },
      {
        q: 'Veröffentlichen Sie Stückpreise?',
        a: 'Nein. Der Preis hängt von Mengenstaffel, Verpackungsspezifikation und Zielmarkt ab und wird je Anfrage erstellt, nicht gelistet. Senden Sie uns eine SKU und eine Jahresmenge — Sie erhalten gestaffelte Preise innerhalb eines Arbeitstags.',
      },
      {
        q: 'Kann ich vor der Festlegung Muster erhalten?',
        a: 'Ja. Ein physisches Muster plus ein schriftliches Spezifikationsblatt ist die erste Stufe jedes Projekts, und die Musterkosten werden mit der ersten Produktionsbestellung verrechnet.',
      },
    ],
    es: [
      {
        q: '¿Cuál es el pedido mínimo?',
        a: '1.000 unidades para los dos conjuntos — el set de control de olores con probióticos y el kit de pistola. Todas las demás referencias del catálogo empiezan en 2.000 unidades. La cifra y la unidad aparecen en cada ficha.',
      },
      {
        q: '¿Pueden llevar nuestra marca?',
        a: 'Sí, en las tres líneas. Private label incluye la fórmula, el diseño de la botella o caja y el cumplimiento de la etiqueta EN / chino para su mercado. También hay fórmulas a medida para afirmaciones que no estén en el catálogo.',
      },
      {
        q: '¿Con qué rapidez envían?',
        a: 'Las fórmulas de catálogo en stock se envían en 7–15 días. Private label tarda 25–40 días, incluyendo muestras y aprobación del arte. Ambos plazos figuran en cada ficha.',
      },
      {
        q: '¿Qué certificaciones cubren estos productos?',
        a: 'GMP ISO 22716 de cosméticos con sala limpia de clase D cubre las líneas de limpieza y cuidado. La línea de desinfección cuenta además con un permiso de desinfectantes. Diez informes de terceros y la auditoría de fábrica están para descarga.',
      },
      {
        q: '¿Publican precios unitarios?',
        a: 'No. El precio depende del escalón de volumen, la especificación del envase y el destino, así que se cotiza por consulta en lugar de listarse. Envíenos una referencia y un volumen anual y tendrá precios por escalones en un día laborable.',
      },
      {
        q: '¿Puedo recibir muestras antes de decidir?',
        a: 'Sí. Una muestra física más una ficha de especificación escrita es la primera fase de cualquier proyecto, y el coste de la muestra se descuenta de la primera orden de producción.',
      },
    ],
  },
  certifications: {
    de: [
      {
        q: 'Haben Sie ISO 22716? Was deckt es ab?',
        a: 'Ja — ISO 22716 Gute Herstellungspraxis für Kosmetik, mit Abfüllbereich in Reinheitsklasse D. Es deckt unseren Produktionsstandort und das dort hergestellte kosmetische Produkt ab. Es ist eine Richtlinie, keine Produktfreigabe, und es deckt kein Produkt ab.',
      },
      {
        q: 'Sind Sie bei der FDA registriert? Heißt das, dass mein Produkt in den USA freigegeben ist?',
        a: 'Unser Betrieb ist bei der US-FDA registriert. Das ist eine Eintragung des Standorts, keine Zulassung eines Produkts, und erlaubt für sich genommen keinen Claim in irgendeinem Markt. Die Standort-ID und die Produktlisten teilen wir auf Anfrage.',
      },
      {
        q: 'Welche Tests kann ich tatsächlich lesen?',
        a: 'Zehn Drittanbieter-Prüfberichte, jeder mit dem echten Deckblatt, der Berichtsnummer und dem ausstellenden Institut. Sie decken Ammoniak- und Schwefelwasserstoff-Abbau bei den Tier-Deodorants, Ammoniak-Abbau beim Katzenstreu-Deo, 12 Monate, Flaschenstabilität und Haltbarkeit ab.',
      },
      {
        q: 'Worauf beruhen die >94 % Ammoniak-Abbauwerte?',
        a: 'Auf einer unabhängigen Bestimmung: NACCYH25014722 für das Tier-Deo und NACCYH25007027 für das Katzenstreu-Deo. Ammoniak fiel beim Tier-Deo von 1,53 mg/m³ auf 0,088 mg/m³ und beim Katzenstreu-Deo auf 0,052 mg/m³.',
      },
      {
        q: 'Haben Sie eine Erlaubnis für Desinfektionsmittel und Futtermittelzusätze?',
        a: 'Ja, beide liegen vor und werden als Scan veröffentlicht. Die Hygieneerlaubnis für Desinfektionsprodukte, 粤卫消证字[2023]-07-第0002号, gilt bis 2027-05-21. Die Erlaubnis für Futtermittelzusätze, 粤饲添(2023)H07002, gilt bis 2028-04-23.',
      },
      {
        q: 'Wer hält das Hochtechnologie-Unternehmenszertifikat?',
        a: 'Das Hochtechnologie-Unternehmenszertifikat GR202544200988, ausgestellt am 2025-12-25 und drei Jahre gültig, ist auf die Shenzhen Yongsheng Environmental Engineering Co., Ltd. ausgestellt — eine andere Gesellschaft desselben Konzerns. Es ist also ein Zertifikat der Gruppe, und wer es hält, steht auf dem Scan. Die Desinfektions- und die Futtermittelzusatz-Lizenz sind auf Guangdong Shenhe Zhongke Biotechnology Co., Ltd. ausgestellt; an den Scans steht, welches Dokument zu welcher Gesellschaft gehört.',
      },
      {
        q: 'Was deckt das Sicherheitsdatenblatt ab?',
        a: 'Alle 20 aktiven SKUs, in 16 Sprachen, als Sicherheitsdatenblatt der Sendung. Es dokumentiert die versandten Waren. Es ist keine Freigabe des Etikettentexts für einen Markt — die Etikettenfreigabe ist eine eigene Aufgabe.',
      },
      {
        q: 'Können Sie eine Zertifizierung für meinen Zielmarkt beschaffen?',
        a: 'Meistens ja, und wir kalkulieren den Weg, statt ihn zu versprechen. Für FDA, EU-CPNP und ISO 22716 ordnen wir die Vorschriften Ihres Zielmarkts zu und kalkulieren den Zertifizierungsweg innerhalb von 48 Stunden nach dem Briefing.',
      },
      {
        q: 'Sind die Berichte auf meine Marke übertragbar?',
        a: 'Die Berichte dokumentieren das von uns hergestellte Produkt und den Prozess, den es durchlaufen hat. Eine Private-Label-Version derselben Rezeptur braucht eigene Tests für die Claims, die Sie machen wollen — wir führen die in denselben Labors durch und stellen die Berichte aus.',
      },
      {
        q: 'Ist das Produkt tierversuchsfrei?',
        a: 'Ja — keine Tierversuche, und die Rezeptur- und Testarbeit wird auf Bench-Chemie und Zell- oder Instrumentalmethoden statt an Tieren durchgeführt. Das ist eine Aussage darüber, wie die Produkte und ihre Tests hergestellt werden. Es ist keine Health-Claim.',
      },
    ],
    es: [
      {
        q: '¿Tienen ISO 22716? ¿Qué cubre?',
        a: 'Sí — ISO 22716 buenas prácticas de fabricación de cosméticos, con sala limpia de clase D. Cubre nuestro centro de fabricación y el producto cosmético que se fabrica allí. Es una directriz, no una aprobación de producto, y no cubre ningún producto.',
      },
      {
        q: '¿Están registrados en la FDA? ¿Eso significa que mi producto está aprobado en EE. UU.?',
        a: 'Nuestro centro está registrado ante la FDA de EE. UU. Es un registro del centro, no una autorización de ningún producto, y por sí solo no permite ninguna declaración en ningún mercado. El identificador del centro y los listados de producto se comparten bajo petición.',
      },
      {
        q: '¿Qué ensayos puedo leer realmente?',
        a: 'Diez informes de terceros, cada uno con su portada real, número de informe e instituto emisor. Cubren la eliminación de amoniaco y sulfuro de hidrógeno en los desodorantes, la eliminación de amoniaco en el desodorizante de arena, 12 meses, estabilidad en envase y vida útil.',
      },
      {
        q: '¿En qué se basan las cifras de >94 % de eliminación de amoniaco?',
        a: 'En una determinación independiente: NACCYH25014722 para el desodorizante y NACCYH25007027 para el desodorizante de arena. El amoniaco pasó de 1,53 mg/m³ a 0,088 mg/m³ en el desodorizante y a 0,052 mg/m³ en el de arena.',
      },
      {
        q: '¿Tienen permisos de desinfectantes y de aditivos para alimentación animal?',
        a: 'Sí, ambos están en archivo y se publican como escaneo. El permiso de higiene para productos desinfectantes, 粤卫消证字[2023]-07-第0002号, es válido hasta 2027-05-21. El permiso de producción de aditivos, 粤饲添(2023)H07002, es válido hasta 2028-04-23.',
      },
      {
        q: '¿Quién tiene el certificado de empresa de alta tecnología?',
        a: 'El certificado de empresa de alta tecnología GR202544200988, emitido el 2025-12-25 y válido tres años, fue emitido a Shenzhen Yongsheng Environmental Engineering Co., Ltd. — otra entidad del mismo grupo, así que es del grupo y el escaneo dice quién lo tiene. Las licencias de disinfectant y de aditivos para alimentación están a nombre de Guangdong Shenhe Zhongke Biotechnology Co., Ltd. directamente, y en los escaneos se ve qué documento es de qué entidad.',
      },
      {
        q: '¿Qué cubre la ficha de datos de seguridad?',
        a: 'Las 20 referencias activas, en 16 idiomas, como ficha de datos de seguridad del envío. Documenta las mercancías enviadas. No es una aprobación del texto de la etiqueta para un mercado — la aprobación de etiqueta es un trabajo aparte.',
      },
      {
        q: '¿Pueden conseguir una certificación para mi mercado objetivo?',
        a: 'Normalmente sí, y presupuestamos la vía en lugar de prometerla. Para FDA, CPNP de la UE e ISO 22716 mapeamos la normativa de su mercado objetivo y presupuestamos la vía de certificación en 48 horas desde el briefing.',
      },
      {
        q: '¿Los informes son transferibles a mi marca?',
        a: 'Los informes documentan el producto que fabricamos y el proceso por el que pasó. Una versión private label de la misma fórmula necesita sus propios ensayos para las declaraciones que quiera hacer — los ejecutamos en los mismos laboratorios y emitimos los informes.',
      },
      {
        q: '¿El producto es cruelty-free?',
        a: 'Sí — sin ensayos con animales, y el trabajo de formulación y ensayo se hace con química de bancada y métodos celulares o instrumentales en lugar de con animales. Es una declaración sobre cómo se fabrican los productos y sus ensayos. No es una declaración de salud.',
      },
    ],
  },
};

/**
 * The questions of a page, in the buyer's language.
 *
 * The English set comes from the page itself; this function returns the
 * translation when there is one and the English set when there is not,
 * so a page never shows an empty FAQ.
 */
export function localisedFaq(
  set: FaqSet,
  locale: string,
  english: LocalisedFaq[],
): LocalisedFaq[] {
  if (locale === 'en') return english;
  const table = FAQ_LOCALISED[set] as Record<string, LocalisedFaq[]> | undefined;
  const translated = table?.[locale];
  return translated && translated.length ? translated : english;
}
