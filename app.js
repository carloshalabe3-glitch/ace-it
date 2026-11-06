(function () {
  'use strict';

  var G = window.Grades;
  var S = window.Store;
  var APP_VERSION = '1.0';

  var data = S.load();

  // ---------- small helpers ----------

  function $(id) { return document.getElementById(id); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plural(n, word, many) { return n + ' ' + (n === 1 ? word : (many || word + 's')); }
  function icon(id, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#sym-' + id + '"/></svg>'; }
  function num(text) {
    if (text == null) return null;
    var s = String(text).trim().replace(',', '.');
    if (!s) return null;
    var v = Number(s);
    return isFinite(v) ? v : NaN;
  }
  function fmtW(w) { return G.fmtNum(w, 2) + '%'; }
  function ceil2(x) { return (Math.ceil(x * 100 - 1e-7) / 100).toFixed(2); }

  function persist() {
    var ok = S.save(data);
    if (!ok) showToast("Couldn't save. Your phone may be out of storage.");
    if (data.onboarded && !persistAsked) {
      persistAsked = true;
      S.requestPersistence();
    }
  }
  var persistAsked = false;

  function commit() { persist(); renderAll(); }

  // ---------- data access ----------

  function sortedTerms() { return data.terms.slice().sort(function (a, b) { return a.order - b.order; }); }
  function termById(id) { return data.terms.filter(function (t) { return t.id === id; })[0] || null; }
  function courseById(id) { return data.courses.filter(function (c) { return c.id === id; })[0] || null; }
  function coursesOf(termId) { return data.courses.filter(function (c) { return c.termId === termId; }); }
  function termLabel(t) {
    if (!t) return '';
    if (t.label) return t.label;
    if (t.kind === 'summer') return 'Summer' + (t.year ? ' ' + t.year : '');
    return 'Semester' + (t.number ? ' ' + t.number : '');
  }
  function assumed() { return G.defaultAssumed(data.settings); }
  function result(c, weights) { return G.computeCourse(c, { assumed: assumed(), weights: weights }); }
  function thr(c) { return G.courseThreshold(c); }
  function isFinal(c) { return c.done || isNum(c.posted); }
  function findCategory(c, catId) { return (c.categories || []).filter(function (g) { return g.id === catId; })[0] || null; }
  function findItem(c, itemId) {
    var hit = null;
    (c.categories || []).forEach(function (g) { g.items.forEach(function (it) { if (it.id === itemId) hit = { cat: g, item: it }; }); });
    return hit;
  }
  function ruleText(t) { return t === 6 ? 'Rounds up from .6' : 'Rounds up from .5'; }

  // ---------- HTML pieces ----------

  function pairHTML(raw, t, cls) {
    if (!isNum(raw)) return '<span class="pair is-muted"><span class="raw">–</span></span>';
    return '<span class="pair ' + (cls || '') + '"><span class="raw">' + G.fmtRaw(raw, t) + '</span><span class="arrow">→</span><b class="fin">' + G.roundFinal(raw, t) + '</b></span>';
  }
  function chip(text, kind) { return '<span class="chip ' + (kind ? 'chip-' + kind : '') + '">' + esc(text) + '</span>'; }

  function segHTML(name, options, current) {
    var idx = Math.max(0, options.map(function (o) { return String(o.val); }).indexOf(String(current)));
    var n = options.length;
    return '<div class="seg" data-seg="' + name + '" role="radiogroup">' + options.map(function (o, i) {
      return '<button type="button" class="seg-opt' + (i === idx ? ' is-on' : '') + '" data-val="' + esc(o.val) + '" role="radio" aria-checked="' + (i === idx) + '"' + (o.aria ? ' aria-label="' + esc(o.aria) + '"' : '') + '>' + o.label + '</button>';
    }).join('') + '<span class="seg-thumb" aria-hidden="true" style="width:calc((100% - 6px) / ' + n + ');transform:translateX(' + (idx * 100) + '%)"></span></div>';
  }
  function setSeg(seg, val) {
    var opts = Array.prototype.slice.call(seg.querySelectorAll('.seg-opt'));
    var idx = Math.max(0, opts.map(function (o) { return o.dataset.val; }).indexOf(String(val)));
    opts.forEach(function (o, i) { o.classList.toggle('is-on', i === idx); o.setAttribute('aria-checked', String(i === idx)); });
    var thumb = seg.querySelector('.seg-thumb');
    if (thumb) thumb.style.transform = 'translateX(' + (idx * 100) + '%)';
  }
  function switchHTML(name, on, extra) {
    return '<label class="switch"><input type="checkbox" data-sw="' + name + '"' + (on ? ' checked' : '') + (extra || '') + '><i></i></label>';
  }

  function courseChips(c, r) {
    var out = [];
    if (isFinal(c)) out.push(chip('Final', 'good'));
    if (r.estimate) out.push(chip('Estimate', 'warn'));
    if (c.mode === 'weighted' && c.weightsUnconfirmed) out.push(chip('Weights unconfirmed', 'warn'));
    if (thr(c) === 6) out.push(chip('.6 rule', 'line'));
    if (c.rounding.unconfirmed) out.push(chip('Rule unconfirmed', 'warn'));
    if (!c.counts) out.push(chip('Not counted'));
    if (G.atRisk(c, r, data.settings.passingGrade)) out.push(chip('At risk', 'risk'));
    return out.join('');
  }

  function courseRowHTML(c, sub) {
    var r = result(c);
    var t = thr(c);
    var right = isNum(r.raw) ? pairHTML(r.raw, t, r.estimate ? 'is-est' : '') : '<span class="row-value">No grades yet</span>';
    var subParts = [];
    if (sub) subParts.push('<span>' + esc(sub) + '</span>');
    var chips = courseChips(c, r);
    return '<button class="row" data-act="open-course" data-id="' + c.id + '">' +
      '<span class="row-main"><span class="row-title">' + esc(c.name) + '</span>' +
      ((subParts.length || chips) ? '<span class="row-sub">' + subParts.join('') + chips + '</span>' : '') + '</span>' +
      '<span class="row-end">' + right + icon('chev', 'row-chev') + '</span></button>';
  }

  function emptyHTML(glyph, title, text, btnLabel, act) {
    return '<div class="empty"><div class="empty-glyph">' + icon(glyph) + '</div><p class="empty-title">' + esc(title) + '</p>' +
      '<p class="empty-text">' + esc(text) + '</p>' + (btnLabel ? '<button class="btn btn-primary" data-act="' + act + '">' + esc(btnLabel) + '</button>' : '') + '</div>';
  }

  function topbarHTML(title, actions) {
    return '<header class="topbar"><div class="brand"><h1>' + esc(title) + '</h1></div><div class="topbar-actions">' + (actions || '') + '</div></header>';
  }
  function subbarHTML(backLabel, title, rightHTML) {
    return '<header class="topbar topbar-sub"><button class="back-btn" data-act="back" aria-label="Back to ' + esc(backLabel) + '"><svg><use href="#sym-back"/></svg><span>' + esc(backLabel) + '</span></button>' +
      '<div class="topbar-title">' + esc(title) + '</div>' + (rightHTML || '<span></span>') + '</header>';
  }

  // ================================================================
  // Navigation: three tabs, and a stack of pushed screens on top
  // ================================================================

  var TABS = ['overview', 'terms', 'settings'];
  var TAB_TITLES = { overview: 'Overview', terms: 'Terms', settings: 'Settings' };
  var ui = { tab: 'overview', stack: [] };
  var appEl = $('app');

  function tabEl(name) { return $('screen-' + name); }
  function topScreen() { return ui.stack.length ? ui.stack[ui.stack.length - 1].el : tabEl(ui.tab); }

  function setVisible(el, anim) {
    Array.prototype.forEach.call(appEl.querySelectorAll('.screen'), function (s) {
      s.classList.remove('is-active', 'anim-push', 'anim-pop');
    });
    void el.offsetWidth;
    if (anim === 'anim-push' || anim === 'anim-pop') el.classList.add(anim);
    el.classList.add('is-active');
    appEl.classList.toggle('instant', anim === 'instant');
    var pushed = ui.stack.length > 0;
    $('tabbar').classList.toggle('is-hidden', pushed);
    appEl.classList.toggle('no-tabbar', pushed);
    $('toast').classList.toggle('no-tabbar', pushed);
    updateCompact();
  }

  function goTab(name) {
    if (ui.stack.length) return;
    ui.tab = name;
    renderTab(name);
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('is-active', t.dataset.tab === name); });
    moveTabLens();
    window.scrollTo(0, 0);
    setVisible(tabEl(name), '');
  }

  function backLabelFor(index) {
    if (index === 0) return TAB_TITLES[ui.tab];
    var prev = ui.stack[index - 1];
    if (prev.type === 'term') return termLabel(termById(prev.id)) || 'Back';
    if (prev.type === 'course') { var c = courseById(prev.id); return c ? c.name : 'Back'; }
    return 'Back';
  }

  function push(type, id) {
    var el = document.createElement('section');
    el.className = 'screen';
    el.dataset.type = type;
    appEl.appendChild(el);
    var entry = { type: type, id: id, el: el, scroll: window.scrollY };
    ui.stack.push(entry);
    renderEntry(entry, ui.stack.length - 1);
    history.pushState({ ace: ui.stack.length }, '');
    window.scrollTo(0, 0);
    setVisible(el, 'anim-push');
  }

  function removeTop(anim) {
    var entry = ui.stack.pop();
    if (!entry) return;
    entry.el.remove();
    var under = topScreen();
    if (ui.stack.length) renderEntry(ui.stack[ui.stack.length - 1], ui.stack.length - 1);
    else renderTab(ui.tab);
    setVisible(under, anim);
    window.scrollTo(0, entry.scroll || 0);
  }

  var ignorePops = 0;
  function pop(instant) {
    if (!ui.stack.length) return;
    if (history.state && history.state.ace) { ignorePops++; history.back(); }
    removeTop(instant ? 'instant' : 'anim-pop');
  }
  function popToRoot() {
    var n = ui.stack.length;
    if (!n) return;
    var depth = history.state && history.state.ace ? history.state.ace : 0;
    while (ui.stack.length) removeTop('instant');
    if (depth) { ignorePops++; history.go(-depth); }
  }

  window.addEventListener('popstate', function () {
    if (ignorePops > 0) { ignorePops--; return; }
    var depth = history.state && history.state.ace ? history.state.ace : 0;
    while (ui.stack.length > depth) removeTop('instant');
  });

  function renderEntry(entry, index) {
    if (entry.type === 'term') {
      var t = termById(entry.id);
      if (!t) return false;
      renderTerm(entry.el, t, backLabelFor(index));
    } else if (entry.type === 'course') {
      var c = courseById(entry.id);
      if (!c) return false;
      renderCourse(entry.el, c, backLabelFor(index));
    }
    return true;
  }

  function renderTab(name) {
    if (name === 'overview') renderOverview(tabEl('overview'));
    else if (name === 'terms') renderTerms(tabEl('terms'));
    else if (name === 'settings') renderSettings(tabEl('settings'));
  }

  function renderAll() {
    TABS.forEach(renderTab);
    // A screen whose term or course was deleted closes itself.
    for (var i = 0; i < ui.stack.length; i++) {
      if (!renderEntry(ui.stack[i], i)) {
        var drop = ui.stack.length - i;
        while (ui.stack.length > i) removeTop('instant');
        ignorePops++;
        history.go(-drop);
        break;
      }
    }
    updateCompact();
  }

  function updateCompact() {
    var y = window.scrollY;
    var bar = topScreen().querySelector('.topbar');
    if (!bar) return;
    bar.classList.toggle('is-compact', bar.classList.contains('topbar-sub') ? y > 56 : y > 8);
  }
  window.addEventListener('scroll', updateCompact, { passive: true });

  // ---------- tab bar: tap, or press and slide ----------

  function moveTabLens() {
    var active = document.querySelector('.tab.is-active');
    if (!active) return;
    var lens = $('tabLens');
    lens.style.width = active.offsetWidth + 'px';
    lens.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  var tabDraggedAt = 0;
  function wireTabBar() {
    var bar = $('tabbar');
    var lens = $('tabLens');
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('.tab'));
    var drag = null;
    function tabAt(x) {
      var hit = null;
      tabs.forEach(function (t) { var r = t.getBoundingClientRect(); if (x >= r.left && x <= r.right) hit = t; });
      if (hit) return hit;
      return x < tabs[0].getBoundingClientRect().left ? tabs[0] : tabs[tabs.length - 1];
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (Date.now() - tabDraggedAt < 400) return;
        goTab(tab.dataset.tab);
      });
    });
    bar.addEventListener('pointerdown', function (e) { if (e.button === 0) drag = { id: e.pointerId, x: e.clientX, moved: false }; });
    bar.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x) < 6) return;
        drag.moved = true;
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        bar.classList.add('is-dragging');
      }
      var left = bar.getBoundingClientRect().left;
      var w = lens.offsetWidth;
      var min = tabs[0].offsetLeft, max = tabs[tabs.length - 1].offsetLeft + tabs[tabs.length - 1].offsetWidth - w;
      lens.style.transform = 'translateX(' + Math.max(min, Math.min(max, e.clientX - left - w / 2)) + 'px)';
      var over = tabAt(e.clientX);
      tabs.forEach(function (t) { t.classList.toggle('is-hover', t === over); });
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      bar.classList.remove('is-dragging');
      tabs.forEach(function (t) { t.classList.remove('is-hover'); });
      if (!moved) return;
      tabDraggedAt = Date.now();
      var target = e.type === 'pointerup' ? tabAt(e.clientX) : null;
      if (target && target.dataset.tab !== ui.tab) goTab(target.dataset.tab);
      else moveTabLens();
    }
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    window.addEventListener('resize', moveTabLens);
  }

  // ---------- left-edge swipe back (the home-screen app has no browser swipe) ----------

  function wireEdgeSwipe() {
    if (!window.navigator.standalone) return;
    var screen = null, under = null;
    var tracking = false, locked = false, startX = 0, startY = 0, lastX = 0, lastT = 0, speed = 0, dx = 0;
    function paint(p) {
      screen.style.transform = 'translateX(' + (p * 100) + '%)';
      under.style.transform = 'translateX(' + (-30 + 30 * p) + '%)';
      under.style.setProperty('--shade', String(0.22 * (1 - p)));
    }
    function cleanup() {
      if (screen) { screen.classList.remove('is-dragging', 'is-settling', 'is-leaving'); screen.style.transform = ''; }
      if (under) { under.classList.remove('is-under', 'is-settling', 'is-leaving'); under.style.transform = ''; under.style.removeProperty('--shade'); }
      screen = under = null;
    }
    document.addEventListener('touchstart', function (e) {
      if (!ui.stack.length || screen || document.querySelector('.sheet-backdrop') || e.touches[0].clientX > 22) return;
      tracking = true; locked = false; dx = 0; speed = 0;
      startX = lastX = e.touches[0].clientX; startY = e.touches[0].clientY; lastT = e.timeStamp;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var x = e.touches[0].clientX, mx = x - startX, my = e.touches[0].clientY - startY;
      if (!locked) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        if (Math.abs(my) > Math.abs(mx)) { tracking = false; return; }
        locked = true;
        screen = topScreen();
        under = ui.stack.length > 1 ? ui.stack[ui.stack.length - 2].el : tabEl(ui.tab);
        appEl.classList.add('instant');
        under.classList.add('is-under');
        screen.classList.add('is-dragging');
      }
      e.preventDefault();
      if (e.timeStamp > lastT) speed = (x - lastX) / (e.timeStamp - lastT);
      lastX = x; lastT = e.timeStamp;
      dx = Math.max(0, mx);
      paint(Math.min(1, dx / screen.offsetWidth));
    }, { passive: false });
    function end() {
      if (!tracking) return;
      tracking = false;
      if (!locked || !screen) { cleanup(); return; }
      var w = screen.offsetWidth;
      var leave = dx > w * 0.4 || speed > 0.5;
      screen.classList.remove('is-dragging');
      screen.classList.add(leave ? 'is-leaving' : 'is-settling');
      under.classList.add(leave ? 'is-leaving' : 'is-settling');
      paint(leave ? 1 : 0);
      setTimeout(function () {
        var wasLeaving = leave;
        cleanup();
        if (wasLeaving) pop(true);
        else appEl.classList.remove('instant');
      }, 270);
    }
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
  }

  // ================================================================
  // Overview
  // ================================================================

  var TIER_STATUS = {
    secured: { label: 'Secured', kind: 'good' },
    track: { label: 'On track', kind: 'good chip-line' },
    reachable: { label: 'Reachable', kind: 'warn' },
    out: { label: 'Out of reach', kind: '' },
    none: { label: 'No courses yet', kind: '' }
  };

  function renderOverview(el) {
    var s = G.summarize(data);
    var addBtn = '<button class="icon-btn icon-btn-primary" data-act="quick-add" aria-label="Add a course"><svg><use href="#sym-plus"/></svg></button>';
    var h = '<header class="topbar"><div class="brand"><svg class="brand-mark" aria-hidden="true"><use href="#sym-mark"/></svg><h1>Ace It</h1></div>' + addBtn + '</header>';

    if (!data.terms.length) {
      h += '<div class="card">' + emptyHTML('terms', 'Add your first term', 'Start with the semester you’re in now, or the first one you finished. Then add its courses.', 'Add a term', 'add-term') + '</div>';
      el.innerHTML = h;
      return;
    }

    // Hero: the cumulative average
    h += '<section class="hero">';
    if (s.official != null) {
      h += '<div class="hero-label">Cumulative average</div><div class="hero-value">' + G.fmtAvg(s.official) + '</div>' +
        '<div class="hero-sub">Official · ' + plural(s.officialCount, 'finished course') + '</div>';
      if (s.remaining > 0) {
        h += '<div class="hero-split"><div><div class="hero-label">Projected</div><div class="hero-small">' + G.fmtAvg(s.projected) + '</div></div>' +
          '<div><div class="hero-label">Possible range</div><div class="hero-small">' + G.fmtAvg(s.worst) + '–' + G.fmtAvg(s.best) + '</div></div></div>';
      }
    } else if (s.projected != null) {
      h += '<div class="hero-label">Projected average</div><div class="hero-value">' + G.fmtAvg(s.projected) + '</div>' +
        '<div class="hero-sub">No finished courses yet · ' + plural(s.inProgress, 'course') + ' in progress</div>';
    } else {
      h += '<div class="hero-label">Cumulative average</div><div class="hero-empty">No grades yet</div>' +
        '<div class="hero-sub">Add courses to a term to see your average here.</div>';
    }
    h += '</section>';

    if (s.denominator > 0) {
      var parts = [];
      if (s.inProgress) parts.push(plural(s.inProgress, 'course') + ' in progress at expected finals');
      if (s.future) parts.push(plural(s.future, 'future course') + ' at ' + G.fmtNum(s.assumed) + ' (assumed)');
      if (parts.length) h += '<p class="hint">Projected: ' + esc(parts.join(', ')) + '.</p>';
    }

    // Tiers
    if (s.tiers.length) {
      h += '<section class="card card-flush"><div class="card-head"><h3>Goals</h3><button class="text-btn text-btn-sm" data-act="edit-tiers">Edit</button></div>';
      s.tiers.forEach(function (tier) {
        var st = TIER_STATUS[tier.status] || TIER_STATUS.out;
        var detail = '';
        if (tier.status === 'none') detail = 'Add courses to see where you stand.';
        else if (tier.remaining === 0) detail = tier.status === 'secured' ? 'Every course is finished.' : 'Every course is finished below this goal.';
        else {
          var R = tier.remaining;
          var left = plural(R, 'course') + ' left';
          if (tier.neededAverage <= 0) detail = 'Held whatever happens in the ' + left + '.';
          else if (tier.neededAverage > 10 + 1e-9) detail = 'Would need more than a 10 average on the ' + left + '.';
          else {
            detail = 'Needs a <b class="num">' + ceil2(tier.neededAverage) + '</b> average on the ' + left + '.';
            if (tier.ninesAffordable === R) detail += ' Every one could be a 9.';
            else if (tier.ninesAffordable === 0) detail += ' Every one needs a 10.';
            else if (tier.ninesAffordable != null) detail += ' Room for ' + (tier.ninesAffordable === 1 ? 'one 9' : tier.ninesAffordable + ' 9s') + ' if the rest are 10s.';
          }
        }
        h += '<div class="tier"><div class="tier-top"><span class="tier-name">' + esc(tier.name) + '<span class="num">' + G.fmtNum(tier.target) + '</span></span>' +
          '<span class="chip ' + (st.kind ? 'chip-' + st.kind : '') + '">' + st.label + '</span></div><div class="tier-detail">' + detail + '</div></div>';
      });
      var note = s.totalCourses
        ? 'Out of ' + s.totalCourses + ' courses: ' + s.officialCount + ' finished, ' + s.inProgress + ' in progress, ' + s.future + ' still to take.'
        : 'Based on the ' + plural(s.denominator, 'course') + ' you’ve added. Set your degree’s total courses in Settings to plan the whole degree.';
      h += '<p class="hint">' + esc(note) + '</p></section>';
    }

    // In progress
    var current = data.courses.filter(function (c) { return !isFinal(c); });
    h += '<div class="section-label">In progress</div>';
    if (current.length) {
      h += '<section class="card card-flush" style="margin-top:0">' + current.map(function (c) { return courseRowHTML(c, termLabel(termById(c.termId))); }).join('') + '</section>';
    } else {
      h += '<section class="card" style="margin-top:0">' + emptyHTML('book', 'Nothing in progress', 'Courses you’re taking now show up here with their expected final grades.', 'Add a course', 'quick-add') + '</section>';
    }

    // By term
    h += '<div class="section-label">By term</div><section class="card card-flush" style="margin-top:0">';
    sortedTerms().forEach(function (t) {
      var avg = G.termAverage(data, t.id);
      var count = coursesOf(t.id).length;
      h += '<button class="row" data-act="open-term" data-id="' + t.id + '"><span class="row-main"><span class="row-title">' + esc(termLabel(t)) + '</span>' +
        '<span class="row-sub">' + esc(count ? plural(count, 'course') : 'No courses yet') + (avg.average != null && !avg.official ? ' · projected' : '') + '</span></span>' +
        '<span class="row-end"><span class="score num">' + (avg.average != null ? G.fmtAvg(avg.average) : '–') + '</span>' + icon('chev', 'row-chev') + '</span></button>';
    });
    h += '</section><p class="hint">Term averages are for reference. Your cumulative counts every course equally.</p>';
    el.innerHTML = h;
  }

  // ================================================================
  // Terms
  // ================================================================

  function renderTerms(el) {
    var h = topbarHTML('Terms', '<button class="icon-btn icon-btn-primary" data-act="add-term" aria-label="Add a term"><svg><use href="#sym-plus"/></svg></button>');
    var terms = sortedTerms();
    if (!terms.length) {
      h += '<div class="card">' + emptyHTML('terms', 'No terms yet', 'Terms hold your courses: semesters 1 to 8, plus any summer terms.', 'Add a term', 'add-term') + '</div>';
      el.innerHTML = h;
      return;
    }
    h += '<section class="card card-flush">';
    terms.forEach(function (t) {
      var avg = G.termAverage(data, t.id);
      var cs = coursesOf(t.id);
      var inProg = cs.filter(function (c) { return !isFinal(c); }).length;
      var sub = [];
      if (t.dates) sub.push(esc(t.dates));
      sub.push(cs.length ? plural(cs.length, 'course') : 'No courses yet');
      if (t.planned && t.planned > cs.length) sub.push((t.planned - cs.length) + ' planned');
      var chips = (t.kind === 'summer' ? chip('Summer', 'accent') : '') + (inProg ? chip('In progress') : '');
      h += '<button class="row" data-act="open-term" data-id="' + t.id + '"><span class="row-main"><span class="row-title">' + esc(termLabel(t)) + '</span>' +
        '<span class="row-sub">' + sub.join(' · ') + chips + '</span></span>' +
        '<span class="row-end"><span class="score num">' + (avg.average != null ? G.fmtAvg(avg.average) : '–') + '</span>' + icon('chev', 'row-chev') + '</span></button>';
    });
    h += '</section><p class="hint">Averages are the mean of rounded final grades, shown for reference only.</p>';
    el.innerHTML = h;
  }

  function renderTerm(el, t, backLabel) {
    var cs = coursesOf(t.id);
    var avg = G.termAverage(data, t.id);
    var h = subbarHTML(backLabel, termLabel(t), '<button class="text-btn" data-act="edit-term" data-id="' + t.id + '">Edit</button>');
    h += '<div class="page-head"><h2>' + esc(termLabel(t)) + '</h2><p class="page-sub">' + esc([t.dates, t.kind === 'summer' ? 'Summer term' : ''].filter(Boolean).join(' · ') || ' ') + '</p></div>';
    if (avg.average != null) {
      h += '<div class="big-grade"><div class="big-label">' + (avg.official ? 'Term average' : 'Projected term average') + '</div>' +
        '<div class="pair pair-lg"><span class="raw">' + G.fmtAvg(avg.average) + '</span></div></div>';
    }
    if (cs.length) {
      h += '<section class="card card-flush">' + cs.map(function (c) { return courseRowHTML(c, c.professor); }).join('') +
        '<button class="add-row" data-act="add-course" data-term="' + t.id + '"><svg><use href="#sym-plus"/></svg>Add a course</button></section>';
    } else {
      h += '<section class="card">' + emptyHTML('book', 'No courses yet', 'Add each course in this term. You can enter what you know now and fill in grades as they come.', 'Add a course', 'add-course') + '</section>';
    }
    if (t.planned && t.planned > cs.length) {
      h += '<p class="hint">' + plural(t.planned - cs.length, 'more planned course') + ', assumed at ' + G.fmtNum(assumed()) + ' until you add ' + (t.planned - cs.length === 1 ? 'it' : 'them') + '.</p>';
    }
    el.innerHTML = h;
    el.querySelectorAll('[data-act="add-course"]').forEach(function (b) { b.dataset.term = t.id; });
  }

  // ================================================================
  // Course
  // ================================================================

  function renderCourse(el, c, backLabel) {
    var t = thr(c);
    var r = result(c);
    var passing = data.settings.passingGrade;
    var h = subbarHTML(backLabel, c.name, '<button class="text-btn" data-act="edit-course" data-id="' + c.id + '">Edit</button>');
    var term = termById(c.termId);
    h += '<div class="page-head"><h2>' + esc(c.name) + '</h2><p class="page-sub">' + esc([c.professor, termLabel(term)].filter(Boolean).join(' · ')) + '</p></div>';

    var label = isFinal(c) ? 'Final grade' : (r.estimate ? 'Estimate' : 'Expected final');
    h += '<div class="big-grade"><div class="big-label">' + label + '</div>' +
      (isNum(r.raw) ? pairHTML(r.raw, t, 'pair-lg' + (r.estimate ? ' is-est' : '')) : '<div class="hero-empty" style="color:var(--ink-soft)">No grades yet</div>') + '</div>';
    h += '<div class="chips">' + chip(ruleText(t) + (c.rounding.unconfirmed ? ' · unconfirmed' : ''), c.rounding.unconfirmed ? 'warn' : 'line') +
      (c.mode === 'weighted' && c.weightsUnconfirmed ? chip('Weights unconfirmed', 'warn') : '') +
      (r.estimate ? chip('Estimate', 'warn') : '') + (isFinal(c) ? chip('Final', 'good') : '') + (!c.counts ? chip('Not counted in average') : '') + '</div>';

    if (G.atRisk(c, r, passing)) {
      h += '<div class="alert alert-risk">' + icon('alert') + '<div><b>At risk.</b> ' + (isNum(r.expectedFinal) && r.expectedFinal < passing ? 'The expected final is below' : 'Your grade so far is below') + ' the passing grade of ' + G.fmtNum(passing) + '.</div></div>';
    }
    r.warnings.forEach(function (w) {
      if (w.type === 'weight-sum') h += '<div class="alert">' + icon('alert') + '<div>Category weights add up to <b>' + fmtW(w.total) + '</b>, not 100%. Grades are scaled to what’s there.</div></div>';
      if (w.type === 'custom-weights') h += '<div class="alert">' + icon('alert') + '<div>Item weights in <b>' + esc(w.category) + '</b> don’t match the category’s weight, so they were scaled to fit.</div></div>';
    });
    if (c.done && !isNum(c.posted) && r.pendingWeight > 0) {
      h += '<div class="alert">' + icon('alert') + '<div>This course is marked finished, but ' + fmtW(r.pendingWeight) + ' is still pending and counts as 0.</div></div>';
    }

    if (c.mode === 'single') h += singleCardHTML(c, r, t);
    else h += weightedHTML(c, r, t);

    // Adjustments on the whole course
    if (c.adjustments.length) {
      h += '<section class="card card-flush"><div class="card-head"><h3>Course adjustments</h3><button class="text-btn text-btn-sm" data-act="edit-adjustments" data-id="' + c.id + '">Edit</button></div>' +
        c.adjustments.map(function (a) {
          return '<div class="row"><span class="row-main"><span class="row-title">' + esc(a.label || 'Adjustment') + '</span></span><span class="row-end"><span class="score num">' + (a.points > 0 ? '+' : '') + G.fmtNum(a.points) + '</span>' + chip(a.confirmed ? 'Applied' : 'Pending', a.confirmed ? 'good' : 'warn') + '</span></div>';
        }).join('') + '</section>';
    }

    // Course options
    h += '<div class="section-label">Course</div><section class="card card-flush" style="margin-top:0">' +
      '<div class="toggle-row"><span class="row-main">Rounding rule</span><span style="width:150px">' + segHTML('course-rule', [{ val: 5, label: '.5' }, { val: 6, label: '.6' }], t) + '</span></div>' +
      '<div class="toggle-row"><span class="row-main">Rule unconfirmed</span>' + switchHTML('course-rule-unconfirmed', c.rounding.unconfirmed) + '</div>' +
      '<div class="toggle-row"><span class="row-main">Counts toward average</span>' + switchHTML('course-counts', c.counts) + '</div>' +
      '<div class="toggle-row"><span class="row-main">Finished</span>' + switchHTML('course-done', c.done) + '</div>' +
      '<button class="settings-row" data-act="edit-posted"><span class="row-main"><b>Official final grade</b><small>' + (isNum(c.posted) ? 'Posted: ' + G.fmtNum(c.posted, 4) + ' (overrides the calculation)' : 'Optional. Enter it once the school posts it.') + '</small></span>' + icon('chev', 'row-chev') + '</button>' +
      (c.adjustments.length ? '' : '<button class="settings-row" data-act="edit-adjustments"><span class="row-main"><b>Add a course adjustment</b><small>Points added to or taken off the whole course</small></span>' + icon('chev', 'row-chev') + '</button>') +
      '</section>';
    h += '<div class="danger-zone"><button class="text-btn text-btn-danger" data-act="delete-course">Delete course</button></div>';
    el.innerHTML = h;
    el.dataset.id = c.id;
  }

  function projBox(label, raw, t, note, act, cls) {
    var tag = act ? 'button' : 'div';
    return '<' + tag + ' class="proj ' + (cls || '') + '"' + (act ? ' data-act="' + act + '"' : '') + '><div class="proj-label">' + esc(label) + '</div>' +
      '<div class="proj-val">' + pairHTML(raw, t) + '</div>' + (note ? '<div class="proj-note">' + note + '</div>' : '') + '</' + tag + '>';
  }

  function singleCardHTML(c, r, t) {
    var s = c.single || {};
    var h = '<section class="card"><div class="card-head"><h3>' + (isNum(c.posted) ? 'Official grade' : 'Single grade') + '</h3><button class="text-btn text-btn-sm" data-act="edit-course" data-id="' + c.id + '">Edit</button></div><div class="proj-grid">';
    if (isNum(c.posted)) {
      h += projBox('Final', r.raw, t, 'Posted by the school') + '</div>';
    } else {
      h += projBox('Expected', r.expected, t, r.expectedPendingSource === 'assumed' ? 'Assumed (no estimate set)' : 'Your estimate');
      var range = isNum(s.low) || isNum(s.high)
        ? pairHTML(r.worst, t, 'is-muted') + '<span class="proj-note" style="display:inline"> to </span>' + pairHTML(r.best, t, 'is-muted')
        : '<span class="row-value">Not set</span>';
      h += '<div class="proj"><div class="proj-label">Range</div><div class="proj-val" style="font-size:1rem">' + range + '</div></div></div>';
      h += '<p class="hint">This professor grades at the end, so it counts in your cumulative as an estimate until you enter the official grade.</p>';
    }
    return h + '</section>';
  }

  function weightedHTML(c, r, t) {
    var h = '';
    if (!c.categories.length) {
      return '<section class="card">' + emptyHTML('target', 'Set up how this course is graded', 'Add categories and their weights, like “Exams 60 / Homework 40”. Items go under each one.', 'Add categories', 'edit-categories') + '</section>';
    }
    // Projections
    var srcNote = r.expectedPendingSource === 'set' ? 'Pending at ' + G.fmtNum(r.expectedPending) + ' (your number)'
      : r.expectedPendingSource === 'average' ? 'Pending at your average (' + G.fmtRaw(r.expectedPending, t) + ')'
        : r.expectedPendingSource === 'assumed' ? 'Pending at ' + G.fmtNum(r.expectedPending) + ' (assumed)' : '';
    h += '<section class="card"><div class="card-head"><h3>Projections</h3><span class="card-note">' + fmtW(r.gradedWeight) + ' graded</span></div><div class="proj-grid">';
    h += projBox('So far', r.soFar, t, r.gradedWeight > 0 ? 'Over the ' + fmtW(r.gradedWeight) + ' graded' : 'No grades yet');
    if (!isFinal(c)) {
      h += projBox('Expected', r.expected, t, esc(srcNote) + ' · change', 'edit-expected');
      h += projBox('Best case', r.best, t, 'Pending at 10');
      h += projBox('Worst case', r.worst, t, 'Pending at 0');
    } else {
      h += projBox('Final', r.raw, t, isNum(c.posted) ? 'Posted by the school' : 'From your items');
    }
    if (isNum(r.withOwed)) h += projBox('If owed points come through', r.withOwed, t, 'Expected case with every pending bonus applied', '', 'proj-wide');
    h += '</div></section>';

    // Unconfirmed weights: best guess vs. alternative
    if (c.weightsUnconfirmed) {
      if (G.hasAltWeights(c)) {
        var alt = result(c, c.altWeights);
        var split = function (useAlt) {
          return c.categories.map(function (g) { return esc(g.name) + ' ' + G.fmtNum(useAlt && isNum(c.altWeights[g.id]) ? c.altWeights[g.id] : g.weight); }).join(' · ');
        };
        h += '<section class="card"><div class="card-head"><h3>Weights unconfirmed</h3><button class="text-btn text-btn-sm" data-act="edit-categories">Edit</button></div>' +
          '<div class="compare"><span></span><span class="h">Best guess</span><span class="h">Alternative</span>' +
          '<span class="l">Split</span><span class="l">' + split(false) + '</span><span class="l">' + split(true) + '</span>';
        var rows = isFinal(c) ? [['Final', 'raw']] : [['Expected', 'expected'], ['Best', 'best'], ['Worst', 'worst']];
        rows.forEach(function (row) {
          h += '<span class="l">' + row[0] + '</span><span>' + pairHTML(r[row[1]], t) + '</span><span>' + pairHTML(alt[row[1]], t) + '</span>';
        });
        h += '</div>';
        var a = isFinal(c) ? r.final : r.expectedFinal, b = isFinal(c) ? alt.final : alt.expectedFinal;
        if (isNum(a) && isNum(b)) {
          h += a === b ? '<p class="verdict is-same">The rounded final is ' + a + ' either way.</p>'
            : '<p class="verdict is-change">The rounded final changes: ' + a + ' with the best guess, ' + b + ' with the alternative.</p>';
        }
        h += '</section>';
      } else {
        h += '<div class="alert">' + icon('alert') + '<div>Weights are marked unconfirmed. <button class="text-btn text-btn-sm" data-act="edit-categories" style="padding:0;color:inherit;text-decoration:underline">Add an alternative split</button> to compare.</div></div>';
      }
    }

    // Needed grades
    if (!isFinal(c) && r.pendingWeight > 0) {
      var passingFinal = Math.max(1, Math.ceil(data.settings.passingGrade - 1e-9));
      var hi = Math.min(10, (isNum(r.bestFinal) ? r.bestFinal : 10) + 1);
      var lo = Math.max(passingFinal, isNum(r.worstFinal) ? r.worstFinal : 0);
      var targets = [];
      for (var F = hi; F >= lo && targets.length < 5; F--) targets.push(F);
      var pendNames = r.pendingSlots.map(function (sl) { return (sl.item ? sl.item.name : sl.cat.name) + ' (' + fmtW(sl.w) + ')'; });
      var onePending = r.pendingSlots.length === 1;
      var onWhat = onePending ? 'on ' + (r.pendingSlots[0].item ? r.pendingSlots[0].item.name : r.pendingSlots[0].cat.name) : 'average on what’s left';
      h += '<section class="card"><div class="card-head"><h3>What you need</h3><span class="card-note">' + fmtW(r.pendingWeight) + ' left</span></div>';
      targets.forEach(function (F) {
        var need = G.neededForFinal(c, F, { assumed: assumed() });
        var val;
        if (need.status === 'secured') val = chip('Already secured', 'good');
        else if (need.status === 'impossible') val = chip('Not possible' + (isNum(need.average) ? ' (needs ' + ceil2(need.average) + ')' : ''));
        else val = '<b>' + ceil2(need.average) + '</b><small>' + esc(onWhat) + '</small>';
        h += '<div class="need-row"><span class="need-target">To get ' + (F === 8 ? 'an ' : 'a ') + F + '<small>Raw ' + G.minRawFor(F, t).toFixed(2) + ' or more</small></span><span class="need-val">' + val + '</span></div>';
      });
      h += '<p class="hint">' + (onePending ? 'Left to grade: ' : 'Left to grade (the same average on each): ') + esc(pendNames.join(', ')) + '.' +
        (G.hasPendingAdjustments(c.adjustments) || r.withOwed != null ? ' Owed points aren’t counted until you switch them on.' : '') + '</p></section>';
    }

    // Categories and items
    r.categoryStats.forEach(function (cs) {
      var g = cs.category;
      var altW = c.weightsUnconfirmed && c.altWeights && isNum(c.altWeights[g.id]) ? ' · alt ' + G.fmtNum(c.altWeights[g.id]) + '%' : '';
      h += '<section class="card card-flush"><button class="cat-head" data-act="edit-categories"><span><h3 style="display:inline">' + esc(g.name) + '</h3><span class="cat-weight">' + G.fmtNum(g.weight) + '%' + altW + '</span></span>' +
        '<span class="cat-avg">' + (cs.average != null ? 'Avg ' + G.fmtRaw(cs.average, 5) : (g.items.length ? 'Nothing graded' : '')) + '</span></button>';
      if (!g.items.length) {
        h += '<div class="row is-pending"><span class="row-main"><span class="row-sub">No items yet. The whole ' + G.fmtNum(g.weight) + '% counts as pending.</span></span></div>';
      }
      cs.items.forEach(function (entry) {
        var it = entry.item;
        if (!it) return;
        var sub = [];
        if (it.date) sub.push(esc(formatDate(it.date)));
        sub.push(fmtW(entry.w) + (isNum(it.weight) ? ' (custom)' : ''));
        var adjChips = it.adjustments.map(function (a) { return chip((a.points > 0 ? '+' : '') + G.fmtNum(a.points) + (a.confirmed ? '' : ' owed'), a.confirmed ? 'good' : 'warn'); }).join('');
        var right;
        if (it.status === 'graded' && isNum(entry.score)) {
          right = (isNum(it.points) && isNum(it.max) ? '<span class="row-value">' + G.fmtNum(it.points) + '/' + G.fmtNum(it.max) + '</span>' : '') +
            '<span class="score">' + entry.score.toFixed(2) + '</span>';
        } else right = chip('Pending');
        h += '<button class="row' + (it.status === 'graded' ? '' : ' is-pending') + '" data-act="edit-item" data-id="' + it.id + '"><span class="row-main"><span class="row-title">' + esc(it.name) + '</span>' +
          '<span class="row-sub">' + sub.join(' · ') + adjChips + '</span></span><span class="row-end">' + right + '</span></button>';
      });
      h += '<button class="add-row" data-act="add-item" data-cat="' + g.id + '"><svg><use href="#sym-plus"/></svg>Add to ' + esc(g.name) + '</button></section>';
    });
    h += '<div class="btn-row"><button class="btn" data-act="edit-categories">Edit categories and weights</button></div>';
    return h;
  }

  function formatDate(key) {
    var p = key.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ================================================================
  // Settings
  // ================================================================

  var THEME_HINTS = { auto: 'Automatic · follows your iPhone.', light: 'Light · this app stays light.', dark: 'Dark · this app stays dark.' };

  function renderSettings(el) {
    var st = data.settings;
    var pref = themePref();
    var h = topbarHTML('Settings');
    h += '<section class="card"><div class="card-head"><h3>Appearance</h3></div>' +
      segHTML('theme', [
        { val: 'auto', label: '<svg aria-hidden="true"><use href="#sym-theme-auto"/></svg>', aria: 'Automatic' },
        { val: 'light', label: '<svg aria-hidden="true"><use href="#sym-sun"/></svg>', aria: 'Light' },
        { val: 'dark', label: '<svg aria-hidden="true"><use href="#sym-moon"/></svg>', aria: 'Dark' }
      ], pref) + '<p class="hint" id="themeHint">' + THEME_HINTS[pref] + '</p></section>';

    h += '<section class="card card-flush"><div class="card-head"><h3>Degree</h3></div>' +
      settingsRow('set-total', 'Total courses in degree', st.totalCourses ? st.totalCourses + ' courses' : 'Not set · optional, for whole-degree predictions') +
      settingsRow('set-passing', 'Passing grade', G.fmtNum(st.passingGrade) + ' · courses below it are flagged at risk') +
      settingsRow('set-assumed', 'Future courses assumed at', isNum(st.futureAssumed) ? G.fmtNum(st.futureAssumed) : G.fmtNum(assumed()) + ' (your Goal)') +
      '<div class="toggle-row"><span class="row-main">Default rounding<small style="display:block;color:var(--ink-soft);font-size:.8rem">For new courses</small></span><span style="width:150px">' +
      segHTML('default-rule', [{ val: 5, label: '.5' }, { val: 6, label: '.6' }], st.defaultThreshold) + '</span></div></section>';

    h += '<section class="card card-flush"><div class="card-head"><h3>Goals</h3><button class="text-btn text-btn-sm" data-act="edit-tiers">Edit</button></div>' +
      (st.tiers.length ? st.tiers.map(function (t) { return '<div class="row"><span class="row-main"><span class="row-title">' + esc(t.name) + '</span></span><span class="row-end"><span class="score num">' + G.fmtNum(t.target) + '</span></span></div>'; }).join('')
        : '<p class="hint">No goals set. Tap Edit to add one.</p>') + '</section>';

    h += '<section class="card card-flush"><div class="card-head"><h3>Your data</h3></div>' +
      settingsRow('open-backup', 'Backup and restore', backupAgeLabel(), 'share') +
      '<div class="settings-row" style="cursor:default"><span class="row-main"><b>Storage</b><small id="persistStatus">Checking…</small></span></div>' +
      '</section>';
    h += '<div class="danger-zone"><button class="text-btn text-btn-danger" data-act="erase-all">Erase all data</button></div>';
    h += '<div class="about"><svg class="brand-mark" aria-hidden="true"><use href="#sym-mark"/></svg><p><b>Ace It</b> keeps your grades on this iPhone only. No account, no cloud.</p>' +
      '<p class="about-version">Version ' + APP_VERSION + ' · data format ' + S.SCHEMA_VERSION + '</p></div>';
    el.innerHTML = h;
    S.persistenceStatus().then(function (p) {
      var node = $('persistStatus');
      if (!node) return;
      node.textContent = p === true ? 'Protected: the browser won’t clear it to save space.' : p === false ? 'Not protected yet. Add Ace It to your Home Screen to keep it safe.' : 'Saved on this device.';
    });
  }

  function settingsRow(act, title, sub, ico) {
    return '<button class="settings-row" data-act="' + act + '">' + (ico ? '<span class="settings-ico">' + icon(ico) + '</span>' : '') +
      '<span class="row-main"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span>' + icon('chev', 'row-chev') + '</button>';
  }

  // ================================================================
  // Sheets
  // ================================================================

  function openSheet(html, setup) {
    var bd = document.createElement('div');
    bd.className = 'sheet-backdrop';
    bd.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>' + html + '</div>';
    bd._acts = {}; bd._segs = {}; bd._sws = {};
    document.body.appendChild(bd);
    bd.addEventListener('click', function (e) { if (e.target === bd) closeSheet(bd); });
    void bd.offsetWidth;
    bd.classList.add('is-open');
    if (setup) setup(bd);
    return bd;
  }
  function closeSheet(bd) {
    if (!bd || bd._closing) return;
    bd._closing = true;
    bd.classList.remove('is-open');
    setTimeout(function () { bd.remove(); }, 380);
  }
  function q(bd, sel) { return bd.querySelector(sel); }
  function val(bd, sel) { var n = q(bd, sel); return n ? n.value : ''; }
  function setErr(bd, msg) { var n = q(bd, '.field-error[data-main]'); if (n) n.textContent = msg || ''; }

  function confirmSheet(title, text, okLabel, onOk, danger) {
    openSheet('<h2>' + esc(title) + '</h2><p class="sheet-text">' + esc(text) + '</p><div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn ' + (danger === false ? 'btn-primary' : 'btn-danger') + '" data-act="ok">' + esc(okLabel) + '</button></div>', function (bd) {
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.ok = function () { closeSheet(bd); onOk(); };
    });
  }

  // A single number, e.g. passing grade or total courses.
  function numberSheet(o) {
    openSheet('<h2>' + esc(o.title) + '</h2>' + (o.text ? '<p class="sheet-text">' + esc(o.text) + '</p>' : '') +
      '<div class="field"><input type="text" inputmode="decimal" id="numIn" value="' + (isNum(o.value) ? esc(G.fmtNum(o.value, 4)) : '') + '" placeholder="' + esc(o.placeholder || '') + '"></div>' +
      '<div class="field-error" data-main></div><div class="sheet-actions">' + (o.allowEmpty && isNum(o.value) ? '<button class="btn" data-act="clear">' + esc(o.clearLabel || 'Clear') + '</button>' : '<button class="btn" data-act="cancel">Cancel</button>') +
      '<button class="btn btn-primary" data-act="save">Save</button></div>', function (bd) {
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.clear = function () { closeSheet(bd); o.onSave(null); };
      bd._acts.save = function () {
        var v = num(val(bd, '#numIn'));
        if (v === null) {
          if (o.allowEmpty) { closeSheet(bd); o.onSave(null); return; }
          setErr(bd, 'Enter a number.'); return;
        }
        if (isNaN(v) || v < o.min || v > o.max) { setErr(bd, 'Enter a number from ' + o.min + ' to ' + o.max + '.'); return; }
        if (o.integer && Math.round(v) !== v) { setErr(bd, 'Enter a whole number.'); return; }
        closeSheet(bd);
        o.onSave(v);
      };
    });
  }

  // ---------- term ----------

  function termSheet(term) {
    var isNew = !term;
    var t = term || { kind: 'semester', number: nextSemesterNumber(), year: new Date().getFullYear(), label: '', dates: '', planned: null };
    var html = '<h2>' + (isNew ? 'New term' : 'Edit term') + '</h2>' +
      '<div class="field">' + segHTML('term-kind', [{ val: 'semester', label: 'Semester' }, { val: 'summer', label: 'Summer' }], t.kind) + '</div>' +
      '<div class="field-pair"><div class="field" id="numField"><label for="tNum">Semester</label><select id="tNum">' +
      [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<option value="' + n + '"' + (t.number === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="tYear">Year <span class="opt">optional</span></label><input type="text" inputmode="numeric" id="tYear" value="' + (t.year || '') + '"></div></div>' +
      '<div class="field"><label for="tDates">Dates <span class="opt">optional</span></label><input type="text" id="tDates" maxlength="40" placeholder="Aug–Dec 2026" value="' + esc(t.dates) + '"></div>' +
      '<div class="field"><label for="tLabel">Name <span class="opt">optional</span></label><input type="text" id="tLabel" maxlength="40" placeholder="' + esc(termLabel({ kind: t.kind, number: t.number, year: t.year })) + '" value="' + esc(t.label) + '"></div>' +
      '<div class="field"><label for="tPlanned">Planned courses <span class="opt">optional</span></label><input type="text" inputmode="numeric" id="tPlanned" placeholder="For a future term" value="' + (t.planned || '') + '">' +
      '<p class="field-hint">For terms you haven’t started: how many courses you expect. They count at ' + G.fmtNum(assumed()) + ' in projections until you add them.</p></div>' +
      '<div class="field-error" data-main></div>' +
      (isNew ? '' : '<div class="btn-row" style="margin-top:0"><button class="btn btn-sm" data-act="earlier">Move earlier</button><button class="btn btn-sm" data-act="later">Move later</button></div>') +
      '<div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">' + (isNew ? 'Add term' : 'Save') + '</button></div>' +
      (isNew ? '' : '<div class="danger-zone"><button class="text-btn text-btn-danger" data-act="delete">Delete term</button></div>');
    openSheet(html, function (bd) {
      var kind = t.kind;
      function syncKind() { q(bd, '#numField').classList.toggle('hidden', kind === 'summer'); refreshPlaceholder(); }
      function refreshPlaceholder() {
        q(bd, '#tLabel').placeholder = termLabel({ kind: kind, number: +val(bd, '#tNum'), year: num(val(bd, '#tYear')) || null });
      }
      bd._segs['term-kind'] = function (v) { kind = v; syncKind(); };
      q(bd, '#tNum').addEventListener('change', refreshPlaceholder);
      q(bd, '#tYear').addEventListener('input', refreshPlaceholder);
      syncKind();
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.earlier = function () { moveTerm(term, -1); };
      bd._acts.later = function () { moveTerm(term, 1); };
      bd._acts['delete'] = function () {
        var n = coursesOf(term.id).length;
        confirmSheet('Delete ' + termLabel(term) + '?', n ? 'Its ' + plural(n, 'course') + ' and all their grades go too. There’s no undo.' : 'There’s no undo.', 'Delete', function () {
          data.courses = data.courses.filter(function (c) { return c.termId !== term.id; });
          data.terms = data.terms.filter(function (x) { return x.id !== term.id; });
          closeSheet(bd);
          commit();
        });
      };
      bd._acts.save = function () {
        var year = num(val(bd, '#tYear'));
        var planned = num(val(bd, '#tPlanned'));
        if (year !== null && (isNaN(year) || year < 1990 || year > 2100)) { setErr(bd, 'Enter a year like 2026, or leave it empty.'); return; }
        if (planned !== null && (isNaN(planned) || planned < 0 || planned > 20 || Math.round(planned) !== planned)) { setErr(bd, 'Planned courses should be a whole number from 0 to 20.'); return; }
        var target = term || { id: S.uid('t'), order: nextOrder() };
        target.kind = kind;
        target.number = kind === 'semester' ? +val(bd, '#tNum') : null;
        target.year = year;
        target.dates = val(bd, '#tDates').trim();
        target.label = val(bd, '#tLabel').trim();
        target.planned = planned || null;
        if (isNew) data.terms.push(target);
        closeSheet(bd);
        commit();
        if (isNew) push('term', target.id);
      };
    });
  }
  function nextOrder() { return data.terms.reduce(function (m, t) { return Math.max(m, t.order + 1); }, 0); }
  function nextSemesterNumber() {
    var max = 0;
    data.terms.forEach(function (t) { if (t.kind === 'semester' && t.number > max) max = t.number; });
    return Math.min(8, max + 1);
  }
  function moveTerm(term, dir) {
    var list = sortedTerms();
    var i = list.indexOf(term), j = i + dir;
    if (j < 0 || j >= list.length) { showToast(dir < 0 ? 'Already the first term.' : 'Already the last term.'); return; }
    var o = list[i].order; list[i].order = list[j].order; list[j].order = o;
    if (list[i].order === list[j].order) list[i].order += dir;
    commit();
    showToast('Moved ' + (dir < 0 ? 'earlier' : 'later') + '.');
  }

  // ---------- course ----------

  function courseSheet(course, termId, opts) {
    opts = opts || {};
    var isNew = !course;
    var terms = sortedTerms();
    var c = course || { name: '', professor: '', termId: termId || (terms.length ? terms[terms.length - 1].id : null), mode: 'weighted', counts: true, done: false, posted: null,
      rounding: { threshold: data.settings.defaultThreshold, unconfirmed: false }, single: { expected: null, low: null, high: null }, weightsUnconfirmed: false };
    var mode = c.mode, threshold = c.rounding.threshold;
    var s = c.single || {};
    // Logging a past term: if every course already in it is finished, assume this one is too.
    var termCourses = isNew && c.termId ? coursesOf(c.termId) : [];
    var finished = isNew && (opts.finished != null ? opts.finished : termCourses.length > 0 && termCourses.every(isFinal));
    var html = '<h2>' + (isNew ? 'New course' : 'Edit course') + '</h2>' +
      '<div class="field"><label for="cName">Course name</label><input type="text" id="cName" maxlength="60" autocomplete="off" placeholder="Statistics" value="' + esc(c.name) + '"></div>' +
      '<div class="field"><label for="cProf">Professor <span class="opt">optional</span></label><input type="text" id="cProf" maxlength="60" autocomplete="off" value="' + esc(c.professor) + '"></div>' +
      (terms.length > 1 || !isNew ? '<div class="field"><label for="cTerm">Term</label><select id="cTerm">' + terms.map(function (t) { return '<option value="' + t.id + '"' + (t.id === c.termId ? ' selected' : '') + '>' + esc(termLabel(t)) + '</option>'; }).join('') + '</select></div>' : '') +
      (isNew ? '<div class="field-inline"><span>Already finished<small style="display:block;color:var(--ink-soft);font-size:.8rem">You have the final grade</small></span>' + switchHTML('c-finished', finished) + '</div>' +
        '<div class="field" id="finishedFields"><label for="cFinal">Final grade</label><input type="text" inputmode="decimal" id="cFinal" autocomplete="off" placeholder="10, or 9.47 if it has decimals">' +
        '<p class="field-hint" id="finalHint">As the school posted it. Counts toward your official average.</p></div>' : '') +
      '<div class="field"><span class="field-label">Rounding rule</span>' + segHTML('c-rule', [{ val: 5, label: 'From .5' }, { val: 6, label: 'From .6' }], threshold) +
      '<p class="field-hint" id="ruleHint"></p></div>' +
      '<div class="field-inline"><span>Rule unconfirmed</span>' + switchHTML('c-rule-unc', c.rounding.unconfirmed) + '</div>' +
      '<div id="planFields"><div class="field"><span class="field-label">How it’s graded</span>' + segHTML('c-mode', [{ val: 'weighted', label: 'Weighted' }, { val: 'single', label: 'Single grade' }], mode) + '</div>' +
      '<div id="weightedFields">' + (isNew ?
        '<div class="field"><label for="cCats">Categories and weights</label><input type="text" id="cCats" autocomplete="off" placeholder="Exams 60 / Homework 40">' +
        '<p class="field-hint">Separate with a slash. You can add items now or later.</p></div>' +
        '<div class="field-inline"><span>Weights unconfirmed</span>' + switchHTML('c-w-unc', false) + '</div>'
        : '<p class="field-hint" style="margin:-0.4rem 0 1rem">Edit categories from the course screen.</p>') + '</div>' +
      '<div id="singleFields"><p class="field-hint" style="margin:-0.4rem 0 0.8rem">No grades until the end. Enter what you expect; it counts as an estimate.</p>' +
      '<div class="field-trio"><div class="field"><label for="sExp">Expected</label><input type="text" inputmode="decimal" id="sExp" value="' + (isNum(s.expected) ? s.expected : '') + '" placeholder="9"></div>' +
      '<div class="field"><label for="sLow">Low <span class="opt">opt.</span></label><input type="text" inputmode="decimal" id="sLow" value="' + (isNum(s.low) ? s.low : '') + '"></div>' +
      '<div class="field"><label for="sHigh">High <span class="opt">opt.</span></label><input type="text" inputmode="decimal" id="sHigh" value="' + (isNum(s.high) ? s.high : '') + '"></div></div></div></div>' +
      '<div class="field-inline"><span>Counts toward average</span>' + switchHTML('c-counts', c.counts) + '</div>' +
      '<div class="field-error" data-main></div>' +
      '<div class="sheet-actions"><button class="btn" data-act="cancel" id="cCancel">Cancel</button>' + (isNew ? '<button class="btn" data-act="save-another" id="cAnother">Add another</button>' : '') +
      '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add course' : 'Save') + '</button></div>';
    openSheet(html, function (bd) {
      function finalHint() {
        var node = q(bd, '#finalHint');
        if (!node) return;
        var v = num(val(bd, '#cFinal'));
        node.textContent = v !== null && !isNaN(v) && v >= 0 && v <= 10 && Math.round(v) !== v
          ? G.fmtRaw(v, threshold) + ' rounds to ' + G.roundFinal(v, threshold) + ' in your official average.'
          : 'As the school posted it. Counts toward your official average.';
      }
      function sync() {
        q(bd, '#planFields').classList.toggle('hidden', finished);
        q(bd, '#weightedFields').classList.toggle('hidden', mode !== 'weighted');
        q(bd, '#singleFields').classList.toggle('hidden', mode !== 'single');
        if (q(bd, '#finishedFields')) q(bd, '#finishedFields').classList.toggle('hidden', !finished);
        if (q(bd, '#cAnother')) { q(bd, '#cAnother').classList.toggle('hidden', !finished); q(bd, '#cCancel').classList.toggle('hidden', finished); }
        q(bd, '#ruleHint').textContent = threshold === 6 ? '8.6 becomes 9, and 8.5 stays 8.' : '8.5 becomes 9, and 9.49 stays 9.';
        finalHint();
      }
      bd._segs['c-rule'] = function (v) { threshold = +v; sync(); };
      bd._segs['c-mode'] = function (v) { mode = v; sync(); };
      bd._sws['c-finished'] = function (on) { finished = on; sync(); if (on) q(bd, '#cFinal').focus(); };
      if (q(bd, '#cFinal')) q(bd, '#cFinal').addEventListener('input', finalHint);
      sync();
      if (isNew) setTimeout(function () { q(bd, '#cName').focus(); }, 350);
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts['save-another'] = function () { save(true); };
      bd._acts.save = function () { save(false); };
      function save(another) {
        var name = val(bd, '#cName').trim();
        if (!name) { setErr(bd, 'Give the course a name.'); return; }
        var termPick = q(bd, '#cTerm') ? val(bd, '#cTerm') : c.termId;
        if (!termPick) { setErr(bd, 'Add a term first.'); return; }
        if (finished) {
          var fin = num(val(bd, '#cFinal'));
          if (fin === null || isNaN(fin) || fin < 0 || fin > 10) { setErr(bd, 'Enter the final grade, from 0 to 10.'); return; }
          var done = {
            id: S.uid('c'), termId: termPick, name: name, professor: val(bd, '#cProf').trim(),
            rounding: { threshold: threshold, unconfirmed: q(bd, '[data-sw="c-rule-unc"]').checked },
            mode: 'single', counts: q(bd, '[data-sw="c-counts"]').checked, done: true, posted: fin,
            categories: [], weightsUnconfirmed: false, altWeights: null, expectedPending: null,
            single: { expected: null, low: null, high: null }, adjustments: [], createdAt: Date.now()
          };
          data.courses.push(done);
          closeSheet(bd);
          commit();
          showToast('Added ' + name + ' · ' + (Math.round(fin) === fin ? fin : G.fmtRaw(fin, threshold) + ' → ' + G.roundFinal(fin, threshold)));
          if (another) setTimeout(function () { courseSheet(null, termPick, { finished: true }); }, 250);
          return;
        }
        var exp = num(val(bd, '#sExp')), low = num(val(bd, '#sLow')), high = num(val(bd, '#sHigh'));
        var bad = [exp, low, high].some(function (v) { return v !== null && (isNaN(v) || v < 0 || v > 10); });
        if (mode === 'single' && bad) { setErr(bd, 'Grades go from 0 to 10.'); return; }
        if (mode === 'single' && low !== null && high !== null && low > high) { setErr(bd, 'Low should be below high.'); return; }
        var cats = [];
        if (isNew && mode === 'weighted') {
          cats = G.parseCategories(val(bd, '#cCats'));
          if (cats.some(function (g) { return g.weight === null; })) { setErr(bd, 'Give each category a weight, like “Exams 60 / Homework 40”.'); return; }
        }
        var target = course || {
          id: S.uid('c'), categories: [], adjustments: [], altWeights: null, expectedPending: null, done: false, posted: null, createdAt: Date.now(),
          rounding: {}, single: {}
        };
        target.name = name;
        target.professor = val(bd, '#cProf').trim();
        target.termId = q(bd, '#cTerm') ? val(bd, '#cTerm') : c.termId;
        target.rounding = { threshold: threshold, unconfirmed: q(bd, '[data-sw="c-rule-unc"]').checked };
        target.mode = mode;
        target.counts = q(bd, '[data-sw="c-counts"]').checked;
        target.single = { expected: mode === 'single' ? exp : (target.single && target.single.expected), low: mode === 'single' ? low : (target.single && target.single.low), high: mode === 'single' ? high : (target.single && target.single.high) };
        if (isNew) {
          target.categories = cats.map(function (g) { return { id: S.uid('g'), name: g.name, weight: g.weight, items: [] }; });
          target.weightsUnconfirmed = mode === 'weighted' && q(bd, '[data-sw="c-w-unc"]').checked;
          data.courses.push(target);
        }
        if (!target.termId) { setErr(bd, 'Add a term first.'); return; }
        closeSheet(bd);
        commit();
        if (isNew) {
          var top = ui.stack.length ? ui.stack[ui.stack.length - 1] : null;
          if (!(top && top.type === 'course' && top.id === target.id)) push('course', target.id);
        }
      }
    });
  }

  // ---------- categories and weights ----------

  function categoriesSheet(c) {
    var rows = c.categories.map(function (g) { return { id: g.id, name: g.name, weight: g.weight, alt: c.altWeights && isNum(c.altWeights[g.id]) ? c.altWeights[g.id] : null, items: g.items.length }; });
    var unconfirmed = c.weightsUnconfirmed;
    var html = '<h2>Categories and weights</h2>' +
      '<div class="field"><label for="quickCats">Quick entry</label><div style="display:flex;gap:.5rem"><input type="text" class="input" id="quickCats" autocomplete="off" placeholder="Exams 60 / Homework 40"><button class="btn btn-sm" data-act="fill" style="min-height:46px">Fill</button></div></div>' +
      '<div class="field-inline"><span>Weights unconfirmed<small style="display:block;color:var(--ink-soft);font-size:.8rem">Compare a best guess with an alternative</small></span>' + switchHTML('w-unc', unconfirmed) + '</div>' +
      '<div id="catRows" class="edit-rows"></div>' +
      '<button class="add-row" data-act="add-row" style="border-top:none;padding-left:0"><svg><use href="#sym-plus"/></svg>Add a category</button>' +
      '<div class="sum-line" id="sumLine"></div>' +
      '<div class="field-error" data-main></div>' +
      '<div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">Save</button></div>';
    openSheet(html, function (bd) {
      function draw() {
        var head = '<div class="edit-row' + (unconfirmed ? ' has-alt' : '') + '"><span class="edit-row-head">Name</span><span class="edit-row-head">' + (unconfirmed ? 'Guess %' : 'Weight %') + '</span>' + (unconfirmed ? '<span class="edit-row-head">Alt %</span>' : '') + '<span></span></div>';
        q(bd, '#catRows').innerHTML = (rows.length ? head : '<p class="field-hint">No categories yet. Use quick entry or add one.</p>') + rows.map(function (r, i) {
          return '<div class="edit-row' + (unconfirmed ? ' has-alt' : '') + '" data-i="' + i + '"><input class="input" data-f="name" value="' + esc(r.name) + '" placeholder="Category" maxlength="40">' +
            '<input class="input" data-f="weight" inputmode="decimal" value="' + (isNum(r.weight) ? r.weight : '') + '" placeholder="%">' +
            (unconfirmed ? '<input class="input" data-f="alt" inputmode="decimal" value="' + (isNum(r.alt) ? r.alt : '') + '" placeholder="%">' : '') +
            '<button class="mini-btn" data-act="remove-row" data-i="' + i + '" aria-label="Remove ' + esc(r.name || 'category') + '"><svg><use href="#sym-close"/></svg></button></div>';
        }).join('');
        sumLine();
      }
      function sumLine() {
        var tot = rows.reduce(function (s, r) { return s + (isNum(r.weight) ? r.weight : 0); }, 0);
        var line = 'Total ' + G.fmtNum(tot) + '%';
        if (unconfirmed && rows.some(function (r) { return isNum(r.alt); })) {
          var alt = rows.reduce(function (s, r) { return s + (isNum(r.alt) ? r.alt : (isNum(r.weight) ? r.weight : 0)); }, 0);
          line += ' · alternative ' + G.fmtNum(alt) + '%';
          tot = Math.abs(tot - 100) > 0.01 ? tot : alt;
        }
        var off = rows.length && Math.abs(tot - 100) > 0.01;
        q(bd, '#sumLine').textContent = rows.length ? line + (off ? ' (should be 100%)' : '') : '';
        q(bd, '#sumLine').classList.toggle('is-off', !!off);
      }
      q(bd, '#catRows').addEventListener('input', function (e) {
        var row = e.target.closest('.edit-row'); if (!row || !e.target.dataset.f) return;
        var r = rows[+row.dataset.i], f = e.target.dataset.f;
        if (f === 'name') r.name = e.target.value;
        else { var v = num(e.target.value); r[f] = v === null || isNaN(v) ? null : v; }
        sumLine();
      });
      bd._sws['w-unc'] = function (on) { unconfirmed = on; draw(); };
      bd._acts.fill = function () {
        var parsed = G.parseCategories(val(bd, '#quickCats'));
        if (!parsed.length) { setErr(bd, 'Type categories like “Exams 60 / Homework 40”.'); return; }
        setErr(bd, '');
        rows = parsed.map(function (p) {
          var match = rows.filter(function (r) { return r.name.trim().toLowerCase() === p.name.toLowerCase(); })[0];
          return { id: match ? match.id : null, name: p.name, weight: p.weight, alt: match ? match.alt : null, items: match ? match.items : 0 };
        });
        q(bd, '#quickCats').value = '';
        draw();
      };
      bd._acts['add-row'] = function () { rows.push({ id: null, name: '', weight: null, alt: null, items: 0 }); draw(); var ins = bd.querySelectorAll('[data-f="name"]'); if (ins.length) ins[ins.length - 1].focus(); };
      bd._acts['remove-row'] = function (el) {
        var i = +el.dataset.i;
        var r = rows[i];
        function drop() { rows.splice(i, 1); draw(); }
        if (r.items) confirmSheet('Remove ' + (r.name || 'this category') + '?', 'Its ' + plural(r.items, 'item') + ' will be deleted when you save.', 'Remove', drop);
        else drop();
      };
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.save = function () {
        for (var i = 0; i < rows.length; i++) {
          if (!rows[i].name.trim()) { setErr(bd, 'Every category needs a name.'); return; }
          if (!isNum(rows[i].weight) || rows[i].weight < 0 || rows[i].weight > 100) { setErr(bd, 'Give ' + rows[i].name + ' a weight from 0 to 100.'); return; }
          if (rows[i].alt !== null && (rows[i].alt < 0 || rows[i].alt > 100)) { setErr(bd, 'Alternative weights go from 0 to 100.'); return; }
        }
        var alt = {};
        c.categories = rows.map(function (r) {
          var existing = r.id ? findCategory(c, r.id) : null;
          var g = existing || { id: S.uid('g'), items: [] };
          g.name = r.name.trim();
          g.weight = r.weight;
          if (isNum(r.alt)) alt[g.id] = r.alt;
          return g;
        });
        c.weightsUnconfirmed = unconfirmed;
        c.altWeights = Object.keys(alt).length ? alt : null;
        closeSheet(bd);
        commit();
      };
      draw();
    });
  }

  // ---------- item ----------

  function adjEditorHTML(list) {
    return '<div id="adjRows" class="edit-rows"></div><button class="add-row" data-act="add-adj" style="border-top:none;padding-left:0"><svg><use href="#sym-plus"/></svg>Add bonus or adjustment</button>';
  }
  function wireAdjEditor(bd, list) {
    function draw() {
      q(bd, '#adjRows').innerHTML = list.length ? '<div class="adj-row"><span class="edit-row-head">What</span><span class="edit-row-head">Points</span><span class="edit-row-head">Applied</span><span></span></div>' + list.map(function (a, i) {
        return '<div class="adj-row" data-i="' + i + '"><input class="input" data-f="label" value="' + esc(a.label) + '" placeholder="+1 point owed" maxlength="40">' +
          '<input class="input" data-f="points" inputmode="decimal" value="' + (isNum(a.points) ? a.points : '') + '" placeholder="1">' +
          switchHTML('adj-confirm', a.confirmed, ' data-i="' + i + '"') +
          '<button class="mini-btn" data-act="remove-adj" data-i="' + i + '" aria-label="Remove"><svg><use href="#sym-close"/></svg></button></div>';
      }).join('') + '<p class="field-hint">Pending points don’t count until you switch them on.</p>' : '';
    }
    q(bd, '#adjRows').addEventListener('input', function (e) {
      var row = e.target.closest('.adj-row'); if (!row || !e.target.dataset.f) return;
      var a = list[+row.dataset.i];
      if (e.target.dataset.f === 'label') a.label = e.target.value;
      else { var v = num(e.target.value.replace(/^\+/, '')); a.points = v === null || isNaN(v) ? null : v; }
    });
    bd._sws['adj-confirm'] = function (on, input) { list[+input.dataset.i].confirmed = on; };
    bd._acts['add-adj'] = function () { list.push({ id: S.uid('a'), label: '', points: 1, confirmed: false }); draw(); };
    bd._acts['remove-adj'] = function (el) { list.splice(+el.dataset.i, 1); draw(); };
    draw();
  }
  function cleanAdj(list) {
    return list.filter(function (a) { return isNum(a.points) && a.points !== 0; }).map(function (a) { return { id: a.id || S.uid('a'), label: (a.label || '').trim(), points: a.points, confirmed: !!a.confirmed }; });
  }

  function itemSheet(c, itemId, catId) {
    var found = itemId ? findItem(c, itemId) : null;
    var isNew = !found;
    var it = found ? found.item : { name: '', status: 'graded', score: null, points: null, max: null, date: null, weight: null, adjustments: [] };
    var cat = found ? found.cat : (findCategory(c, catId) || c.categories[0]);
    if (!cat) return;
    var status = it.status;
    var adj = it.adjustments.map(function (a) { return { id: a.id, label: a.label, points: a.points, confirmed: a.confirmed }; });
    var scoreText = isNum(it.points) && isNum(it.max) ? G.fmtNum(it.points, 4) + '/' + G.fmtNum(it.max, 4) : (isNum(it.score) ? G.fmtNum(it.score, 4) : '');
    var share = shareHint(c, cat, isNew);
    var html = '<h2>' + (isNew ? 'New item' : 'Edit item') + '</h2>' +
      '<div class="field"><label for="iName">Name</label><input type="text" id="iName" maxlength="60" autocomplete="off" placeholder="' + esc(suggestName(cat)) + '" value="' + esc(it.name) + '"></div>' +
      (c.categories.length > 1 ? '<div class="field"><label for="iCat">Category</label><select id="iCat">' + c.categories.map(function (g) { return '<option value="' + g.id + '"' + (g.id === cat.id ? ' selected' : '') + '>' + esc(g.name) + ' (' + G.fmtNum(g.weight) + '%)</option>'; }).join('') + '</select></div>' : '') +
      '<div class="field">' + segHTML('i-status', [{ val: 'graded', label: 'Graded' }, { val: 'pending', label: 'Pending' }], status) + '</div>' +
      '<div class="field" id="scoreField"><label for="iScore">Grade</label><input type="text" id="iScore" inputmode="decimal" autocomplete="off" placeholder="8.9 or 17/20" value="' + esc(scoreText) + '"><p class="field-hint" id="scoreHint">Out of 10, or as points like 17/20.</p></div>' +
      '<div class="field-pair"><div class="field"><label for="iDate">Date <span class="opt">optional</span></label><input type="date" id="iDate" value="' + (it.date || '') + '"></div>' +
      '<div class="field"><label for="iWeight">Weight % <span class="opt">optional</span></label><input type="text" id="iWeight" inputmode="decimal" placeholder="' + esc(share) + '" value="' + (isNum(it.weight) ? it.weight : '') + '"></div></div>' +
      '<p class="field-hint" style="margin-top:-0.6rem;margin-bottom:0.8rem">Leave weight empty to split the category equally. A custom weight is a % of the whole course, like 30 for an exam worth 30%.</p>' +
      '<div class="sheet-section">Bonus points and adjustments</div>' + adjEditorHTML(adj) +
      '<div class="field-error" data-main></div>' +
      '<div class="sheet-actions">' + (isNew ? '<button class="btn" data-act="save-another">Add another</button>' : '<button class="btn" data-act="cancel">Cancel</button>') +
      '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Save') + '</button></div>' +
      (isNew ? '' : '<div class="danger-zone"><button class="text-btn text-btn-danger" data-act="delete">Delete item</button></div>');
    openSheet(html, function (bd) {
      function sync() {
        q(bd, '#scoreField').classList.toggle('hidden', status !== 'graded');
      }
      function preview() {
        var p = G.parseScore(val(bd, '#iScore'));
        var hint = q(bd, '#scoreHint');
        if (p && isNum(p.max)) hint.textContent = 'That’s ' + G.fmtNum(p.score, 4) + ' out of 10.';
        else hint.textContent = 'Out of 10, or as points like 17/20.';
      }
      bd._segs['i-status'] = function (v) { status = v; sync(); };
      q(bd, '#iScore').addEventListener('input', preview);
      sync(); preview();
      wireAdjEditor(bd, adj);
      if (isNew) setTimeout(function () { q(bd, '#iName').focus(); }, 350);
      function save(another) {
        var name = val(bd, '#iName').trim() || q(bd, '#iName').placeholder;
        var parsed = null;
        if (status === 'graded') {
          parsed = G.parseScore(val(bd, '#iScore'));
          if (!parsed) { setErr(bd, 'Enter a grade from 0 to 10, or points like 17/20. Or mark it pending.'); return; }
        }
        var w = num(val(bd, '#iWeight'));
        if (w !== null && (isNaN(w) || w <= 0 || w > 100)) { setErr(bd, 'Weight is a % of the course, from 0 to 100. Or leave it empty.'); return; }
        var target = found ? found.item : { id: S.uid('i') };
        target.name = name;
        target.status = status;
        target.score = parsed ? parsed.score : (status === 'pending' ? null : target.score);
        target.points = parsed && isNum(parsed.max) ? parsed.points : null;
        target.max = parsed && isNum(parsed.max) ? parsed.max : null;
        target.date = val(bd, '#iDate') || null;
        target.weight = w;
        target.adjustments = cleanAdj(adj);
        var newCat = q(bd, '#iCat') ? findCategory(c, val(bd, '#iCat')) : cat;
        if (found && newCat !== found.cat) found.cat.items = found.cat.items.filter(function (x) { return x !== target; });
        if (!found || newCat !== found.cat) newCat.items.push(target);
        closeSheet(bd);
        commit();
        if (another) setTimeout(function () { itemSheet(c, null, newCat.id); }, 200);
      }
      bd._acts.save = function () { save(false); };
      bd._acts['save-another'] = function () { save(true); };
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts['delete'] = function () {
        confirmSheet('Delete ' + it.name + '?', 'There’s no undo.', 'Delete', function () {
          found.cat.items = found.cat.items.filter(function (x) { return x !== it; });
          closeSheet(bd);
          commit();
        });
      };
    });
  }
  function shareHint(c, cat, adding) {
    var plain = cat.items.filter(function (x) { return !isNum(x.weight); }).length + (adding ? 1 : 0);
    var custom = cat.items.reduce(function (s, x) { return s + (isNum(x.weight) ? x.weight : 0); }, 0);
    var each = plain ? Math.max(0, cat.weight - custom) / plain : 0;
    return 'Equal (' + G.fmtNum(each, 2) + ')';
  }
  function suggestName(cat) {
    var base = cat.name.replace(/s$/i, '').split(/[+\/]/)[0].trim() || 'Item';
    return base + ' ' + (cat.items.length + 1);
  }

  // ---------- course adjustments, expected, posted ----------

  function adjustmentsSheet(c) {
    var adj = c.adjustments.map(function (a) { return { id: a.id, label: a.label, points: a.points, confirmed: a.confirmed }; });
    if (!adj.length) adj.push({ id: S.uid('a'), label: '', points: 1, confirmed: false });
    openSheet('<h2>Course adjustments</h2><p class="sheet-text">Points added to (or taken off) the whole course grade, like a participation bonus. Leave one switched off until it’s confirmed.</p>' +
      adjEditorHTML(adj) + '<div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">Save</button></div>', function (bd) {
      wireAdjEditor(bd, adj);
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.save = function () { c.adjustments = cleanAdj(adj); closeSheet(bd); commit(); };
    });
  }

  function expectedSheet(c) {
    var r = result(c);
    var useSet = isNum(c.expectedPending);
    var avgLabel = r.gradedWeight > 0 ? 'My average (' + G.fmtRaw(r.earned / r.gradedWeight, thr(c)) + ')' : 'Assumed (' + G.fmtNum(assumed()) + ')';
    openSheet('<h2>Expected case</h2><p class="sheet-text">What should pending items count as in the expected projection?</p>' +
      '<div class="field">' + segHTML('exp-mode', [{ val: 'avg', label: esc(avgLabel) }, { val: 'set', label: 'A number' }], useSet ? 'set' : 'avg') + '</div>' +
      '<div class="field" id="expField"><input type="text" inputmode="decimal" id="expIn" placeholder="10" value="' + (useSet ? c.expectedPending : '') + '"></div>' +
      '<div class="field-error" data-main></div><div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">Save</button></div>', function (bd) {
      function sync() { q(bd, '#expField').classList.toggle('hidden', !useSet); }
      bd._segs['exp-mode'] = function (v) { useSet = v === 'set'; sync(); if (useSet) q(bd, '#expIn').focus(); };
      sync();
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.save = function () {
        if (useSet) {
          var v = num(val(bd, '#expIn'));
          if (v === null || isNaN(v) || v < 0 || v > 10) { setErr(bd, 'Enter a grade from 0 to 10.'); return; }
          c.expectedPending = v;
        } else c.expectedPending = null;
        closeSheet(bd); commit();
      };
    });
  }

  // ---------- goals (tiers) ----------

  function tiersSheet() {
    var rows = data.settings.tiers.map(function (t) { return { id: t.id, name: t.name, target: t.target }; });
    openSheet('<h2>Goals</h2><p class="sheet-text">Each goal is checked against your unrounded cumulative average. 9.47 doesn’t reach 9.5.</p>' +
      '<div id="tierRows" class="edit-rows"></div><button class="add-row" data-act="add" style="border-top:none;padding-left:0"><svg><use href="#sym-plus"/></svg>Add a goal</button>' +
      '<div class="field-error" data-main></div><div class="btn-row"><button class="btn btn-sm" data-act="reset">Reset to defaults</button></div>' +
      '<div class="sheet-actions"><button class="btn" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">Save</button></div>', function (bd) {
      function draw() {
        q(bd, '#tierRows').innerHTML = rows.map(function (r, i) {
          return '<div class="edit-row" data-i="' + i + '"><input class="input" data-f="name" value="' + esc(r.name) + '" placeholder="Goal" maxlength="30">' +
            '<input class="input" data-f="target" inputmode="decimal" value="' + (isNum(r.target) ? r.target : '') + '" placeholder="9.0">' +
            '<button class="mini-btn" data-act="remove" data-i="' + i + '" aria-label="Remove"><svg><use href="#sym-close"/></svg></button></div>';
        }).join('');
      }
      q(bd, '#tierRows').addEventListener('input', function (e) {
        var row = e.target.closest('.edit-row'); if (!row) return;
        var r = rows[+row.dataset.i];
        if (e.target.dataset.f === 'name') r.name = e.target.value;
        else { var v = num(e.target.value); r.target = v === null || isNaN(v) ? null : v; }
      });
      bd._acts.add = function () { rows.push({ id: S.uid('tier'), name: '', target: null }); draw(); };
      bd._acts.remove = function (el) { rows.splice(+el.dataset.i, 1); draw(); };
      bd._acts.reset = function () { rows = S.defaultTiers(); draw(); };
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts.save = function () {
        for (var i = 0; i < rows.length; i++) {
          if (!rows[i].name.trim()) { setErr(bd, 'Every goal needs a name.'); return; }
          if (!isNum(rows[i].target) || rows[i].target <= 0 || rows[i].target > 10) { setErr(bd, 'Targets go from 0 to 10.'); return; }
        }
        data.settings.tiers = rows.map(function (r) { return { id: r.id, name: r.name.trim(), target: r.target }; }).sort(function (a, b) { return a.target - b.target; });
        closeSheet(bd); commit();
      };
      draw();
    });
  }

  // ================================================================
  // Backup and restore
  // ================================================================

  function backupAgeLabel() {
    var last = (S.getPref('backup') || {}).last;
    if (!last) return 'Not backed up yet';
    var days = Math.floor((Date.now() - last) / 86400000);
    return 'Last backup: ' + (days <= 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago');
  }
  function markBackedUp() {
    var info = S.getPref('backup') || {};
    info.last = Date.now();
    S.setPref('backup', info);
    renderTab('settings');
  }

  function backupSheet() {
    openSheet('<h2>Backup and restore</h2><p class="sheet-text">Your grades live only on this iPhone. Save a backup file to Files or iCloud Drive now and then, and restore it if you ever reinstall.</p>' +
      '<button class="btn btn-primary btn-block" data-act="export">' + icon('share') + 'Save backup file</button>' +
      '<button class="btn btn-block" data-act="copy" style="margin-top:.6rem">Copy backup as text</button>' +
      '<div class="divider"></div><div class="sheet-section" style="margin-top:0">Restore</div>' +
      '<button class="btn btn-block" data-act="pick">' + icon('download') + 'Choose a backup file</button>' +
      '<div class="field" style="margin-top:.8rem"><textarea id="pasteIn" rows="3" placeholder="Or paste backup text here"></textarea></div>' +
      '<div class="field-error" data-main></div>' +
      '<div class="sheet-actions"><button class="btn" data-act="cancel">Close</button><button class="btn btn-danger" data-act="paste">Restore text</button></div>', function (bd) {
      bd._acts.cancel = function () { closeSheet(bd); };
      bd._acts['export'] = exportBackupFile;
      bd._acts.copy = function () {
        var text = S.exportBackup(data);
        var done = function () { markBackedUp(); showToast('Backup copied. Paste it somewhere safe.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) ? done() : showToast("Couldn't copy. Use Save backup file instead."); });
        else if (fallbackCopy(text)) done(); else showToast("Couldn't copy. Use Save backup file instead.");
      };
      bd._acts.pick = function () { restoreFrom = bd; $('restoreFile').click(); };
      bd._acts.paste = function () {
        var text = val(bd, '#pasteIn').trim();
        if (!text) { setErr(bd, 'Paste your backup text first.'); return; }
        tryRestore(text, bd);
      };
    });
  }
  var restoreFrom = null;

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return ok;
  }

  function exportBackupFile() {
    var text = S.exportBackup(data);
    var name = S.backupFileName();
    var blob = new Blob([text], { type: 'application/json' });
    var file = null;
    try { file = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Ace It backup' }).then(function () { markBackedUp(); showToast('Backup saved.'); }, function (err) {
        if (err && err.name !== 'AbortError') downloadBlob(blob, name);
      });
      return;
    }
    downloadBlob(blob, name);
  }
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    markBackedUp();
    showToast('Backup file saved.');
  }

  var RESTORE_ERRORS = {
    'bad-json': 'That file isn’t a backup. Check you picked an Ace It backup.',
    'not-backup': 'That doesn’t look like an Ace It backup.',
    'newer-version': 'That backup is from a newer version of Ace It. Update the app (close and reopen it) and try again.'
  };

  function tryRestore(text, bd) {
    var parsed;
    try { parsed = S.parseBackup(text); } catch (e) {
      var msg = RESTORE_ERRORS[e.message] || 'That backup couldn’t be read.';
      if (bd) setErr(bd, msg); else showToast(msg);
      return;
    }
    var summary = plural(parsed.terms.length, 'term') + ' and ' + plural(parsed.courses.length, 'course');
    function apply() {
      data = parsed;
      persist();
      if (bd) closeSheet(bd);
      hideSetup();
      popToRoot();
      renderAll();
      goTab('overview');
      markBackedUp();
      showToast('Restored ' + summary + '.');
    }
    if (data.courses.length || data.terms.length) {
      confirmSheet('Replace everything?', 'This replaces all the data on this phone with the backup’s ' + summary + '. There’s no undo.', 'Restore', apply);
    } else apply();
  }

  $('restoreFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { tryRestore(String(reader.result || ''), restoreFrom && document.body.contains(restoreFrom) ? restoreFrom : null); };
    reader.onerror = function () { showToast('That file couldn’t be opened.'); };
    reader.readAsText(f);
  });

  // A monthly nudge to back up, like the habit apps.
  function maybeNudgeBackup() {
    if (!data.courses.length) return;
    var info = S.getPref('backup') || {};
    var now = Date.now();
    var since = info.last || Math.min.apply(null, data.courses.map(function (c) { return c.createdAt || now; }));
    if (now - since < 30 * 86400000) return;
    if (info.nudged && now - info.nudged < 7 * 86400000) return;
    info.nudged = now;
    S.setPref('backup', info);
    showToast(info.last ? 'A month since your last backup.' : 'Your grades only live on this phone.', { action: 'Back up', onAction: backupSheet, duration: 6000 });
  }

  // ================================================================
  // First launch
  // ================================================================

  var setup = null;

  function showSetup() {
    setup = { step: 0, total: data.settings.totalCourses, passing: data.settings.passingGrade, tiers: data.settings.tiers.map(function (t) { return { id: t.id, name: t.name, target: t.target }; }), threshold: data.settings.defaultThreshold };
    $('setup').classList.remove('hidden');
    renderSetup();
  }
  function hideSetup() { $('setup').classList.add('hidden'); setup = null; }

  function renderSetup() {
    var el = $('setup');
    var s = setup;
    var progress = function (n) { return '<div class="setup-progress">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'is-on' : '') + '"></i>'; }).join('') + '</div>'; };
    var h = '<div class="setup-inner">';
    if (s.step === 0) {
      h += '<div class="setup-mark"><svg aria-hidden="true"><use href="#sym-mark"/></svg></div>' +
        '<h2>Every grade,<br>one clear average.</h2>' +
        '<p class="setup-lede">Ace It predicts your final grades, tells you what you need on what’s left, and tracks your cumulative average across your whole degree.</p>' +
        '<div class="setup-foot"><button class="btn btn-primary btn-lg btn-block" data-act="setup-next">Start from scratch</button>' +
        '<button class="btn btn-lg btn-block" data-act="setup-restore">Restore from backup</button>' +
        '<p class="setup-small">Everything stays on this iPhone. No account, no cloud.</p></div>';
    } else if (s.step === 1) {
      h += progress(1) + '<h2>Your degree</h2><p class="setup-lede">You can change these any time in Settings.</p>' +
        '<div class="field"><label for="suTotal">Total courses in your degree <span class="opt">optional</span></label><input type="text" inputmode="numeric" id="suTotal" placeholder="Skip for now" value="' + (s.total || '') + '">' +
        '<p class="field-hint">Only needed to plan the whole degree. Without it, predictions use the courses you add.</p></div>' +
        '<div class="field"><label for="suPass">Passing grade</label><input type="text" inputmode="decimal" id="suPass" value="' + G.fmtNum(s.passing) + '"><p class="field-hint">Courses heading below it get flagged.</p></div>' +
        '<div class="field-error" id="suErr"></div>' + setupFoot();
    } else if (s.step === 2) {
      h += progress(2) + '<h2>Your goals</h2><p class="setup-lede">Your cumulative is checked against each one, unrounded. Change them to fit your plans.</p>' +
        '<div class="edit-rows">' + s.tiers.map(function (t, i) {
          return '<div class="edit-row" style="grid-template-columns:minmax(0,1fr) 84px" data-i="' + i + '"><input class="input" data-f="name" value="' + esc(t.name) + '" maxlength="30"><input class="input" data-f="target" inputmode="decimal" value="' + G.fmtNum(t.target) + '"></div>';
        }).join('') + '</div><div class="field-error" id="suErr"></div>' + setupFoot();
    } else if (s.step === 3) {
      h += progress(3) + '<h2>How grades round</h2><p class="setup-lede">The default for new courses. You can set a different rule for any professor.</p>' +
        '<button class="choice' + (s.threshold === 5 ? ' is-on' : '') + '" data-act="setup-rule" data-val="5"><b>Round up from .5</b><small>8.5 becomes 9, 9.49 stays 9, 9.5 becomes 10</small></button>' +
        '<button class="choice' + (s.threshold === 6 ? ' is-on' : '') + '" data-act="setup-rule" data-val="6"><b>Round up from .6</b><small>8.6 becomes 9, 8.5 stays 8</small></button>' + setupFoot('Add your first term');
    }
    h += '</div>';
    el.innerHTML = h;
    el.scrollTop = 0;
  }
  function setupFoot(label) {
    return '<div class="setup-foot"><button class="btn btn-primary btn-lg btn-block" data-act="setup-next">' + (label || 'Continue') + '</button><button class="btn btn-ghost btn-block" data-act="setup-back">Back</button></div>';
  }
  function setupCollect() {
    var el = $('setup');
    var err = el.querySelector('#suErr');
    if (setup.step === 1) {
      var tot = num(el.querySelector('#suTotal').value), pass = num(el.querySelector('#suPass').value);
      if (tot !== null && (isNaN(tot) || tot < 1 || tot > 200 || Math.round(tot) !== tot)) { err.textContent = 'Enter a whole number of courses, or leave it empty.'; return false; }
      if (pass === null || isNaN(pass) || pass < 0 || pass > 10) { err.textContent = 'Enter a passing grade from 0 to 10.'; return false; }
      setup.total = tot; setup.passing = pass;
    } else if (setup.step === 2) {
      var ok = true;
      el.querySelectorAll('.edit-row').forEach(function (row) {
        var t = setup.tiers[+row.dataset.i];
        t.name = row.querySelector('[data-f="name"]').value.trim() || t.name;
        var v = num(row.querySelector('[data-f="target"]').value);
        if (v === null || isNaN(v) || v <= 0 || v > 10) ok = false; else t.target = v;
      });
      if (!ok) { err.textContent = 'Targets go from 0 to 10.'; return false; }
    }
    return true;
  }
  function finishSetup() {
    data.settings.totalCourses = setup.total || null;
    data.settings.passingGrade = setup.passing;
    data.settings.tiers = setup.tiers.slice().sort(function (a, b) { return a.target - b.target; });
    data.settings.defaultThreshold = setup.threshold;
    data.onboarded = true;
    hideSetup();
    commit();
    goTab('overview');
    setTimeout(function () { termSheet(null); }, 250);
  }

  // ================================================================
  // Global actions
  // ================================================================

  function currentCourse() {
    var top = ui.stack[ui.stack.length - 1];
    return top && top.type === 'course' ? courseById(top.id) : null;
  }

  var ACTIONS = {
    back: function () { pop(false); },
    'open-term': function (el) { push('term', el.dataset.id); },
    'open-course': function (el) { push('course', el.dataset.id); },
    'add-term': function () { termSheet(null); },
    'edit-term': function (el) { termSheet(termById(el.dataset.id)); },
    'add-course': function (el) {
      if (!data.terms.length) { termSheet(null); return; }
      courseSheet(null, el.dataset.term);
    },
    'quick-add': function () {
      if (!data.terms.length) { termSheet(null); showToast('Add a term first, then its courses.'); return; }
      courseSheet(null);
    },
    'edit-course': function () { var c = currentCourse(); if (c) courseSheet(c); },
    'edit-categories': function () { var c = currentCourse(); if (c) categoriesSheet(c); },
    'add-item': function (el) { var c = currentCourse(); if (c) itemSheet(c, null, el.dataset.cat); },
    'edit-item': function (el) { var c = currentCourse(); if (c) itemSheet(c, el.dataset.id); },
    'edit-expected': function () { var c = currentCourse(); if (c) expectedSheet(c); },
    'edit-adjustments': function () { var c = currentCourse(); if (c) adjustmentsSheet(c); },
    'edit-posted': function () {
      var c = currentCourse(); if (!c) return;
      numberSheet({ title: 'Official final grade', text: 'Once the school posts the grade, enter it here (as posted, e.g. 9 or 9.47). It replaces the calculation and marks the course finished.', value: c.posted, min: 0, max: 10, allowEmpty: true, clearLabel: 'Remove',
        onSave: function (v) { c.posted = v; if (v !== null) c.done = true; commit(); } });
    },
    'delete-course': function () {
      var c = currentCourse(); if (!c) return;
      confirmSheet('Delete ' + c.name + '?', 'All its categories and grades go too. There’s no undo.', 'Delete', function () {
        data.courses = data.courses.filter(function (x) { return x !== c; });
        commit();
      });
    },
    'edit-tiers': tiersSheet,
    'set-total': function () {
      numberSheet({ title: 'Total courses in degree', text: 'Optional. With it, Ace It plans your whole degree: the average you need on every remaining course, and how many 9s you can afford. Summer courses don’t change the total; they just come out of later terms.', value: data.settings.totalCourses, min: 1, max: 200, integer: true, allowEmpty: true, placeholder: 'Not set',
        onSave: function (v) { data.settings.totalCourses = v; commit(); } });
    },
    'set-passing': function () {
      numberSheet({ title: 'Passing grade', text: 'Courses expected to finish below this are flagged at risk.', value: data.settings.passingGrade, min: 0, max: 10,
        onSave: function (v) { data.settings.passingGrade = v; commit(); } });
    },
    'set-assumed': function () {
      numberSheet({ title: 'Future courses assumed at', text: 'Courses you haven’t added yet count at this grade in the projected average. Leave it empty to use your Goal.', value: data.settings.futureAssumed, min: 0, max: 10, allowEmpty: true, clearLabel: 'Use Goal', placeholder: G.fmtNum(G.defaultAssumed({ tiers: data.settings.tiers })),
        onSave: function (v) { data.settings.futureAssumed = v; commit(); } });
    },
    'open-backup': backupSheet,
    'erase-all': function () {
      confirmSheet('Erase all data?', 'Every term, course and grade on this phone is deleted. Save a backup first if you might want it back.', 'Erase', function () {
        S.erase();
        data = S.freshData();
        popToRoot();
        renderAll();
        goTab('overview');
        showSetup();
      });
    },
    'setup-next': function () {
      if (!setupCollect()) return;
      if (setup.step >= 3) { finishSetup(); return; }
      setup.step++; renderSetup();
    },
    'setup-back': function () { setup.step = Math.max(0, setup.step - 1); renderSetup(); },
    'setup-restore': function () { backupSheet(); },
    'setup-rule': function (el) { setup.threshold = +el.dataset.val; renderSetup(); }
  };

  var SEGS = {
    theme: function (v) { setThemePref(v); },
    'default-rule': function (v) { data.settings.defaultThreshold = +v; persist(); },
    'course-rule': function (v) { var c = currentCourse(); if (c) { c.rounding.threshold = +v; commit(); } }
  };
  var SWITCHES = {
    'course-rule-unconfirmed': function (on) { var c = currentCourse(); if (c) { c.rounding.unconfirmed = on; commit(); } },
    'course-counts': function (on) { var c = currentCourse(); if (c) { c.counts = on; commit(); } },
    'course-done': function (on) {
      var c = currentCourse(); if (!c) return;
      c.done = on;
      if (!on && isNum(c.posted)) { c.posted = null; showToast('Official grade removed.'); }
      commit();
    }
  };

  document.addEventListener('click', function (e) {
    var seg = e.target.closest('.seg-opt');
    if (seg) {
      var group = seg.closest('.seg');
      var bd = seg.closest('.sheet-backdrop');
      setSeg(group, seg.dataset.val);
      var fn = (bd && bd._segs[group.dataset.seg]) || SEGS[group.dataset.seg];
      if (fn) fn(seg.dataset.val, group);
      return;
    }
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var sheet = el.closest('.sheet-backdrop');
    var act = sheet ? sheet._acts[el.dataset.act] : ACTIONS[el.dataset.act];
    if (act) { e.preventDefault(); act(el, e); }
  });
  document.addEventListener('change', function (e) {
    var sw = e.target.closest('[data-sw]');
    if (!sw) return;
    var bd = sw.closest('.sheet-backdrop');
    var fn = (bd && bd._sws[sw.dataset.sw]) || (!bd && SWITCHES[sw.dataset.sw]);
    if (fn) fn(sw.checked, sw);
  });

  // ================================================================
  // Toast, appearance, text size
  // ================================================================

  var toastTimer = null;
  function showToast(text, opts) {
    opts = opts || {};
    var t = $('toast'), a = $('toastAction');
    $('toastText').textContent = text;
    a.classList.toggle('hidden', !opts.action);
    if (opts.action) { a.textContent = opts.action; a.onclick = function () { hideToast(); opts.onAction(); }; }
    t.classList.remove('hidden');
    void t.offsetWidth;
    t.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, opts.duration || 2600);
  }
  function hideToast() { var t = $('toast'); t.classList.remove('is-open'); setTimeout(function () { if (!t.classList.contains('is-open')) t.classList.add('hidden'); }, 300); }

  var THEME_COLORS = { light: '#FFFFFF', dark: '#141012' };
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function themePref() { var p = S.getPref('theme'); return p === 'light' || p === 'dark' ? p : 'auto'; }
  function applyTheme() {
    var pref = themePref();
    var dark = pref === 'dark' || (pref === 'auto' && !!darkQuery && darkQuery.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[dark ? 'dark' : 'light']);
  }
  function setThemePref(pref) {
    S.setPref('theme', pref === 'auto' ? null : pref);
    applyTheme();
    var hint = $('themeHint');
    if (hint) hint.textContent = THEME_HINTS[pref];
  }
  if (darkQuery) {
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);
    else if (darkQuery.addListener) darkQuery.addListener(applyTheme);
  }

  // The root size follows the iPhone's text-size setting.
  function applyTextSize() {
    if (!window.CSS || !CSS.supports('font', '-apple-system-body')) return;
    var probe = document.createElement('div');
    probe.style.cssText = 'font: -apple-system-body; position: absolute; visibility: hidden;';
    document.body.appendChild(probe);
    var px = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    if (!px) return;
    document.documentElement.style.fontSize = Math.min(21, Math.max(14, 16 * px / 17)) + 'px';
  }

  // ================================================================
  // Start
  // ================================================================

  document.addEventListener('touchstart', function () {}, { passive: true });
  applyTextSize();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) applyTextSize(); });
  wireTabBar();
  wireEdgeSwipe();
  if (history.state && history.state.ace) history.replaceState(null, '');
  renderAll();
  goTab('overview');
  requestAnimationFrame(moveTabLens);
  if (!data.onboarded) showSetup();
  else { persistAsked = true; S.requestPersistence(); }
  setTimeout(maybeNudgeBackup, 1600);

  // Debug/test hook (no data leaves the page).
  window.__aceit = { get data() { return data; }, renderAll: renderAll, push: push, pop: pop };

  if ('serviceWorker' in navigator) {
    // When a new version takes over, reload once so it's used right away
    // instead of only after the app is closed and reopened again.
    var hadController = !!navigator.serviceWorker.controller;
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || reloading) return;
      reloading = true;
      location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        if (!reg || !reg.update) return;
        reg.update();
        // Home-screen apps often resume instead of relaunching, so check then too.
        document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update(); });
      }).catch(function () {});
    });
  }
})();
