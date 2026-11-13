/**
 * The Spanish dictionary.
 *
 * THE VARIANT
 * Business-neutral Spanish, the kind used in Spain and in international
 * trade generally, rather than any particular Latin American variety. The
 * buyers the site is written for are European.
 *
 * WHAT IS LEFT IN ENGLISH
 * Certificate names, standard numbers, initials, and the trade terms — FOB,
 * CIF, EXW, DDP — which are the same in every language.
 */

import type { Dictionary } from './dictionary';

export const es: Dictionary = {
  // ---------------------------------------------------------------------
  // The site chrome
  // ---------------------------------------------------------------------
  'nav.home': 'Inicio',
  'nav.products': 'Productos',
  'nav.oem': 'OEM & ODM',
  'nav.compliance': 'Cumplimiento',
  'nav.factory': 'Fábrica',
  'nav.rd': 'I+D',
  'nav.sourcing': 'Guías',
  'nav.about': 'Nosotros',
  'nav.contact': 'Contacto',
  'nav.quote': 'Cotizar',
  'nav.signin': 'Iniciar sesión',
  'nav.account': 'Cuenta',
  'nav.search': 'Buscar',
  'nav.menu': 'Menú',
  'nav.close': 'Cerrar',
  'nav.language': 'Idioma',
  'nav.trade': 'Condiciones de Exportación',
  'nav.ai': 'Match con IA',
  'nav.privacy': 'Privacidad',
  'nav.terms': 'Términos y Condiciones',

  // ---------------------------------------------------------------------
  // Common actions
  // ---------------------------------------------------------------------
  'action.readmore': 'Leer más',
  'action.learnmore': 'Saber más',
  'action.viewall': 'Ver todo',
  'action.back': 'Atrás',
  'action.next': 'Siguiente',
  'action.previous': 'Anterior',
  'action.download': 'Descargar',
  'action.contact': 'Contáctenos',
  'action.explore': 'Explorar',
  'action.retry': 'Intentar de nuevo',
  'action.copy': 'Copiar',
  'action.show': 'Mostrar',
  'action.hide': 'Ocultar',

  // ---------------------------------------------------------------------
  // The home page
  // ---------------------------------------------------------------------
  'home.hero.title': 'Fabricación de productos de higiene y cuidado para mascotas',
  'home.hero.lead':
    'Una fábrica de 30.000 m² en Heyuan, Guangdong, que fabrica champús para mascotas, sprays desodorizantes, toallitas y equipos de aseo para marcas y distribuidores de todo el mundo.',
  'home.hero.cta1': 'Solicitar presupuesto',
  'home.hero.cta2': 'Ver los productos',
  'home.stat.skus': 'SKU de producto',
  'home.stat.capacity': 'Capacidad mensual',
  'home.stat.years': 'Años de fabricación',
  'home.stat.countries': 'Países de destino',
  'home.lines.title': 'Qué fabricamos',
  'home.lines.lead': 'Cuatro líneas de producto, veinte SKU, una línea de producción por SKU.',
  'home.compliance.title': 'Documentación que puede enviar a su cliente',
  'home.factory.title': 'La fábrica',
  'home.factory.lead': 'Lo que un comprador debería ver antes de pedir.',
  'home.cta.title': 'Empiece su proyecto',
  'home.cta.lead':
    'Indíquenos la especificación, la cantidad y el mercado. Le enviaremos un presupuesto.',

  // ---------------------------------------------------------------------
  // The product pages
  // ---------------------------------------------------------------------
  'products.title': 'Productos',
  'products.lead':
    'Todas las líneas de producto que fabricamos, y para qué sirve cada una.',
  'products.filter.all': 'Todos los productos',
  'products.filter.line': 'Línea de producto',
  'products.sku': 'SKU',
  'products.spec': 'Especificación',
  'products.pack': 'Formato del envase',
  'products.moq': 'Pedido mínimo',
  'products.leadtime': 'Plazo de entrega',
  'products.quote': 'Solicitar un presupuesto',
  'products.ask': 'Preguntar por este producto',
  'products.downloads': 'Documentos',
  'products.msds': 'Ficha de datos de seguridad',
  'products.coa': 'Certificado de análisis',
  'products.tds': 'Ficha técnica',

  // ---------------------------------------------------------------------
  // The contact and quote forms
  // ---------------------------------------------------------------------
  'contact.title': 'Contacto',
  'contact.lead':
    'Cuéntenos qué necesita. Respondemos con un presupuesto, no con un folleto.',
  'form.name': 'Su nombre',
  'form.company': 'Empresa',
  'form.email': 'Correo electrónico',
  'form.country': 'País',
  'form.phone': 'Teléfono o WhatsApp',
  'form.product': 'Producto o SKU',
  'form.quantity': 'Cantidad',
  'form.market': 'Mercado de destino',
  'form.message': 'Su mensaje',
  'form.messageHint': 'Especificación, formato, cantidad anual, certificaciones requeridas.',
  'form.submit': 'Enviar consulta',
  'form.sending': 'Enviando…',
  'form.sent': 'Gracias. Responderemos en un día laborable.',
  'form.error':
    'No se ha podido enviar. Inténtelo de nuevo o escríbanos por WhatsApp.',
  'form.required': 'obligatorio',

  // ---------------------------------------------------------------------
  // The compliance pages
  // ---------------------------------------------------------------------
  'compliance.title': 'Cumplimiento Global',
  'compliance.lead': 'Qué exige cada mercado y qué tenemos ya en manos.',
  'compliance.iso': 'ISO 22716 GMP',
  'compliance.fda': 'Registro FDA',
  'compliance.gpa': 'Certificado GPA',
  'compliance.hs': 'Códigos HS',
  'compliance.msds': 'Fichas de datos de seguridad',
  'compliance.msdsLead':
    'Una ficha por producto, en el formato que espera su logística.',

  // ---------------------------------------------------------------------
  // The factory pages
  // ---------------------------------------------------------------------
  'factory.title': 'La fábrica',
  'factory.lead':
    'Treinta mil metros cuadrados en Heyuan, Guangdong. Esto es lo que hay dentro.',
  'factory.area': 'Superficie de producción',
  'factory.lines': 'Líneas de producción',
  'factory.capacity': 'Capacidad mensual',
  'factory.people': 'Personal en planta',
  'factory.equipment': 'Equipos',
  'factory.quality': 'Control de calidad',
  'factory.visits': 'Visitar la fábrica',

  // ---------------------------------------------------------------------
  // The portal
  // ---------------------------------------------------------------------
  'portal.title': 'Su cuenta',
  'portal.signedout.title': 'Iniciar sesión',
  'portal.signedout.lead':
    'Sus consultas, nuestras respuestas, sus pedidos y sus documentos de envío, todo en un mismo sitio.',
  'portal.email': 'Correo electrónico',
  'portal.password': 'Contraseña',
  'portal.signin': 'Iniciar sesión',
  'portal.signingin': 'Iniciando sesión…',
  'portal.signout': 'Cerrar sesión',
  'portal.create': 'Crear una',
  'portal.forgot': '¿Ha olvidado su contraseña?',
  'portal.track': 'Seguir sin iniciar sesión',
  'portal.noaccount': '¿Aún no tiene cuenta?',
  'portal.overview': 'Resumen',
  'portal.enquiries': 'Consultas',
  'portal.orders': 'Pedidos',
  'portal.shipments': 'Envíos',
  'portal.documents': 'Documentos',
  'portal.account': 'Cuenta',
  'portal.stat.inquiries': 'Consultas abiertas',
  'portal.stat.replies': 'Respuestas nuestras',
  'portal.stat.orders': 'Pedidos en curso',
  'portal.stat.documents': 'Sus documentos',
  'portal.activity': 'Actividad reciente',
  'portal.activityLead':
    'Todo lo que ha ocurrido en su cuenta, lo más reciente primero.',
  'portal.resources': 'Certificados y fichas técnicas',
  'portal.resourcesLead': 'La documentación que le pide su departamento de cumplimiento.',
  'portal.empty.enquiries': 'Todavía no hay consultas',
  'portal.empty.orders': 'Todavía no ha pedido nada',
  'portal.empty.shipments': 'Todavía no se ha enviado nada',
  'portal.empty.documents': 'Todavía no hay documentos',

  // ---------------------------------------------------------------------
  // The errors
  // ---------------------------------------------------------------------
  'error.404.title': 'Página no encontrada',
  'error.404.lead': 'Esa dirección no existe en este sitio.',
  'error.500.title': 'Algo ha salido mal',
  'error.500.lead': 'Lo hemos registrado. Vuelva a intentarlo en un momento.',
  'cookie.title':
    'Este sitio usa cookies para medir cómo se utiliza.',
  'cookie.lead':
    'Si acepta, usamos Google Analytics 4 para contar las visitas y Microsoft Clarity para grabar su pantalla y ver dónde se atascan los compradores: Clarity difumina lo que escribe en un formulario. Hasta entonces solo se guarda un conteo sin cookies, sin identificador ni grabación de sesión. Puede cambiar de opinión en cualquier momento desde el pie de página. No utilizamos cookies publicitarias ni vendemos o compartimos sus datos: los datos de medición permanecen en la empresa que fabrica los productos que está viendo.',
  'cookie.necessary':
    'Solo necesarias',
  'cookie.accept':
    'Aceptar analítica',
  'cookie.settings':
    'Configuración de cookies',
  'cookie.current':
    'Su elección actual: {choice}',
};
