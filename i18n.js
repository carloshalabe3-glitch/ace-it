/* Ace It languages. English is written in the app itself; this module turns what the
   app puts on screen into the chosen language: text, placeholders, labels and titles.
   Anything the person typed (course, item, category, term and professor names) is never
   translated. Loads in the browser as window.I18N and in Node with require('./i18n.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18N = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LANGS = ['en', 'es'];
  var lang = 'en';
  var userText = {};          // exact strings the person typed: never translated
  var ATTRS = ['placeholder', 'aria-label', 'title', 'data-tip'];

  // ---------- Spanish ----------
  // Exact strings (trimmed). Keys are the English the app shows.
  var ES = {};
  // Patterns for text with numbers or names in it, tried in order. A function gets the
  // match and returns the Spanish; a string can use $1, $2...
  var ES_PATTERNS = [];

  function pl(n, one, many) { return (+n === 1 ? one : many); }

  function add(map) { for (var k in map) ES[k] = map[k]; }
  function pattern(re, out) { ES_PATTERNS.push([re, out]); }

  // ---------- engine ----------

  function setLang(l) { lang = LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function getLang() { return lang; }
  function setUserText(list) {
    userText = {};
    (list || []).forEach(function (s) { if (s && typeof s === 'string') userText[s.trim()] = true; });
  }

  // Translates one string. Leading and trailing spaces are kept as they were.
  function tr(text) {
    if (lang === 'en' || text == null) return text;
    var s = String(text);
    var core = s.trim();
    if (!core || userText[core] || !/[A-Za-z]/.test(core)) return s;
    var out = ES[core];
    if (out == null) {
      for (var i = 0; i < ES_PATTERNS.length; i++) {
        var m = core.match(ES_PATTERNS[i][0]);
        if (m) {
          var o = ES_PATTERNS[i][1];
          out = typeof o === 'function' ? o.apply(null, m) : core.replace(ES_PATTERNS[i][0], o);
          break;
        }
      }
    }
    // Lines that join pieces with " · " (a professor and a term, a date and a weight):
    // translate each piece on its own, so typed names stay as they are.
    if (out == null && core.indexOf(' · ') > 0) {
      var parts = core.split(' · ');
      var tp = parts.map(function (x) { return tr(x); });
      if (tp.join(' · ') !== core) out = tp.join(' · ');
    }
    if (out == null) return s;
    var lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    return lead + out + tail;
  }

  function isTranslatable(core) {
    return lang !== 'en' && !!core && !userText[core] && /[A-Za-z]/.test(core);
  }

  // Walks a DOM subtree and translates its text and the attributes people read.
  function translateTree(node) {
    if (lang === 'en' || !node) return;
    if (node.nodeType === 3) { translateText(node); return; }
    if (node.nodeType !== 1) return;
    if (node.closest && node.closest('[translate="no"], script, style')) return;
    translateAttrs(node);
    var walker = node.ownerDocument.createTreeWalker(node, 1 | 4, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) translateText(n);
      else translateAttrs(n);
    }
  }
  function translateText(t) {
    var p = t.parentNode;
    if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA') return;
    if (p.closest && p.closest('[translate="no"]')) return;
    var v = t.nodeValue, nv = tr(v);
    if (nv !== v) t.nodeValue = nv;
  }
  function translateAttrs(el) {
    if (!el.getAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a == null) continue;
      var na = tr(a);
      if (na !== a) el.setAttribute(ATTRS[i], na);
    }
  }

  var observer = null;
  // Keeps everything the app adds to the page translated from now on.
  function watch(doc) {
    if (observer || lang === 'en' || typeof MutationObserver === 'undefined') return;
    translateTree(doc.body);
    observer = new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === 'attributes') translateAttrs(r.target);
        else for (var i = 0; i < r.addedNodes.length; i++) translateTree(r.addedNodes[i]);
      });
    });
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ATTRS });
  }

  return {
    LANGS: LANGS, ES: ES, ES_PATTERNS: ES_PATTERNS,
    add: add, pattern: pattern, pl: pl,
    setLang: setLang, getLang: getLang, setUserText: setUserText,
    tr: tr, isTranslatable: isTranslatable, translateTree: translateTree, watch: watch
  };
});
