/* ============================================
   SHENHE ZHONGKE portal — shared client helpers
   - API base auto-detects localhost dev vs prod
   - CSRF token pulled from sz_csrf cookie
   - Tiny i18n (en/es/de) for portal-only strings
   ============================================ */

const Portal = (() => {
  // API base:
//   1. window.PORTAL_API_BASE — explicit override (set by tests / when local API runs)
//   2. dev ports (8124 / 8125) → http://127.0.0.1:4000 (only if a local API is running)
//   3. everything else → same origin (production: Nginx reverse-proxies /api/* to 127.0.0.1:4000)
  const DEV_PORTS = new Set(['8124', '8125']);
  const API_BASE = (window.PORTAL_API_BASE)
    || (DEV_PORTS.has(location.port) ? 'http://127.0.0.1:4000' : location.origin);

  // ----- Cookie helpers -----
  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function setCookie(name, value, days = 7) {
    const exp = new Date(Date.now() + days * 86400e3).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp}; SameSite=Lax`;
  }

  // ----- CSRF -----
  let csrfToken = getCookie('sz_csrf');
  // Lazily fetch the token if the server didn't set one (e.g. first visit).
  async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const r = await fetch(API_BASE + '/api/csrf', { credentials: 'include' });
    await consumeCookies(r);
    return csrfToken;
  }
  function consumeCookies(res) {
    // node:sqlite-era fetch can't read Set-Cookie via headers.getSetCookie in all browsers,
    // so we always re-read document.cookie after each request.
    const fresh = getCookie('sz_csrf');
    if (fresh) csrfToken = fresh;
  }

  // ----- API call -----
  async function api(method, path, body) {
    await ensureCsrf();
    const opts = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    consumeCookies(res);
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error((data && data.message) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ----- i18n (en/es/de) for portal-only strings -----
  const STRINGS = {
    en: {
      brand: 'SHENHE ZHONGKE',
      brandSub: 'Pet Care OEM / ODM',
      stages: {
        received: 'Enquiry Received',
        reviewing: 'Reviewing Specs',
        quoted: 'Quotation Sent',
        sample_arranged: 'Sample Arranged',
        contract_drafted: 'Contract Drafted',
        production: 'Production',
        shipping: 'Shipping',
        delivered: 'Delivered',
      },
      status: {
        new: 'New',
        in_progress: 'In progress',
        quoted: 'Quoted',
        closed: 'Closed',
        spam: 'Archived',
      },
      cadence: {
        't+0': 'T+0 (initial)',
        't+3': 'T+3 follow-up',
        't+7': 'T+7 follow-up',
        't+14': 'T+14 follow-up',
        't+30': 'T+30 close',
      },
      checkWhatsApp: 'Check WhatsApp →',
      viewResource: 'Open attachment',
      sentOnWhatsApp: 'Sent on WhatsApp',
      noMessagesYet: 'No message recorded yet — we will reach out within 24 hours.',
      progressLabel: (p) => `${p}% complete`,
      yourInquiries: 'Your enquiries',
      dashboardWelcome: 'Welcome back',
      logout: 'Log out',
      login: 'Log in',
      register: 'Create account',
      nav: { home: 'Home', dashboard: 'Enquiries', contact: 'Contact' },
      loginTitle: 'Sign in to your account',
      loginSubtitle: 'Track your enquiry progress, message history, and shipping updates.',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      noAccount: 'No account yet?',
      createAccount: 'Create one',
      forgotPassword: 'Forgot password?',
      registerTitle: 'Create your B2B account',
      registerSubtitle: 'Use the email you sent your enquiry from — we will link it automatically.',
      companyLabel: 'Company',
      contactNameLabel: 'Contact name',
      countryLabel: 'Country / Region',
      passwordHint: 'At least 8 characters.',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      accountCreated: 'Account created — welcome!',
      signedIn: 'Signed in. Loading your enquiries…',
      signedOut: 'Signed out.',
      inquiryDetail: 'Enquiry detail',
      progressHeading: 'Enquiry progress',
      messagesHeading: 'WhatsApp messages',
      backToList: '← Back to enquiries',
      newInquiryCTA: 'No enquiries yet? Send your first message →',
      adminTitle: 'Partner console',
      adminSubtitle: 'Update enquiry stage, send WhatsApp messages, attach quotes & tracking.',
      allInquiries: 'All enquiries',
      newMessage: 'New message',
      stageLabel: 'Stage',
      cadenceLabel: 'Follow-up cadence',
      messageLabel: 'Message (will be sent via WhatsApp)',
      resourceUrlLabel: 'Attachment URL (optional)',
      resourceLabelLabel: 'Attachment label (e.g. 📄 Open PDF)',
      internalNoteLabel: 'Internal note (admin only)',
      sendAndMark: 'Save message & open WhatsApp',
      markSent: 'Mark as sent on WhatsApp',
      delete: 'Delete',
      openWhatsApp: 'Open WhatsApp',
      messageSaved: 'Message saved.',
      messageSent: 'Marked as sent.',
      loginRequired: 'Please sign in to view your enquiries.',
      errorGeneric: 'Something went wrong. Please try again.',
      errorEmailTaken: 'An account with this email already exists. Try logging in.',
      errorInvalidLogin: 'Wrong email or password.',
      errorPasswordShort: 'Password must be at least 8 characters.',
    },
    es: {
      brand: 'SHENHE ZHONGKE',
      brandSub: 'Cosmética para mascotas OEM/ODM',
      stages: {
        received: 'Consulta recibida',
        reviewing: 'Revisando especificaciones',
        quoted: 'Cotización enviada',
        sample_arranged: 'Muestra enviada',
        contract_drafted: 'Contrato preparado',
        production: 'En producción',
        shipping: 'En tránsito',
        delivered: 'Entregado',
      },
      status: {
        new: 'Nueva', in_progress: 'En curso', quoted: 'Cotizada', closed: 'Cerrada', spam: 'Archivada',
      },
      cadence: {
        't+0': 'T+0 (inicial)', 't+3': 'Seguimiento T+3', 't+7': 'Seguimiento T+7', 't+14': 'Seguimiento T+14', 't+30': 'Cierre T+30',
      },
      checkWhatsApp: 'Ver en WhatsApp →',
      viewResource: 'Abrir adjunto',
      sentOnWhatsApp: 'Enviado por WhatsApp',
      noMessagesYet: 'Aún no hay mensajes — te contactaremos en 24 h.',
      progressLabel: (p) => `${p}% completado`,
      yourInquiries: 'Tus consultas',
      dashboardWelcome: 'Bienvenido',
      logout: 'Cerrar sesión',
      login: 'Iniciar sesión',
      register: 'Crear cuenta',
      nav: { home: 'Inicio', dashboard: 'Consultas', contact: 'Contacto' },
      loginTitle: 'Inicia sesión',
      loginSubtitle: 'Sigue el progreso de tu consulta, mensajes y envíos.',
      emailLabel: 'Correo',
      passwordLabel: 'Contraseña',
      noAccount: '¿Sin cuenta?',
      createAccount: 'Crear una',
      forgotPassword: '¿Olvidaste la contraseña?',
      registerTitle: 'Crea tu cuenta B2B',
      registerSubtitle: 'Usa el correo con el que enviaste la consulta — la vincularemos automáticamente.',
      companyLabel: 'Empresa',
      contactNameLabel: 'Nombre de contacto',
      countryLabel: 'País / Región',
      passwordHint: 'Mínimo 8 caracteres.',
      haveAccount: '¿Ya tienes cuenta?',
      signIn: 'Iniciar sesión',
      accountCreated: 'Cuenta creada — ¡bienvenido!',
      signedIn: 'Sesión iniciada. Cargando tus consultas…',
      signedOut: 'Sesión cerrada.',
      inquiryDetail: 'Detalle de la consulta',
      progressHeading: 'Progreso',
      messagesHeading: 'Mensajes de WhatsApp',
      backToList: '← Volver a consultas',
      newInquiryCTA: '¿Aún no tienes consultas? Envía la primera →',
      adminTitle: 'Consola del partner',
      adminSubtitle: 'Actualiza la etapa, envía mensajes por WhatsApp y adjunta cotizaciones.',
      allInquiries: 'Todas las consultas',
      newMessage: 'Nuevo mensaje',
      stageLabel: 'Etapa',
      cadenceLabel: 'Cadencia de seguimiento',
      messageLabel: 'Mensaje (se enviará por WhatsApp)',
      resourceUrlLabel: 'URL del adjunto (opcional)',
      resourceLabelLabel: 'Etiqueta del adjunto (ej. 📄 Abrir PDF)',
      internalNoteLabel: 'Nota interna (solo admin)',
      sendAndMark: 'Guardar y abrir WhatsApp',
      markSent: 'Marcar como enviado',
      delete: 'Eliminar',
      openWhatsApp: 'Abrir WhatsApp',
      messageSaved: 'Mensaje guardado.',
      messageSent: 'Marcado como enviado.',
      loginRequired: 'Inicia sesión para ver tus consultas.',
      errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
      errorEmailTaken: 'Ya existe una cuenta con este correo.',
      errorInvalidLogin: 'Correo o contraseña incorrectos.',
      errorPasswordShort: 'La contraseña debe tener al menos 8 caracteres.',
    },
    de: {
      brand: 'SHENHE ZHONGKE',
      brandSub: 'Pet Care OEM/ODM',
      stages: {
        received: 'Anfrage erhalten',
        reviewing: 'Spezifikationen werden geprüft',
        quoted: 'Angebot versendet',
        sample_arranged: 'Muster versendet',
        contract_drafted: 'Vertrag erstellt',
        production: 'In Produktion',
        shipping: 'Versand',
        delivered: 'Geliefert',
      },
      status: {
        new: 'Neu', in_progress: 'In Bearbeitung', quoted: 'Angeboten', closed: 'Abgeschlossen', spam: 'Archiviert',
      },
      cadence: {
        't+0': 'T+0 (initial)', 't+3': 'T+3 Follow-up', 't+7': 'T+7 Follow-up', 't+14': 'T+14 Follow-up', 't+30': 'T+30 Abschluss',
      },
      checkWhatsApp: 'Auf WhatsApp öffnen →',
      viewResource: 'Anhang öffnen',
      sentOnWhatsApp: 'Per WhatsApp gesendet',
      noMessagesYet: 'Noch keine Nachricht — wir melden uns innerhalb von 24 Stunden.',
      progressLabel: (p) => `${p}% abgeschlossen`,
      yourInquiries: 'Ihre Anfragen',
      dashboardWelcome: 'Willkommen zurück',
      logout: 'Abmelden',
      login: 'Anmelden',
      register: 'Konto erstellen',
      nav: { home: 'Start', dashboard: 'Anfragen', contact: 'Kontakt' },
      loginTitle: 'Bei Ihrem Konto anmelden',
      loginSubtitle: 'Verfolgen Sie Fortschritt, Nachrichten und Versand Ihrer Anfrage.',
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      noAccount: 'Noch kein Konto?',
      createAccount: 'Konto erstellen',
      forgotPassword: 'Passwort vergessen?',
      registerTitle: 'B2B-Konto erstellen',
      registerSubtitle: 'Verwenden Sie die E-Mail Ihrer Anfrage — wir verknüpfen sie automatisch.',
      companyLabel: 'Firma',
      contactNameLabel: 'Ansprechpartner',
      countryLabel: 'Land / Region',
      passwordHint: 'Mindestens 8 Zeichen.',
      haveAccount: 'Bereits ein Konto?',
      signIn: 'Anmelden',
      accountCreated: 'Konto erstellt — willkommen!',
      signedIn: 'Angemeldet. Anfragen werden geladen…',
      signedOut: 'Abgemeldet.',
      inquiryDetail: 'Anfragedetails',
      progressHeading: 'Fortschritt',
      messagesHeading: 'WhatsApp-Nachrichten',
      backToList: '← Zurück zu Anfragen',
      newInquiryCTA: 'Noch keine Anfragen? Senden Sie Ihre erste Nachricht →',
      adminTitle: 'Partner-Konsole',
      adminSubtitle: 'Anfragestatus aktualisieren, WhatsApp-Nachrichten senden, Angebote anhängen.',
      allInquiries: 'Alle Anfragen',
      newMessage: 'Neue Nachricht',
      stageLabel: 'Phase',
      cadenceLabel: 'Follow-up-Kadenz',
      messageLabel: 'Nachricht (wird per WhatsApp gesendet)',
      resourceUrlLabel: 'Anhang-URL (optional)',
      resourceLabelLabel: 'Anhang-Beschriftung (z. B. 📄 PDF öffnen)',
      internalNoteLabel: 'Interne Notiz (nur Admin)',
      sendAndMark: 'Speichern und WhatsApp öffnen',
      markSent: 'Als gesendet markieren',
      delete: 'Löschen',
      openWhatsApp: 'WhatsApp öffnen',
      messageSaved: 'Nachricht gespeichert.',
      messageSent: 'Als gesendet markiert.',
      loginRequired: 'Bitte anmelden, um Anfragen zu sehen.',
      errorGeneric: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
      errorEmailTaken: 'Es existiert bereits ein Konto mit dieser E-Mail.',
      errorInvalidLogin: 'Falsche E-Mail oder Passwort.',
      errorPasswordShort: 'Passwort muss mindestens 8 Zeichen haben.',
    },
  };
  let currentLang = localStorage.getItem('portal_lang') || (navigator.language || 'en').slice(0, 2).toLowerCase();
  if (!STRINGS[currentLang]) currentLang = 'en';
  // Current user's timezone (set after login; auto-detected pre-login).
  // Source of truth: customer.timezone from /api/auth/customer/me, falling back
  // to Intl.DateTimeFormat().resolvedOptions().timeZone, then 'UTC'.
  let currentTz = localStorage.getItem('portal_tz')
    || (Intl && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions && Intl.DateTimeFormat().resolvedOptions().timeZone)
    || 'UTC';
  function getTz() { return currentTz; }
  function setTz(tz) {
    if (!tz) return;
    currentTz = tz;
    try { localStorage.setItem('portal_tz', tz); } catch (_) {}
    document.dispatchEvent(new CustomEvent('tz:changed', { detail: { tz } }));
  }
  function t(key, ...args) {
    const segs = key.split('.');
    let cur = STRINGS[currentLang];
    for (const s of segs) cur = cur && cur[s];
    if (typeof cur === 'function') return cur(...args);
    return cur || key;
  }
  function setLang(lang) {
    if (!STRINGS[lang]) return;
    currentLang = lang;
    localStorage.setItem('portal_lang', lang);
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }
  function getLang() { return currentLang; }
  // Apply i18n to any element with [data-i18n] (text) or [data-i18n-placeholder] etc.
  function applyAll(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
  }

  // ----- Auth helpers -----
  async function me() {
    try {
      const customer = (await api('GET', '/api/auth/customer/me')).customer;
      if (customer && customer.timezone) setTz(customer.timezone);
      return customer;
    }
    catch { return null; }
  }
  async function adminMe() {
    try { return (await api('GET', '/api/auth/admin/me')).admin; }
    catch { return null; }
  }
  async function logout() {
    try { await api('POST', '/api/auth/customer/logout'); } catch (_) {}
    try { await api('POST', '/api/auth/admin/logout'); } catch (_) {}
    location.href = 'login.html';
  }
  // P2-2: change password (voluntary OR post-welcome forced). On success, server
  // clears must_change_password and the new customer object is returned.
  async function changePassword({ current_password, new_password, confirm_password }) {
    return api('POST', '/api/auth/customer/change-password', {
      current_password, new_password, confirm_password,
    });
  }
  // Helper: if signed-in customer has must_change_password, redirect to change-password page.
  // Use at the top of dashboard.html, register.html, etc. — anywhere that requires sign-in.
  async function redirectIfMustChangePassword() {
    var c = await me();
    if (c && c.must_change_password) {
      location.href = 'change-password.html';
      return true;
    }
    return false;
  }

  // ----- Timezone helpers -----
  // Fetch the canonical IANA timezone table for the picker.
  // Cached in-memory for the page lifetime; refetch on demand.
  let _tzList = null;
  async function fetchTimezones(force = false) {
    if (_tzList && !force) return _tzList;
    try {
      const r = await api('GET', '/api/public/timezones');
      _tzList = r.timezones || [];
      return _tzList;
    } catch (_) { return []; }
  }

  // ----- Render topbar + lang switcher -----
  function renderTopbar({ title, subtitle, activeNav, hideNav = false } = {}) {
    const tb = document.getElementById('pz-topbar');
    if (!tb) return;
    tb.innerHTML = `
      <div class="pz-topbar__inner">
        <a class="pz-brand" href="../index.html">
          <span class="pz-brand__mark">SZ</span>
          <span>${escapeHtml(t('brand'))}<span class="pz-brand__sub">${escapeHtml(t('brandSub'))}</span></span>
        </a>
        <nav class="pz-nav" aria-label="Portal">
          <a class="pz-nav__link ${activeNav === 'dashboard' ? 'is-active' : ''}" href="dashboard.html" data-i18n="nav.dashboard">${escapeHtml(t('nav.dashboard'))}</a>
          <a class="pz-nav__link" href="../contact.html" data-i18n="nav.contact">${escapeHtml(t('nav.contact'))}</a>
          <span class="pz-nav__sep">·</span>
          <span class="pz-lang" id="pz-lang-switcher">
            <button data-lang="en">EN</button><button data-lang="es">ES</button><button data-lang="de">DE</button>
          </span>
          <button class="pz-logout" id="pz-logout" data-i18n="logout">${escapeHtml(t('logout'))}</button>
        </nav>
      </div>`;
    // Wire lang switcher.
    document.querySelectorAll('#pz-lang-switcher button').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === currentLang);
      btn.addEventListener('click', () => { setLang(btn.dataset.lang); applyAll(); markActiveLang(); });
    });
    function markActiveLang() {
      document.querySelectorAll('#pz-lang-switcher button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === currentLang));
    }
    document.getElementById('pz-logout').addEventListener('click', () => logout());
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function fmtDate(d, tz) {
    if (!d) return '—';
    const dt = (d instanceof Date) ? d : new Date(typeof d === 'string' && !d.includes('T') ? d.replace(' ', 'T') + 'Z' : d);
    if (isNaN(dt.getTime())) return String(d);
    const targetTz = tz || currentTz || 'UTC';
    const langTag = currentLang === 'en' ? 'en-US' : currentLang === 'es' ? 'es-ES' : currentLang === 'de' ? 'de-DE' : 'en-US';
    try {
      return dt.toLocaleString(langTag, { dateStyle: 'medium', timeStyle: 'short', timeZone: targetTz });
    } catch (_) {
      // Unknown IANA zone — fall back to browser zone.
      return dt.toLocaleString(langTag, { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  function statusLabel(s) { return t('status.' + s) || s; }
  function stageLabel(s) { return t('stages.' + s) || s; }
  function cadenceLabel(c) { return c ? (t('cadence.' + c) || c) : ''; }

  return {
    API_BASE, api, ensureCsrf, t, setLang, getLang, applyAll,
    me, adminMe, logout, changePassword, redirectIfMustChangePassword,
    renderTopbar, escapeHtml, fmtDate, statusLabel, stageLabel, cadenceLabel,
    getTz, setTz, fetchTimezones,
  };
})();
window.Portal = Portal;