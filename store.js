/* Ace It storage. Every read and write of saved data goes through here, so a sync
   layer can be added later without touching the screens.
   Loads in the browser as window.Store and in Node with require('./store.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Store = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DATA_KEY = 'aceit.data';
  var PREFIX = 'aceit.';
  var SCHEMA_VERSION = 1;
  var APP_ID = 'ace-it';

  // localStorage in the browser; an in-memory stand-in in Node or if storage is blocked.
  var memory = {};
  var backend = (function () {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aceit.__probe', '1');
        localStorage.removeItem('aceit.__probe');
        return localStorage;
      }
    } catch (e) {}
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
      setItem: function (k, v) { memory[k] = String(v); },
      removeItem: function (k) { delete memory[k]; }
    };
  })();

  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function str(x, fallback) { return typeof x === 'string' ? x : (fallback || ''); }
  function numOrNull(x) { return isNum(x) ? x : null; }

  function uid(prefix) {
    return (prefix || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function defaultTiers() {
    return [
      { id: 'required', name: 'Required', target: 8.8 },
      { id: 'goal', name: 'Goal', target: 9.0 },
      { id: 'ideal', name: 'Ideal', target: 9.3 },
      { id: 'honors', name: 'Honorable mention', target: 9.5 }
    ];
  }

  function defaultSettings() {
    return {
      totalCourses: null,      // optional: only needed for whole-degree predictions
      passingGrade: 6,
      defaultThreshold: 5,     // 5 = round up from .5, 6 = round up from .6
      futureAssumed: null,     // null = use the Goal tier
      tiers: defaultTiers()
    };
  }

  function freshData() {
    return { schemaVersion: SCHEMA_VERSION, onboarded: false, settings: defaultSettings(), terms: [], courses: [] };
  }

  // ---------- migrations ----------
  // MIGRATIONS[n] turns schema version n into n + 1. Add a function here whenever the
  // shape changes; never edit an old one. Version 0 means "no schemaVersion field".
  var MIGRATIONS = [
    function v0to1(d) {
      d = d && typeof d === 'object' ? d : {};
      d.schemaVersion = 1;
      return d;
    }
  ];

  function migrate(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('not-data');
    var d = JSON.parse(JSON.stringify(raw));
    var v = isNum(d.schemaVersion) ? Math.floor(d.schemaVersion) : 0;
    if (v > SCHEMA_VERSION) throw new Error('newer-version');
    while (v < SCHEMA_VERSION) {
      d = MIGRATIONS[v](d);
      v++;
      d.schemaVersion = v;
    }
    return normalize(d);
  }

  // ---------- shape checks (fill gaps, drop anything unusable) ----------

  function normAdjustments(list) {
    return (Array.isArray(list) ? list : []).filter(function (a) { return a && isNum(a.points); }).map(function (a) {
      return { id: str(a.id) || uid('a'), label: str(a.label), points: a.points, confirmed: a.confirmed === true };
    });
  }

  function normItem(it) {
    return {
      id: str(it.id) || uid('i'),
      name: str(it.name, 'Item'),
      status: it.status === 'graded' ? 'graded' : 'pending',
      score: numOrNull(it.score),
      points: numOrNull(it.points),
      max: isNum(it.max) && it.max > 0 ? it.max : null,
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(it.date)) ? it.date : null,
      weight: isNum(it.weight) && it.weight > 0 ? it.weight : null,
      adjustments: normAdjustments(it.adjustments)
    };
  }

  function normCategory(c) {
    return {
      id: str(c.id) || uid('g'),
      name: str(c.name, 'Category'),
      weight: isNum(c.weight) ? Math.max(0, c.weight) : 0,
      items: (Array.isArray(c.items) ? c.items : []).filter(Boolean).map(normItem)
    };
  }

  function normCourse(c, termIds, defaultThreshold) {
    var mode = c.mode === 'single' ? 'single' : 'weighted';
    var cats = (Array.isArray(c.categories) ? c.categories : []).filter(Boolean).map(normCategory);
    var alt = null;
    if (c.altWeights && typeof c.altWeights === 'object') {
      alt = {};
      cats.forEach(function (cat) { if (isNum(c.altWeights[cat.id])) alt[cat.id] = Math.max(0, c.altWeights[cat.id]); });
      if (!Object.keys(alt).length) alt = null;
    }
    var s = c.single && typeof c.single === 'object' ? c.single : {};
    var r = c.rounding && typeof c.rounding === 'object' ? c.rounding : {};
    return {
      id: str(c.id) || uid('c'),
      termId: termIds.indexOf(c.termId) >= 0 ? c.termId : null,
      name: str(c.name, 'Course'),
      professor: str(c.professor),
      rounding: { threshold: r.threshold === 6 ? 6 : (r.threshold === 5 ? 5 : defaultThreshold), unconfirmed: r.unconfirmed === true },
      mode: mode,
      counts: c.counts !== false,
      done: c.done === true,
      posted: numOrNull(c.posted),
      categories: cats,
      weightsUnconfirmed: c.weightsUnconfirmed === true,
      altWeights: alt,
      expectedPending: numOrNull(c.expectedPending),
      single: { expected: numOrNull(s.expected), low: numOrNull(s.low), high: numOrNull(s.high) },
      adjustments: normAdjustments(c.adjustments),
      createdAt: isNum(c.createdAt) ? c.createdAt : Date.now()
    };
  }

  function normTerm(t, i) {
    return {
      id: str(t.id) || uid('t'),
      kind: t.kind === 'summer' ? 'summer' : 'semester',
      number: isNum(t.number) ? t.number : null,
      year: isNum(t.year) ? t.year : null,
      label: str(t.label),
      dates: str(t.dates),
      planned: isNum(t.planned) && t.planned > 0 ? Math.round(t.planned) : null,
      order: isNum(t.order) ? t.order : i
    };
  }

  function normalize(d) {
    var base = defaultSettings();
    var s = d.settings && typeof d.settings === 'object' ? d.settings : {};
    var tiers = Array.isArray(s.tiers) ? s.tiers.filter(function (t) { return t && isNum(t.target); }).map(function (t) {
      return { id: str(t.id) || uid('tier'), name: str(t.name, 'Tier'), target: t.target };
    }) : base.tiers;
    var settings = {
      totalCourses: isNum(s.totalCourses) && s.totalCourses > 0 ? Math.round(s.totalCourses) : null,
      passingGrade: isNum(s.passingGrade) ? s.passingGrade : base.passingGrade,
      defaultThreshold: s.defaultThreshold === 6 ? 6 : 5,
      futureAssumed: numOrNull(s.futureAssumed),
      tiers: tiers
    };
    var terms = (Array.isArray(d.terms) ? d.terms : []).filter(Boolean).map(normTerm);
    var termIds = terms.map(function (t) { return t.id; });
    var courses = (Array.isArray(d.courses) ? d.courses : []).filter(Boolean)
      .map(function (c) { return normCourse(c, termIds, settings.defaultThreshold); })
      .filter(function (c) { return c.termId; });
    return {
      schemaVersion: SCHEMA_VERSION,
      onboarded: d.onboarded === true || terms.length > 0,
      settings: settings,
      terms: terms,
      courses: courses
    };
  }

  // ---------- load / save ----------

  function load() {
    var raw = null;
    try { raw = backend.getItem(DATA_KEY); } catch (e) {}
    if (!raw) return freshData();
    try {
      return migrate(JSON.parse(raw));
    } catch (e) {
      // Keep the unreadable copy instead of overwriting it, so nothing is lost for good.
      try { backend.setItem(DATA_KEY + '.unreadable.' + Date.now(), raw); } catch (e2) {}
      return freshData();
    }
  }

  function save(data) {
    data.schemaVersion = SCHEMA_VERSION;
    try {
      backend.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function erase() {
    try { backend.removeItem(DATA_KEY); } catch (e) {}
  }

  // ---------- small preferences (theme, backup reminder) ----------

  function getPref(name) {
    try {
      var v = backend.getItem(PREFIX + name);
      return v == null ? null : JSON.parse(v);
    } catch (e) { return null; }
  }

  function setPref(name, value) {
    try {
      if (value == null) backend.removeItem(PREFIX + name);
      else backend.setItem(PREFIX + name, JSON.stringify(value));
    } catch (e) {}
  }

  // ---------- backup files ----------

  function exportBackup(data) {
    return JSON.stringify({
      app: APP_ID,
      kind: 'backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: data
    }, null, 2);
  }

  // Accepts an Ace It backup file (or bare saved data). Throws Error('not-backup' |
  // 'newer-version' | 'bad-json') when it can't be used.
  function parseBackup(text) {
    var obj;
    try { obj = JSON.parse(String(text).trim()); } catch (e) { throw new Error('bad-json'); }
    if (!obj || typeof obj !== 'object') throw new Error('not-backup');
    var payload;
    if (obj.app === APP_ID && obj.data && typeof obj.data === 'object') {
      payload = obj.data;
      if (!isNum(payload.schemaVersion) && isNum(obj.schemaVersion)) payload.schemaVersion = obj.schemaVersion;
    } else if (Array.isArray(obj.terms) && Array.isArray(obj.courses)) {
      payload = obj;
    } else {
      throw new Error('not-backup');
    }
    var d = migrate(payload);
    d.onboarded = true;
    return d;
  }

  function backupFileName() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return 'ace-it-backup-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.json';
  }

  // ---------- persistent storage ----------
  // Asks the browser not to clear this app's data when the phone runs low on space.
  function requestPersistence() {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) return Promise.resolve(null);
    return navigator.storage.persisted().then(function (already) {
      return already ? true : navigator.storage.persist();
    }).catch(function () { return null; });
  }

  function persistenceStatus() {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persisted) return Promise.resolve(null);
    return navigator.storage.persisted().catch(function () { return null; });
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    uid: uid,
    defaultTiers: defaultTiers,
    defaultSettings: defaultSettings,
    freshData: freshData,
    migrate: migrate,
    normalize: normalize,
    load: load,
    save: save,
    erase: erase,
    getPref: getPref,
    setPref: setPref,
    exportBackup: exportBackup,
    parseBackup: parseBackup,
    backupFileName: backupFileName,
    requestPersistence: requestPersistence,
    persistenceStatus: persistenceStatus
  };
});
