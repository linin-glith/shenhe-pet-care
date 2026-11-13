/**
 * The German dictionary.
 *
 * THE REGISTER
 * Formal. A German buyer writing to a factory in Guangdong writes "Sie",
 * and a page that uses "du" reads as a different kind of company. The
 * capital nouns are German capital nouns: Haustier-Shampoo, Deo-Spray,
 * Pflegegeräte.
 *
 * WHAT IS LEFT IN ENGLISH
 * Certificate names, standard numbers, the initials of a company, and the
 * trade terms — FOB, CIF, EXW, DDP — which are international usage and are
 * written the same way everywhere.
 */

import type { Dictionary } from './dictionary';

export const de: Dictionary = {
  // ---------------------------------------------------------------------
  // The site chrome
  // ---------------------------------------------------------------------
  'nav.home': 'Startseite',
  'nav.products': 'Produkte',
  'nav.oem': 'OEM & ODM',
  'nav.compliance': 'Compliance',
  'nav.factory': 'Werk',
  'nav.rd': 'F&E',
  'nav.sourcing': 'Leitfäden',
  'nav.about': 'Über uns',
  'nav.contact': 'Kontakt',
  'nav.quote': 'Angebot',
  'nav.signin': 'Anmelden',
  'nav.account': 'Konto',
  'nav.search': 'Suchen',
  'nav.menu': 'Menü',
  'nav.close': 'Schließen',
  'nav.language': 'Sprache',
  'nav.trade': 'Handelsbedingungen',
  'nav.ai': 'KI-Produktmatch',
  'nav.privacy': 'Datenschutz',
  'nav.terms': 'AGB',

  // ---------------------------------------------------------------------
  // Common actions
  // ---------------------------------------------------------------------
  'action.readmore': 'Weiterlesen',
  'action.learnmore': 'Mehr erfahren',
  'action.viewall': 'Alle ansehen',
  'action.back': 'Zurück',
  'action.next': 'Weiter',
  'action.previous': 'Zurück',
  'action.download': 'Herunterladen',
  'action.contact': 'Kontakt aufnehmen',
  'action.explore': 'Entdecken',
  'action.retry': 'Erneut versuchen',
  'action.copy': 'Kopieren',
  'action.show': 'Anzeigen',
  'action.hide': 'Verbergen',

  // ---------------------------------------------------------------------
  // The home page
  // ---------------------------------------------------------------------
  'home.hero.title': 'Herstellung von Haustierpflege- und Hygieneprodukten',
  'home.hero.lead':
    'Eine 30.000 m² große Fabrik in Heyuan, Guangdong. Wir fertigen Haustier-Shampoos, Deo-Sprays, Haustiertücher und Pflegegeräte für Marken und Distributoren weltweit.',
  'home.hero.cta1': 'Angebot anfordern',
  'home.hero.cta2': 'Produkte ansehen',
  'home.stat.skus': 'Produkt-SKUs',
  'home.stat.capacity': 'Monatliche Kapazität',
  'home.stat.years': 'Jahre Herstellung',
  'home.stat.countries': 'Lieferländer',
  'home.lines.title': 'Was wir herstellen',
  'home.lines.lead': 'Vier Produktlinien, zwanzig SKUs, eine Fertigungslinie je SKU.',
  'home.compliance.title': 'Compliance, die Sie Ihrem Kunden vorlegen können',
  'home.factory.title': 'Das Werk',
  'home.factory.lead': 'Was ein Käufer sehen sollte, bevor er bestellt.',
  'home.cta.title': 'Starten Sie Ihr Projekt',
  'home.cta.lead':
    'Nennen Sie uns Spezifikation, Menge und Zielmarkt. Wir kalkulieren ein Angebot.',

  // ---------------------------------------------------------------------
  // The product pages
  // ---------------------------------------------------------------------
  'products.title': 'Produkte',
  'products.lead': 'Alle Produktlinien, die wir herstellen, und wofür sie gedacht sind.',
  'products.filter.all': 'Alle Produkte',
  'products.filter.line': 'Produktlinie',
  'products.sku': 'SKU',
  'products.spec': 'Spezifikation',
  'products.pack': 'Gebindegröße',
  'products.moq': 'Mindestbestellmenge',
  'products.leadtime': 'Lieferzeit',
  'products.quote': 'Angebot anfordern',
  'products.ask': 'Frage zu diesem Produkt stellen',
  'products.downloads': 'Dokumente',
  'products.msds': 'Sicherheitsdatenblatt',
  'products.coa': 'Analysenzertifikat',
  'products.tds': 'Technisches Datenblatt',

  // ---------------------------------------------------------------------
  // The contact and quote forms
  // ---------------------------------------------------------------------
  'contact.title': 'Kontakt',
  'contact.lead':
    'Schildern Sie uns Ihren Bedarf. Wir antworten mit einem Angebot, nicht mit einer Broschüre.',
  'form.name': 'Ihr Name',
  'form.company': 'Unternehmen',
  'form.email': 'E-Mail',
  'form.country': 'Land',
  'form.phone': 'Telefon oder WhatsApp',
  'form.product': 'Produkt oder SKU',
  'form.quantity': 'Menge',
  'form.market': 'Zielmarkt',
  'form.message': 'Ihre Nachricht',
  'form.messageHint': 'Spezifikation, Gebindegröße, Jahresmenge, Zertifikatsanforderungen.',
  'form.submit': 'Anfrage senden',
  'form.sending': 'Wird gesendet…',
  'form.sent': 'Vielen Dank. Wir antworten innerhalb eines Werktages.',
  'form.error':
    'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie uns auf WhatsApp.',
  'form.required': 'Pflichtfeld',

  // ---------------------------------------------------------------------
  // The compliance pages
  // ---------------------------------------------------------------------
  'compliance.title': 'Globale Compliance',
  'compliance.lead': 'Was jeder Markt verlangt und was wir bereits vorhalten.',
  'compliance.iso': 'ISO 22716 GMP',
  'compliance.fda': 'FDA-Registrierung',
  'compliance.gpa': 'GPA-Zertifikat',
  'compliance.hs': 'HS-Codes',
  'compliance.msds': 'Sicherheitsdatenblätter',
  'compliance.msdsLead':
    'Ein Blatt je Produkt, in dem Format, das Ihre Logistik erwartet.',

  // ---------------------------------------------------------------------
  // The factory pages
  // ---------------------------------------------------------------------
  'factory.title': 'Das Werk',
  'factory.lead':
    'Dreißigtausend Quadratmeter in Heyuan, Guangdong. Das steckt darin.',
  'factory.area': 'Produktionsfläche',
  'factory.lines': 'Fertigungslinien',
  'factory.capacity': 'Monatliche Kapazität',
  'factory.people': 'Mitarbeiter in der Produktion',
  'factory.equipment': 'Ausrüstung',
  'factory.quality': 'Qualitätskontrolle',
  'factory.visits': 'Besuch des Werks',

  // ---------------------------------------------------------------------
  // The portal
  // ---------------------------------------------------------------------
  'portal.title': 'Ihr Konto',
  'portal.signedout.title': 'Anmelden',
  'portal.signedout.lead':
    'Ihre Anfragen, unsere Antworten, Ihre Bestellungen und die Versanddokumente — an einem Ort.',
  'portal.email': 'E-Mail',
  'portal.password': 'Passwort',
  'portal.signin': 'Anmelden',
  'portal.signingin': 'Anmeldung läuft…',
  'portal.signout': 'Abmelden',
  'portal.create': 'Konto anlegen',
  'portal.forgot': 'Passwort vergessen?',
  'portal.track': 'Ohne Anmeldung verfolgen',
  'portal.noaccount': 'Noch kein Konto?',
  'portal.overview': 'Übersicht',
  'portal.enquiries': 'Anfragen',
  'portal.orders': 'Bestellungen',
  'portal.shipments': 'Sendungen',
  'portal.documents': 'Dokumente',
  'portal.account': 'Konto',
  'portal.stat.inquiries': 'Offene Anfragen',
  'portal.stat.replies': 'Antworten von uns',
  'portal.stat.orders': 'Bestellungen in Arbeit',
  'portal.stat.documents': 'Ihre Dokumente',
  'portal.activity': 'Letzte Aktivitäten',
  'portal.activityLead':
    'Alles, was auf Ihrem Konto passiert ist — mit dem Neuesten zuerst.',
  'portal.resources': 'Zertifikate und Datenblätter',
  'portal.resourcesLead': 'Die Unterlagen, die Ihre Compliance-Abteilung anfordert.',
  'portal.empty.enquiries': 'Noch keine Anfragen',
  'portal.empty.orders': 'Noch nichts bestellt',
  'portal.empty.shipments': 'Noch nichts versandt',
  'portal.empty.documents': 'Noch keine Dokumente',

  // ---------------------------------------------------------------------
  // The errors
  // ---------------------------------------------------------------------
  'error.404.title': 'Seite nicht gefunden',
  'error.404.lead': 'Diese Adresse existiert auf dieser Website nicht.',
  'error.500.title': 'Etwas ist schiefgelaufen',
  'error.500.lead': 'Wir haben es protokolliert. Bitte versuchen Sie es gleich noch einmal.',
  'cookie.title':
    'Diese Website verwendet Cookies, um zu messen, wie sie genutzt wird.',
  'cookie.lead':
    'Wenn Sie zustimmen, nutzen wir Google Analytics 4 zur Besuchszählung und Microsoft Clarity, um Ihren Bildschirm aufzuzeichnen und zu sehen, wo Käufer hängen bleiben — Clarity schwärzt, was Sie in ein Formular eintippen. Bis dahin bleibt nur eine cookielose Zählung: keine Kennung, keine Sitzungsaufzeichnung. Sie können Ihre Entscheidung jederzeit im Footer ändern. Wir verwenden keine Werbe-Cookies und verkaufen oder teilen Ihre Daten nicht — die Messdaten bleiben bei dem Unternehmen, das die Produkte hergestellt hat, die Sie sich ansehen.',
  'cookie.necessary':
    'Nur erforderliche',
  'cookie.accept':
    'Analyse akzeptieren',
  'cookie.settings':
    'Cookie-Einstellungen',
  'cookie.current':
    'Ihre aktuelle Wahl: {choice}',
};
