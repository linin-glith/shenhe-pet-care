/**
 * The English dictionary.
 *
 * WHY THE ENGLISH IS IN A DICTIONARY AT ALL
 * The English pages read their strings from here as well, so that a German
 * page and an English page are the same page with a different dictionary
 * behind them. If English kept its strings in the components and German
 * kept its in a file, the two would drift: a feature added to the English
 * component would never reach the German one, and nothing would say so.
 *
 * The German and Spanish dictionaries are typed against this one, so a key
 * that exists here and not there is a build error.
 *
 * THE SHAPE
 * A flat map of dotted keys. The flatness is deliberate: a nested object
 * would make a missing key a runtime undefined rather than a compile
 * error, and the type of the whole dictionary cannot be checked against a
 * nested shape without writing the type out by hand.
 */

export const en = {
  // ---------------------------------------------------------------------
  // The site chrome
  // ---------------------------------------------------------------------
  'nav.home': 'Home',
  'nav.products': 'Products',
  'nav.oem': 'OEM & ODM',
  'nav.compliance': 'Compliance',
  'nav.factory': 'Factory',
  'nav.rd': 'R&D',
  'nav.sourcing': 'Guides',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.quote': 'Request a quotation',
  'nav.signin': 'Sign in',
  'nav.account': 'Account',
  'nav.search': 'Search',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.language': 'Language',
  'nav.trade': 'Trade Compliance',
  'nav.ai': 'AI Product Match',
  'nav.privacy': 'Privacy Policy',
  'nav.terms': 'Terms of Service',

  // ---------------------------------------------------------------------
  // Common actions
  // ---------------------------------------------------------------------
  'action.readmore': 'Read more',
  'action.learnmore': 'Learn more',
  'action.viewall': 'View all',
  'action.back': 'Back',
  'action.next': 'Next',
  'action.previous': 'Previous',
  'action.download': 'Download',
  'action.contact': 'Contact us',
  'action.explore': 'Explore',
  'action.retry': 'Try again',
  'action.copy': 'Copy',
  'action.show': 'Show',
  'action.hide': 'Hide',

  // ---------------------------------------------------------------------
  // The home page
  // ---------------------------------------------------------------------
  'home.hero.title': 'Pet grooming and hygiene manufacturing',
  'home.hero.lead':
    'A 30,000 m² factory in Heyuan, Guangdong, making pet shampoos, deodorizing sprays, pet wipes and grooming equipment for brands and distributors worldwide.',
  'home.hero.cta1': 'Request a quotation',
  'home.hero.cta2': 'See the products',
  'home.stat.skus': 'Product SKUs',
  'home.stat.capacity': 'Monthly capacity',
  'home.stat.years': 'Years manufacturing',
  'home.stat.countries': 'Countries shipped to',
  'home.lines.title': 'What we make',
  'home.lines.lead': 'Four product lines, twenty SKUs, one production line each.',
  'home.compliance.title': 'Compliance you can send to a buyer',
  'home.factory.title': 'The factory',
  'home.factory.lead': 'What a buyer should ask to see before they order.',
  'home.cta.title': 'Start your project',
  'home.cta.lead': 'Tell us the specification, the quantity and the market. We will quote it.',

  // ---------------------------------------------------------------------
  // The product pages
  // ---------------------------------------------------------------------
  'products.title': 'Products',
  'products.lead': 'Every product line we manufacture, with what each one is for.',
  'products.filter.all': 'All products',
  'products.filter.line': 'Product line',
  'products.sku': 'SKU',
  'products.spec': 'Specification',
  'products.pack': 'Pack size',
  'products.moq': 'Minimum order',
  'products.leadtime': 'Lead time',
  'products.quote': 'Request a quotation',
  'products.ask': 'Ask about this product',
  'products.downloads': 'Documents',
  'products.msds': 'Safety data sheet',
  'products.coa': 'Certificate of analysis',
  'products.tds': 'Technical data sheet',

  // ---------------------------------------------------------------------
  // The contact and quote forms
  // ---------------------------------------------------------------------
  'contact.title': 'Contact us',
  'contact.lead': 'Tell us what you need. We reply with a quotation, not a brochure.',
  'form.name': 'Your name',
  'form.company': 'Company',
  'form.email': 'Email',
  'form.country': 'Country',
  'form.phone': 'Phone or WhatsApp',
  'form.product': 'Product or SKU',
  'form.quantity': 'Quantity',
  'form.market': 'Destination market',
  'form.message': 'Your message',
  'form.messageHint': 'Specification, pack size, annual quantity, certification needs.',
  'form.submit': 'Send enquiry',
  'form.sending': 'Sending…',
  'form.sent': 'Thank you. We will reply within one working day.',
  'form.error': 'That did not send. Please try again, or message us on WhatsApp.',
  'form.required': 'required',

  // ---------------------------------------------------------------------
  // The compliance pages
  // ---------------------------------------------------------------------
  'compliance.title': 'Global Compliance',
  'compliance.lead': 'What each market requires, and what we already hold.',
  'compliance.iso': 'ISO 22716 GMP',
  'compliance.fda': 'FDA registration',
  'compliance.gpa': 'GPA certificate',
  'compliance.hs': 'HS codes',
  'compliance.msds': 'Safety data sheets',
  'compliance.msdsLead': 'One sheet per product, in the format your logistics team expects.',

  // ---------------------------------------------------------------------
  // The factory pages
  // ---------------------------------------------------------------------
  'factory.title': 'The factory',
  'factory.lead': 'Thirty thousand square metres in Heyuan, Guangdong. Here is what is in it.',
  'factory.area': 'Production area',
  'factory.lines': 'Production lines',
  'factory.capacity': 'Monthly capacity',
  'factory.people': 'People on the floor',
  'factory.equipment': 'Equipment',
  'factory.quality': 'Quality control',
  'factory.visits': 'Visiting the factory',

  // ---------------------------------------------------------------------
  // The portal
  // ---------------------------------------------------------------------
  'portal.title': 'Your account',
  'portal.signedout.title': 'Sign in',
  'portal.signedout.lead':
    'Your enquiries, our replies, your orders and their shipping documents, in one place.',
  'portal.email': 'Email',
  'portal.password': 'Password',
  'portal.signin': 'Sign in',
  'portal.signingin': 'Signing in…',
  'portal.signout': 'Sign out',
  'portal.create': 'Create one',
  'portal.forgot': 'Forgot your password?',
  'portal.track': 'Track without signing in',
  'portal.noaccount': 'No account yet?',
  'portal.overview': 'Overview',
  'portal.enquiries': 'Enquiries',
  'portal.orders': 'Orders',
  'portal.shipments': 'Shipments',
  'portal.documents': 'Documents',
  'portal.account': 'Account',
  'portal.stat.inquiries': 'Open enquiries',
  'portal.stat.replies': 'Replies from us',
  'portal.stat.orders': 'Orders in progress',
  'portal.stat.documents': 'Your documents',
  'portal.activity': 'Recent activity',
  'portal.activityLead': 'Everything that has happened on your account, most recent first.',
  'portal.resources': 'Certificates and data sheets',
  'portal.resourcesLead': 'The paperwork your compliance team asks for.',
  'portal.empty.enquiries': 'No enquiries yet',
  'portal.empty.orders': 'Nothing ordered yet',
  'portal.empty.shipments': 'Nothing shipped yet',
  'portal.empty.documents': 'No documents yet',

  // ---------------------------------------------------------------------
  // The errors
  // ---------------------------------------------------------------------
  'error.404.title': 'Page not found',
  'error.404.lead': 'That address does not exist on this site.',
  'error.500.title': 'Something went wrong',
  'error.500.lead': 'We have logged it. Please try again in a moment.',
  'cookie.title':
    'This site uses cookies to measure how it is used.',
  'cookie.lead':
    'If you accept, we use Google Analytics 4 to count visits and Microsoft Clarity to record your screen, so we can see where buyers get stuck — Clarity masks whatever you type into a form. Until then only a cookieless count is kept: no identifier, no session recording. You can change your mind at any time from the footer. We run no advertising cookies, and we never sell or share your data — the measurement data stays with the company that made the products you are looking at.',
  'cookie.necessary':
    'Only necessary',
  'cookie.accept':
    'Accept analytics',
  'cookie.settings':
    'Cookie settings',
  'cookie.current':
    'Your current choice: {choice}',
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;
