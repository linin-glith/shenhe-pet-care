/* ============================================
   chatbot.js — Floating B2B inquiry widget.
   RAG-style FAQ matcher with keyword scoring,
   quick suggestion chips, and human fallback.
   No backend required. Loaded directly via <script> tag.
   ============================================ */

(function () {
  'use strict';

  // -------- 1. Knowledge base (P1-5: single source of truth) --------
  // Loaded from /assets/data/faq.json (same file the server's RAG endpoint reads).
  // Updates to that JSON file flow to both server retrieval and chatbot matching.
  var KB = [];
  var KB_VERSION = 0;
  var KB_ENDPOINT = (window.SHENHE_FAQ_ENDPOINT) || 'assets/data/faq.json';

  // Fetch + populate KB on init. If user types before fetch resolves, they
  // still get an answer via the RAG cascade (handleUser → callRAG first).
  function loadKBFromJSON() {
    return fetch(KB_ENDPOINT, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('http_' + r.status);
        return r.json();
      })
      .then(function (data) {
        var items = (data && data.items) || data || [];
        KB = items.map(function (it) {
          return {
            id: it.id,
            kw: it.kw || it.tags || [],
            en: it.en || it.a || '',
            zh: it.zh || it.a || '',
            // The intent is what the entry is FOR, as opposed to the words it
            // matches. It is carried through the fetch so the matcher can
            // route a question to the right group of entries before it scores
            // anything — see INTENTS below.
            intent: it.intent || 'general',
            tags: it.tags || [],
          };
        }).filter(function (e) { return e.id && (e.en || e.zh); });
        KB_VERSION = (data && data.version) || 0;
      })
      .catch(function (e) {
        // Silent failure — chatbot will still work via RAG cascade.
        // Only log once to avoid console noise.
        if (!window.__kbFetchWarned) {
          console.warn('[chatbot] KB fetch failed, RAG-only mode:', e.message);
          window.__kbFetchWarned = true;
        }
      });
  }

  // -------- 2. Quick suggestion chips (rotated on open) --------
  var SUGGESTIONS = [
    ['What is your MOQ?', 'Do you offer free samples?', 'What are your lead times?', 'Tell me about OEM/ODM'],
    ['Can I visit the factory?', 'What certifications do you have?', 'What about pricing?', 'Do you ship to my country?'],
    ['Tell me about ingredients', 'Custom formula available?', 'What payment terms?', 'What is the lead time?']
  ];

  var FALLBACK_EN = "I don't have a confident answer for that one. Let me connect you with our sales team \u2014 they reply within **48 hours**.";
  var FALLBACK_ZH = '\u8fd9\u4e2a\u95ee\u9898\u6211\u6ca1\u6709\u628a\u63e1\u7b54\u5bf9\uff0c\u8ba9\u6211\u4eec\u76f4\u63a5\u8f6c\u7ed9\u9500\u552e\u56e2\u961f \u2014\u2014 **48 \u5c0f\u65f6\u5185** \u56de\u590d\u3002';

  // -------- 3. Build the DOM --------
  var HTML = '' +
    '<button class="pp-chat-fab" type="button" aria-label="Open chat assistant - 1 new message" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pp-chat-fab__icon-open" aria-hidden="true">' +
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
      '</svg>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pp-chat-fab__icon-close" aria-hidden="true">' +
        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
      '</svg>' +
      '<span class="pp-chat-fab__badge" aria-hidden="true">1</span>' +
    '</button>' +
    '<div class="pp-chat" role="dialog" aria-label="Live enquiry assistant" aria-hidden="true">' +
      '<header class="pp-chat__header">' +
        '<div class="pp-chat__avatar" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">' +
            '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>' +
          '</svg>' +
        '</div>' +
        '<div class="pp-chat__title">' +
          '<div class="pp-chat__name">SHENHE ZHONGKE Assistant</div>' +
          '<div class="pp-chat__status"><span class="pp-chat__dot"></span>Online \u00b7 48h reply</div>' +
        '</div>' +
        '<button class="pp-chat__close" type="button" aria-label="Close chat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</header>' +
      '<div class="pp-chat__body" aria-live="polite"></div>' +
      '<div class="pp-chat__suggestions" aria-label="Quick questions"></div>' +
      '<form class="pp-chat__form" autocomplete="off">' +
        '<input class="pp-chat__input" type="text" name="q" placeholder="Ask anything \u2014 MOQ, lead time, OEM\u2026" aria-label="Your question" maxlength="200">' +
        '<button class="pp-chat__send" type="submit" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">' +
            '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
          '</svg>' +
        '</button>' +
      '</form>' +
    '</div>';

  // Inject
  var wrap = document.createElement('div');
  wrap.className = 'pp-chatbot-root';
  wrap.innerHTML = HTML;
  document.body.appendChild(wrap);

  var fab = wrap.querySelector('.pp-chat-fab');
  var panel = wrap.querySelector('.pp-chat');
  var closeBtn = wrap.querySelector('.pp-chat__close');
  var body = wrap.querySelector('.pp-chat__body');
  var suggWrap = wrap.querySelector('.pp-chat__suggestions');
  var form = wrap.querySelector('.pp-chat__form');
  var inputEl = wrap.querySelector('.pp-chat__input');
  var badge = wrap.querySelector('.pp-chat-fab__badge');

  // -------- 4. Open / close behavior --------
  var isOpen = false;
  var initialized = false;

  function openChat() {
    if (!initialized) {
      initialized = true;
      badge.style.display = 'none';
      fab.setAttribute('aria-label', 'Close chat assistant');
      pushWelcome();
      renderSuggestions(currentSuggSet());
      // P1-5: lazy-fetch FAQ JSON on first open (small ~22KB, cached after)
      loadKBFromJSON();
    }
    isOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    fab.classList.add('is-active');
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(function () { inputEl.focus(); }, 250);
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    fab.classList.remove('is-active');
    fab.setAttribute('aria-expanded', 'false');
    /* The badge was read once and is hidden for good, so the name goes
       back to the plain one - no "1" for a screen reader to hear about a
       message that has already been opened. */
    fab.setAttribute('aria-label', initialized ? 'Open chat assistant'
                                                : 'Open chat assistant - 1 new message');
  }

  fab.addEventListener('click', function () { isOpen ? closeChat() : openChat(); });
  closeBtn.addEventListener('click', closeChat);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  // -------- 5. Render helpers --------
  function fmt(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function pushWelcome() {
    var hello = (window.I18n && I18n.getLang && I18n.getLang() === 'zh')
      ? '\u4f60\u597d\uff01\u6211\u662f SHENHE ZHONGKE \u7684\u8be2\u76d8\u52a9\u624b\u3002\u53ef\u4ee5\u95ee\u6211 MOQ\u3001\u4ea4\u671f\u3001\u8ba4\u8bc1\u3001\u8d34\u724c\u7b49\u5e38\u89c1\u95ee\u9898\uff0c\u6216\u70b9\u4e0b\u65b9\u5feb\u6377\u6309\u94ae\u3002'
      : 'Hi! I\u2019m the SHENHE ZHONGKE enquiry assistant. Ask about MOQ, lead time, OEM/ODM, certifications, shipping \u2014 or pick a quick question below.';
    pushBubble(hello, 'bot');
  }

  function pushBubble(text, who, rawHtml) {
    var el = document.createElement('div');
    el.className = 'pp-chat__bubble pp-chat__bubble--' + who;
    el.innerHTML = rawHtml ? text : fmt(text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function pushHumanFallback() {
    var card = document.createElement('div');
    card.className = 'pp-chat__human-card';
    var isZh = window.I18n && I18n.getLang && I18n.getLang() === 'zh';
    var titleLabel = isZh ? '\u8054\u7cfb\u6211\u4eec\u9500\u552e\uff1a' : 'Talk to our sales team:';
    card.innerHTML = '' +
      '<div class="pp-chat__human-title">' + titleLabel + '</div>' +
      '<div class="pp-chat__human-actions">' +
        '<a class="pp-chat__human-btn pp-chat__human-btn--wa" href="https://wa.me/8617266659928" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.6 6.3A7.9 7.9 0 0 0 12 4a7.9 7.9 0 0 0-6.8 12L4 20l4.1-1.1A7.9 7.9 0 0 0 12 20a7.9 7.9 0 0 0 7.9-7.9c0-2.1-.8-4.1-2.3-5.6l-.0-.2zm-5.6 12a6.6 6.6 0 0 1-3.4-.9l-.2-.1-2.5.7.7-2.4-.2-.3a6.6 6.6 0 1 1 12.5-2 6.6 6.6 0 0 1-6.9 5zM14.7 14c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1-.1.2-.5.6-.6.7-.1.1-.2.1-.4 0a5.4 5.4 0 0 1-1.6-1 6 6 0 0 1-1.1-1.4c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1.1-.2 0-.3l-.6-1.4c-.1-.3-.3-.3-.4-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.1.8 2.2.9 2.4.1.2 1.6 2.5 4 3.5.6.3 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.2-.2-.4-.3z"/></svg>' +
          ' WhatsApp' +
        '</a>' +
        '<a class="pp-chat__human-btn" href="mailto:sales@shenhezhongke.com?subject=Enquiry%20from%20chatbot">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
            '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>' +
            '<polyline points="22,6 12,13 2,6"/>' +
          '</svg>' +
          ' Email' +
        '</a>' +
        '<a class="pp-chat__human-btn" href="contact.html">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
            '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
          '</svg>' +
          ' ' + (isZh ? '\u7559\u8a00\u8868\u5355' : 'Contact form') +
        '</a>' +
      '</div>';
    body.appendChild(card);
    body.scrollTop = body.scrollHeight;
  }

  // -------- 6. Suggestions --------
  var suggRound = 0;
  function currentSuggSet() {
    return SUGGESTIONS[suggRound % SUGGESTIONS.length];
  }

  function renderSuggestions(items) {
    suggWrap.innerHTML = '';
    items.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pp-chat__chip';
      b.textContent = q;
      b.addEventListener('click', function () { handleUser(q); });
      suggWrap.appendChild(b);
    });
  }

  function refreshSuggestions() {
    suggRound++;
    renderSuggestions(currentSuggSet());
  }

  // -------- 7. Matcher --------
  function normalize(s) {
    return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Intent routing.
   *
   * WHY THIS EXISTS
   * Scoring keywords on their own produced confidently wrong answers. "How
   * much is the shipping cost to Europe?" scored highest on the pricing entry,
   * because "cost" appears in both. "What is the lead time for private
   * label?" was answered with the custom-packaging entry, because both
   * mention "label". The visitor received a fluent, relevant-looking answer
   * to a question that had not been answered.
   *
   * The fix is to decide WHAT the visitor is asking about first, and only
   * then to score within that group. A question about freight must never be
   * answered by the pricing entry, whatever the keyword overlap says.
   *
   * Each intent has its own trigger list. The order matters: the first
   * intent whose triggers appear in the question wins, and the triggers are
   * written so that a specific phrase beats a generic one.
   */
  var INTENTS = [
    {
      name: 'lead-time',
      // "when can you ship" asks about TIME, so it belongs to lead-time even
      // though it contains the word "ship". Shipping triggers that name a
      // method or a cost stay in the shipping group.
      triggers: ['when can you ship', 'lead time', 'production time', 'delivery time',
        'manufacturing time', 'how long does production', 'how long to ship',
        'how long will it take', '交期', '生产周期', '货期', '多久能出货', '什么时候发货'],
    },
    {
      name: 'shipping',
      triggers: ['shipping cost', 'how much is shipping', 'freight cost', 'shipping price',
        'how much is freight', 'ship by sea', 'ship by air', 'can you ship', 'do you ship',
        'sea freight', 'air freight', 'transport',
        '运费', '海运费', '空运费', '物流费', '海运', '空运', '怎么发货', '发货方式'],
    },
    {
      name: 'moq',
      triggers: ['minimum order', 'minimum quantity', 'moq', 'least order', 'smallest order',
        'trial order', 'how many units', '起订量', '最小起订', '起订'],
    },
    {
      name: 'payment',
      triggers: ['payment terms', 'how do i pay', 'l/c at sight', 'letter of credit',
        'terms of payment', 'payment method', '付款方式', '账期', '信用证', '怎么付款'],
    },
    {
      name: 'documents',
      triggers: ['what documents', 'certificate of analysis', 'test report', 'msds', 'sds',
        'what paperwork', '随货文件', '检测报告', '报关文件'],
    },
    {
      name: 'sample',
      triggers: ['free sample', 'do you provide samples', 'sample cost', 'send a sample',
        '打样', '寄样', '样品'],
    },
    {
      name: 'certifications',
      triggers: ['what certifications', 'which certifications', 'iso 22716', 'iso22716',
        'fda registered', 'are you certified', '认证', '资质', '许可证'],
    },
    {
      name: 'factory-visit',
      triggers: ['factory visit', 'factory tour', 'visit the factory', 'come to china',
        '参观', '来厂', '看工厂'],
    },
    {
      name: 'capacity',
      triggers: ['monthly capacity', 'production capacity', 'how much can you produce',
        'how many bottles', '月产能', '产能多少', '年产能'],
    },
    {
      name: 'oem',
      triggers: ['private label', 'custom formula', 'white label', 'custom packaging',
        'do you do oem', 'customization', '贴牌', '代工', '定制', '自有配方'],
    },
    {
      name: 'company',
      triggers: ['factory or a trading', 'are you a manufacturer', 'trading company',
        'how long have you been', 'founded', 'your company',
        '是不是工厂', '贸易公司', '成立多久', '你们公司'],
    },
  ];

  /**
   * The words that make a question ABOUT A PRODUCT.
   *
   * Deliberately broad: the point is not to recognise the exact SKU name but
   * to catch a question that mentions a product word, so that it is answered
   * from the product pool rather than the generic ordering pool.
   */
  var PRODUCTISH = /\b(shampoo|foam|gel|powder|spray|water|solution|wash|kit|deodor|pest|ear|dental|litter|paw|insect|protection|cleansing|laundry|bacterial|antifungal|probiotic|immunoglobulin|mite|outdoor|repellent|odor|disinfectant|disinfect|ringworm|fungus|fungal|chlorine|bio|enzyme|clumping|wax|plaque|breath|moisturiz|hydration|sanitiz)\b/;

  /**
   * The words that make a product question a COMMERCIAL one.
   *
   * A question that names a product and asks about its price or minimum
   * order wants the hand-off answer; a question that just names the product
   * wants the description. Without this split, the hand-off entry tied with
   * the description entry on every product mention and the visitor got
   * "tell me your destination" in reply to "what does this do".
   */
  var COMMERCIAL = /\b(moq|price|cost|how much|minimum order|lead time|hs code|carton|specification|spec|quantity|discount|payment|shipping cost|freight)\b/;

  function detectIntent(q) {
    for (var i = 0; i < INTENTS.length; i++) {
      var t = INTENTS[i].triggers;
      for (var j = 0; j < t.length; j++) {
        if (q.indexOf(t[j]) !== -1) return INTENTS[i].name;
      }
    }
    return null;
  }

  /** The intent a knowledge base entry belongs to. */
  function entryIntent(e) {
    if (e.intent && e.intent !== 'general') return e.intent;
    return 'product';
  }

  function scoreEntry(q, entry) {
    var score = 0;
    (entry.kw || []).forEach(function (k) {
      var kn = normalize(k);
      if (!kn) return;
      if (q === kn) score += 3;
      else if (q.indexOf(kn) !== -1) score += 2;
      else {
        var words = kn.split(' ').filter(function (w) { return w.length >= 3; });
        words.forEach(function (w) { if (q.indexOf(w) !== -1) score += 0.5; });
      }
    });
    return score;
  }

  /**
   * Match a question to a knowledge base entry.
   *
   * The intent decides the POOL; the score decides the winner inside it.
   * A question that names a product is answered from the product pool, and
   * within that pool the description entry wins unless a commercial word
   * says the visitor is asking about price or minimum order.
   *
   * If the routed pool has no confident match, the search falls back to the
   * whole knowledge base rather than returning nothing: a weaker answer from
   * another group beats a silent bot.
   */
  function matchKB(query) {
    var q = normalize(query);
    if (!q) return null;
    var isZh = window.I18n && I18n.getLang && I18n.getLang() === 'zh';

    var intent = detectIntent(q);
    var pool = KB;
    var namesProduct = PRODUCTISH.test(q);
    var commercial = COMMERCIAL.test(q);

    if (intent && !(namesProduct && (intent === 'moq' || intent === 'quote' ||
        intent === 'shipping' || intent === 'lead-time'))) {
      var scoped = KB.filter(function (e) { return entryIntent(e) === intent; });
      if (scoped.length) pool = scoped;
    } else if (namesProduct) {
      var want = commercial ? ['product-quote'] : ['product'];
      var scopedP = KB.filter(function (e) { return want.indexOf(entryIntent(e)) !== -1; });
      if (!scopedP.length) {
        scopedP = KB.filter(function (e) {
          var i = entryIntent(e);
          return i === 'product' || i === 'product-quote';
        });
      }
      if (scopedP.length) pool = scopedP;
    }

    var bestEntry = null;
    var bestScore = 0;
    pool.forEach(function (entry) {
      var score = scoreEntry(q, entry);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    });

    if (bestScore < 1.5 && pool !== KB) {
      KB.forEach(function (entry) {
        var score = scoreEntry(q, entry);
        if (score > bestScore) {
          bestScore = score;
          bestEntry = entry;
        }
      });
    }

    if (bestScore >= 1.5 && bestEntry) {
      return isZh ? bestEntry.zh : bestEntry.en;
    }
    return null;
  }

  // -------- 8. User interaction --------
  // RAG-first: try the DeepSeek-backed endpoint first; fall back to keyword KB;
  // final fallback is the WhatsApp/Email human handoff card.
  var RAG_ENDPOINT = (window.SHENHE_RAG_ENDPOINT) || '/api/rag/browser';
  var RAG_TIMEOUT_MS = 6000;
  // Detect language for the fallback message
  function isZhLang() {
    return window.I18n && I18n.getLang && I18n.getLang() === 'zh';
  }
  // Markdown-ish linkify so DeepSeek's URLs become clickable
  function linkify(s) {
    if (!s) return s;
    var escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  // Convert Basic Markdown (**bold**, *italic*, line breaks) to safe HTML
  function mdLite(s) {
    if (!s) return '';
    var escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
  }

  // Build a short conversation history from rendered bubbles so the backend
  // can maintain multi-turn context (last 6 turns).
  function getConversationHistory() {
    var turns = [];
    var bubbles = body.querySelectorAll('.pp-chat__bubble--user, .pp-chat__bubble--bot');
    // Skip the most recent (current) turn being submitted
    var hist = Array.prototype.slice.call(bubbles, -7, -1);
    hist.forEach(function (el) {
      var role = el.classList.contains('pp-chat__bubble--user') ? 'user' : 'assistant';
      var txt = (el.textContent || '').trim();
      if (txt && txt.length < 800) turns.push({ role: role, content: txt });
    });
    return turns.slice(-6);
  }

  // Streaming call to /api/rag/browser.
  // Calls onChunk(delta) for each token as it arrives.
  // Resolves with { ok, reply, usage, fallback, model, promptVersion } once stream completes.
  function callRAG(text, onChunk) {
    return new Promise(function (resolve) {
      var ctrl;
      try {
        ctrl = new AbortController();
      } catch (_) { ctrl = null; }
      var history = getConversationHistory();
      var messages = history.concat([{ role: 'user', content: text }]);
      var opts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages: messages, honeypot: '', stream: true }),
      };
      if (ctrl) opts.signal = ctrl.signal;
      var timer = setTimeout(function () {
        try { if (ctrl) ctrl.abort(); } catch (_) {}
        resolve({ ok: false, error: 'timeout' });
      }, RAG_TIMEOUT_MS);

      fetch(RAG_ENDPOINT, opts)
        .then(function (r) {
          clearTimeout(timer);
          if (!r.ok || !r.body) {
            return r.json().catch(function () { return {}; }).then(function (j) {
              resolve({ ok: false, error: (j && j.error) || ('http_' + r.status) });
            });
          }
          var reader = r.body.getReader();
          var dec = new TextDecoder();
          var buf = '';
          var fullReply = '';
          var usage = null;
          var fallback = false;
          var usedModel = null;
          var promptVersion = null;

          function pump() {
            return reader.read().then(function (res) {
              if (res.done) {
                resolve({ ok: !!fullReply, reply: fullReply, usage: usage, fallback: fallback, model: usedModel, promptVersion: promptVersion });
                return;
              }
              buf += dec.decode(res.value, { stream: true });
              var lines = buf.split('\n');
              buf = lines.pop();
              for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line || line.indexOf('data:') !== 0) continue;
                var payload = line.slice(5).trim();
                if (payload === '[DONE]') continue;
                try {
                  var obj = JSON.parse(payload);
                  if (obj.delta && typeof obj.delta === 'string') {
                    fullReply += obj.delta;
                    if (onChunk) onChunk(obj.delta, fullReply);
                  } else if (obj.reply && obj.done) {
                    // Final accumulated payload from server (DeepSeek usage piggybacked)
                    if (obj.usage) usage = obj.usage;
                    if (obj.fallback) fallback = true;
                    if (obj.model) usedModel = obj.model;
                    if (obj.prompt_version) promptVersion = obj.prompt_version;
                  } else if (obj.fallback && obj.reply) {
                    fullReply = obj.reply;
                    fallback = true;
                  } else if (obj.error) {
                    resolve({ ok: false, error: obj.error });
                    return;
                  }
                } catch (e) { /* skip malformed */ }
              }
              return pump();
            });
          }
          return pump();
        })
        .catch(function (e) {
          clearTimeout(timer);
          resolve({ ok: false, error: e.message || 'fetch_failed' });
        });
    });
  }

  function handleUser(text) {
    if (!text || !text.trim()) return;
    pushBubble(text, 'user');
    try { form.reset(); } catch (_) {}
    suggWrap.innerHTML = '';

    // Create the bot bubble upfront so we can stream tokens into it
    var botBubble = document.createElement('div');
    botBubble.className = 'pp-chat__bubble pp-chat__bubble--bot';
    botBubble.textContent = '';
    body.appendChild(botBubble);
    body.scrollTop = body.scrollHeight;

    // Try RAG (streaming). Tokens arrive via onChunk; if it errors, fall back.
    callRAG(text, function onChunk(_delta, fullSoFar) {
      // Use plain textContent during streaming (fast, no flicker)
      botBubble.textContent = fullSoFar;
      body.scrollTop = body.scrollHeight;
    }).then(function (rag) {
      if (rag.ok) {
        // Final pass: re-render with linkify + markdown for clean output
        botBubble.innerHTML = linkify(mdLite(rag.reply));
        body.scrollTop = body.scrollHeight;
        // P1-6: append feedback buttons below the reply bubble
        pushFeedbackRow(botBubble, text, rag.reply, rag.model, rag.promptVersion);
        if (/WhatsApp|email|\u8054\u7cfb|hi /i.test(rag.reply)) {
          pushHumanFallback();
        }
        refreshSuggestions();
        return;
      }
      // RAG failed — remove the empty bubble, try local keyword KB
      botBubble.remove();
      var answer = matchKB(text);
      if (answer) {
        var botBubble2 = pushBubble(answer, 'bot');
        // P1-6: also attach feedback for KB hit (model='kb-local', pv='v1')
        pushFeedbackRow(botBubble2, text, answer, 'kb-local', PROMPT_VERSION);
        refreshSuggestions();
        return;
      }
      // Neither RAG nor KB matched — human handoff
      var fbBot = pushBubble(isZhLang() ? FALLBACK_ZH : FALLBACK_EN, 'bot');
      pushFeedbackRow(fbBot, text, isZhLang() ? FALLBACK_ZH : FALLBACK_EN, 'fallback', PROMPT_VERSION);
      pushHumanFallback();
      refreshSuggestions();
    });
  }

  // -------- P1-6: Feedback (👍/👎) --------
  var FEEDBACK_ENDPOINT = (window.SHENHE_FEEDBACK_ENDPOINT) || '/api/rag/feedback';
  function getSessionId() {
    try {
      var k = 'pp_chat_session_id';
      var sid = window.localStorage.getItem(k);
      if (!sid) {
        sid = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
        window.localStorage.setItem(k, sid);
      }
      return sid;
    } catch (_) {
      return 'sess-anon-' + Date.now();
    }
  }

  function pushFeedbackRow(afterEl, userMsg, botReply, model, promptVersion) {
    if (!afterEl) return;
    var row = document.createElement('div');
    row.className = 'pp-chat__feedback';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Was this answer helpful?');
    row.innerHTML =
      '<button type="button" class="pp-chat__fb-btn" data-rating="up" aria-label="Helpful" title="Helpful">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>' +
        ' <span>' + (isZhLang() ? '有用' : 'Helpful') + '</span>' +
      '</button>' +
      '<button type="button" class="pp-chat__fb-btn" data-rating="down" aria-label="Not helpful" title="Not helpful">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>' +
        ' <span>' + (isZhLang() ? '没用' : 'Not helpful') + '</span>' +
      '</button>' +
      '<span class="pp-chat__fb-thanks" aria-hidden="true">' + (isZhLang() ? '谢谢反馈' : 'Thanks!') + '</span>';
    // Insert directly after the bubble
    afterEl.parentNode.insertBefore(row, afterEl.nextSibling);
    body.scrollTop = body.scrollHeight;

    var buttons = row.querySelectorAll('.pp-chat__fb-btn');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var rating = b.getAttribute('data-rating');
        buttons.forEach(function (x) { x.disabled = true; x.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        var thanks = row.querySelector('.pp-chat__fb-thanks');
        if (thanks) thanks.classList.add('is-visible');
        sendFeedback({
          rating: rating,
          message_preview: (userMsg || '').slice(0, 200),
          reply_preview: (botReply || '').slice(0, 200),
          model: model || null,
          prompt_version: promptVersion || null,
        });
      });
    });
  }

  function sendFeedback(payload) {
    try {
      fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ session_id: getSessionId() }, payload)),
        credentials: 'same-origin',
      }).catch(function () { /* swallow — feedback is best-effort */ });
    } catch (_) { /* ignore */ }
  }

  // Expose PROMPT_VERSION for the fallback path (chatbot can't see server env, default to v1)
  var PROMPT_VERSION = (window.SHENHE_PROMPT_VERSION) || 'v1';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleUser(inputEl.value);
  });
})();
