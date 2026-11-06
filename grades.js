/* Ace It grade math. Pure functions only: no DOM, no storage.
   Loads in the browser as window.Grades and in Node with require('./grades.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Grades = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCALE = 1000000;   // raw grades are compared as integers in millionths
  var EPS = 1e-9;

  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function sum(list) { var s = 0; for (var i = 0; i < list.length; i++) s += list[i]; return s; }
  function gte(a, b) { return a >= b - EPS; }

  // ---------- rounding ----------

  // threshold is in tenths: 5 = round up from .5 (default), 6 = round up from .6.
  function normThreshold(t) { return t === 6 ? 6 : 5; }

  // Raw grade (full precision) -> integer final grade. Works on scaled integers so a
  // value like 8.4999999999 (floating-point noise for 8.5) still counts as 8.5.
  function roundFinal(raw, threshold) {
    if (!isNum(raw)) return null;
    var t = normThreshold(threshold);
    var s = Math.round(clamp(raw, 0, 10) * SCALE);
    var base = Math.floor(s / SCALE);
    var rem = s - base * SCALE;
    return Math.min(10, base + (rem >= t * (SCALE / 10) ? 1 : 0));
  }

  // Lowest raw grade that rounds to `final`: F - 1 + t (8.5 for a 9 under the .5 rule).
  function minRawFor(final, threshold) {
    if (final <= 0) return 0;
    return (final * 10 - 10 + normThreshold(threshold)) / 10;
  }

  // Two decimals, unless two decimals would suggest the wrong final
  // (9.4975 shows as 9.4975, not "9.50", because it rounds to 9).
  function fmtRaw(raw, threshold) {
    if (!isNum(raw)) return '–';
    var fin = roundFinal(raw, threshold);
    for (var d = 2; d <= 4; d++) {
      var s = raw.toFixed(d);
      if (roundFinal(parseFloat(s), threshold) === fin) return s;
    }
    return raw.toFixed(4);
  }

  // Averages are compared against tiers unrounded, so they're cut (not rounded) to
  // two decimals: 9.4975 shows as 9.49, never as a "9.50" that doesn't reach 9.5.
  function fmtAvg(x) {
    if (!isNum(x)) return '–';
    return (Math.floor(x * 100 + EPS * 100) / 100).toFixed(2);
  }

  function fmtNum(x, maxDecimals) {
    if (!isNum(x)) return '–';
    var d = maxDecimals == null ? 2 : maxDecimals;
    return String(parseFloat(x.toFixed(d)));
  }

  // ---------- input parsing ----------

  // "8.9", "17/20", "17 / 20", "89%" -> { score (0-10), points?, max? }. null if invalid.
  function parseScore(text) {
    if (text == null) return null;
    var s = String(text).trim().replace(',', '.');
    if (!s) return null;
    var m = s.match(/^(\d+(?:\.\d+)?)\s*(?:\/|of|out of)\s*(\d+(?:\.\d+)?)$/i);
    if (m) {
      var p = parseFloat(m[1]), mx = parseFloat(m[2]);
      if (!(mx > 0)) return null;
      return { score: (p / mx) * 10, points: p, max: mx };
    }
    m = s.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (m) {
      var pct = parseFloat(m[1]);
      return pct <= 100 ? { score: pct / 10 } : null;
    }
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    var v = parseFloat(s);
    return v >= 0 && v <= 10 ? { score: v } : null;
  }

  // "Exams 60% / Homework 40" -> [{ name, weight }]. Splits on / , ; or new lines.
  function parseCategories(text) {
    if (!text) return [];
    var out = [];
    String(text).split(/[\/,;\n]+/).forEach(function (part) {
      var p = part.trim();
      if (!p) return;
      var m = p.match(/^(.*?)[\s:=-]*(\d+(?:\.\d+)?)\s*%?$/);
      if (m && m[1].trim()) out.push({ name: m[1].trim(), weight: parseFloat(m[2]) });
      else out.push({ name: p.replace(/\s*%$/, ''), weight: null });
    });
    return out;
  }

  // ---------- items and adjustments ----------

  function itemBaseScore(item) {
    if (!item) return null;
    if (isNum(item.points) && isNum(item.max) && item.max > 0) return (item.points / item.max) * 10;
    return isNum(item.score) ? item.score : null;
  }

  function adjustmentTotal(list, includePending) {
    if (!Array.isArray(list)) return 0;
    return sum(list.filter(function (a) { return a && isNum(a.points) && (a.confirmed || includePending); })
      .map(function (a) { return a.points; }));
  }

  function hasPendingAdjustments(list) {
    return Array.isArray(list) && list.some(function (a) { return a && isNum(a.points) && !a.confirmed; });
  }

  // Score that counts for a graded item: base + confirmed adjustments, kept within 0-10.
  function itemScore(item, includePending) {
    if (!item || item.status !== 'graded') return null;
    var s = itemBaseScore(item);
    if (!isNum(s)) return null;
    return clamp(s + adjustmentTotal(item.adjustments, includePending), 0, 10);
  }

  // ---------- weights ----------

  // Every item's share of the whole course. Items split their category equally unless
  // they have a custom weight (a % of the course). A category with no items is one
  // pending slot. weightOverride ({ categoryId: weight }) is the alternative split;
  // custom item weights scale with their category.
  function weightSlots(course, weightOverride) {
    var slots = [];
    var warnings = [];
    var catWeightSum = 0;
    (course.categories || []).forEach(function (cat) {
      var base = isNum(cat.weight) ? Math.max(0, cat.weight) : 0;
      var W = weightOverride && isNum(weightOverride[cat.id]) ? Math.max(0, weightOverride[cat.id]) : base;
      catWeightSum += W;
      var scale = base > 0 ? W / base : 1;
      var items = Array.isArray(cat.items) ? cat.items : [];
      if (!items.length) {
        if (W > 0) slots.push({ cat: cat, item: null, w: W });
        return;
      }
      var custom = items.filter(function (it) { return isNum(it.weight) && it.weight > 0; });
      var plain = items.filter(function (it) { return !(isNum(it.weight) && it.weight > 0); });
      var customSum = sum(custom.map(function (it) { return it.weight * scale; }));
      var fix = 1;
      if (customSum > W + EPS || (!plain.length && Math.abs(customSum - W) > 1e-6 && customSum > 0)) {
        fix = customSum > 0 ? W / customSum : 1;
        warnings.push({ type: 'custom-weights', category: cat.name });
      }
      custom.forEach(function (it) { slots.push({ cat: cat, item: it, w: it.weight * scale * fix }); });
      var rest = Math.max(0, W - customSum * fix);
      plain.forEach(function (it) { slots.push({ cat: cat, item: it, w: rest / plain.length }); });
    });
    if ((course.categories || []).length && Math.abs(catWeightSum - 100) > 0.01) {
      warnings.push({ type: 'weight-sum', total: catWeightSum });
    }
    return { slots: slots, warnings: warnings, total: sum(slots.map(function (s) { return s.w; })), categoryTotal: catWeightSum };
  }

  function hasAltWeights(course) {
    var alt = course && course.altWeights;
    if (!alt || typeof alt !== 'object') return false;
    return (course.categories || []).some(function (c) { return isNum(alt[c.id]); });
  }

  // ---------- one course ----------

  function emptyResult(course, threshold) {
    return {
      mode: course.mode, threshold: threshold, hasData: false,
      soFar: null, gradedWeight: 0, pendingWeight: 0, totalWeight: 0,
      expected: null, best: null, worst: null, raw: null,
      expectedFinal: null, bestFinal: null, worstFinal: null, final: null,
      expectedPending: null, expectedPendingSource: null, estimate: false, posted: false,
      warnings: [], pendingSlots: [], categoryStats: [], withOwed: null
    };
  }

  // opts.assumed: fallback grade when a course has nothing to go on yet.
  // opts.weights: alternative category weights.
  function computeCourse(course, opts) {
    opts = opts || {};
    var t = normThreshold(course && course.rounding ? course.rounding.threshold : 5);
    var r = emptyResult(course || {}, t);
    if (!course) return r;
    var courseAdj = adjustmentTotal(course.adjustments, false);
    var adj = function (x) { return isNum(x) ? clamp(x + courseAdj, 0, 10) : null; };

    if (course.mode === 'single') {
      var s = course.single || {};
      if (isNum(course.posted)) {
        r.raw = r.expected = r.best = r.worst = course.posted;
        r.posted = true;
      } else {
        var exp = isNum(s.expected) ? s.expected : (isNum(opts.assumed) ? opts.assumed : null);
        r.expected = adj(exp);
        r.best = adj(isNum(s.high) ? s.high : exp);
        r.worst = adj(isNum(s.low) ? s.low : exp);
        r.raw = r.expected;
        r.estimate = true;
        r.expectedPendingSource = isNum(s.expected) ? 'set' : 'assumed';
      }
      r.hasData = isNum(r.raw);
    } else {
      var ws = weightSlots(course, opts.weights);
      r.warnings = ws.warnings;
      var total = ws.total;
      r.totalWeight = total;
      if (total > 0) {
        var graded = 0, earned = 0, earnedOwed = 0;
        var catMap = {};
        ws.slots.forEach(function (slot) {
          var key = slot.cat.id;
          if (!catMap[key]) catMap[key] = { category: slot.cat, weight: 0, graded: 0, earned: 0, items: [] };
          var cs = catMap[key];
          cs.weight += slot.w;
          var sc = slot.item ? itemScore(slot.item, false) : null;
          var scOwed = slot.item ? itemScore(slot.item, true) : null;
          cs.items.push({ item: slot.item, w: slot.w, score: sc });
          if (isNum(sc)) {
            graded += slot.w; earned += slot.w * sc; earnedOwed += slot.w * scOwed;
            cs.graded += slot.w; cs.earned += slot.w * sc;
          } else {
            r.pendingSlots.push(slot);
          }
        });
        r.categoryStats = (course.categories || []).map(function (c) {
          var cs = catMap[c.id] || { category: c, weight: 0, graded: 0, earned: 0, items: [] };
          cs.average = cs.graded > 0 ? cs.earned / cs.graded : null;
          return cs;
        });
        var pending = Math.max(0, total - graded);
        if (pending < 1e-9) pending = 0;
        r.gradedWeight = graded;
        r.pendingWeight = pending;
        r.earned = earned;
        r.soFar = graded > 0 ? adj(earned / graded) : null;
        var expP;
        if (isNum(course.expectedPending)) { expP = course.expectedPending; r.expectedPendingSource = 'set'; }
        else if (graded > 0) { expP = earned / graded; r.expectedPendingSource = 'average'; }
        else if (isNum(opts.assumed)) { expP = opts.assumed; r.expectedPendingSource = 'assumed'; }
        else { expP = null; }
        r.expectedPending = expP;
        r.best = adj((earned + pending * 10) / total);
        r.worst = adj(earned / total);
        r.expected = isNum(expP) ? adj((earned + pending * expP) / total) : null;
        if (hasPendingAdjustments(course.adjustments) || earnedOwed > earned + EPS) {
          var owedAdj = adjustmentTotal(course.adjustments, true);
          // Pending items follow your average; with the owed points in, that average is higher too.
          var expPOwed = r.expectedPendingSource === 'average' ? earnedOwed / graded : expP;
          var expOwed = isNum(expPOwed) ? (earnedOwed + pending * expPOwed) / total : null;
          r.withOwed = isNum(expOwed) ? clamp(expOwed + owedAdj, 0, 10) : null;
          r.soFarWithOwed = graded > 0 ? clamp(earnedOwed / graded + owedAdj, 0, 10) : null;
        }
        r.hasData = graded > 0 || isNum(course.posted) || isNum(expP);
      }
      if (isNum(course.posted)) {
        r.raw = course.posted; r.posted = true;
      } else if (course.done) {
        r.raw = r.worst;  // a finished course: anything still pending counts as 0
      } else {
        r.raw = r.expected;
        r.estimate = r.gradedWeight === 0 && isNum(r.expected);
      }
    }
    r.expectedFinal = roundFinal(r.expected, t);
    r.bestFinal = roundFinal(r.best, t);
    r.worstFinal = roundFinal(r.worst, t);
    r.final = roundFinal(r.raw, t);
    r.withOwedFinal = roundFinal(r.withOwed, t);
    if (isNum(course.posted) || course.done) {
      r.expected = r.best = r.worst = r.raw;
      r.expectedFinal = r.bestFinal = r.worstFinal = r.final;
    }
    return r;
  }

  // What's needed on the remaining (pending) weight to finish with `finalTarget`.
  // status: 'secured' | 'needed' | 'impossible' | 'done' (nothing left to grade)
  function neededForFinal(course, finalTarget, opts) {
    var res = computeCourse(course, opts);
    var t = res.threshold;
    var minRaw = minRawFor(finalTarget, t);
    var out = { target: finalTarget, minRaw: minRaw, status: 'done', average: null, pendingWeight: res.pendingWeight };
    if (course.mode === 'single' || isNum(course.posted)) { out.status = 'na'; return out; }
    if (!(res.totalWeight > 0)) { out.status = 'na'; return out; }
    if (res.pendingWeight <= 0) {
      out.status = gte(res.worst, minRaw) ? 'secured' : 'impossible';
      return out;
    }
    var courseAdj = adjustmentTotal(course.adjustments, false);
    var need = ((minRaw - courseAdj) * res.totalWeight - res.earned) / res.pendingWeight;
    out.average = need;
    if (need <= EPS) out.status = 'secured';
    else if (need > 10 + EPS) out.status = 'impossible';
    else out.status = 'needed';
    return out;
  }

  function courseThreshold(course) { return normThreshold(course && course.rounding ? course.rounding.threshold : 5); }

  // ---------- the whole degree ----------

  function defaultAssumed(settings) {
    if (settings && isNum(settings.futureAssumed)) return settings.futureAssumed;
    var tiers = (settings && settings.tiers) || [];
    var goal = tiers.filter(function (t) { return t.id === 'goal'; })[0] || tiers[Math.min(1, tiers.length - 1)];
    return goal && isNum(goal.target) ? goal.target : 9;
  }

  function countsToward(course) { return course && course.counts !== false; }

  function termAverage(data, termId, opts) {
    var assumed = defaultAssumed(data.settings);
    var finals = [];
    var official = true;
    (data.courses || []).forEach(function (c) {
      if (c.termId !== termId || !countsToward(c)) return;
      var r = computeCourse(c, { assumed: assumed });
      var done = c.done || isNum(c.posted);
      var f = done ? r.final : r.expectedFinal;
      if (!isNum(f)) return;
      if (!done || r.estimate) official = false;
      finals.push(f);
    });
    if (!finals.length) return { average: null, count: 0, official: false };
    return { average: sum(finals) / finals.length, count: finals.length, official: official };
  }

  // Cumulative average = sum of rounded finals / number of counted courses. Never rounded.
  function summarize(data) {
    var settings = (data && data.settings) || {};
    var courses = ((data && data.courses) || []).filter(countsToward);
    var assumed = defaultAssumed(settings);
    var passing = isNum(settings.passingGrade) ? settings.passingGrade : 6;
    var off = { n: 0, sum: 0 };
    var ip = { n: 0, exp: 0, best: 0, worst: 0, estimates: 0 };
    var perCourse = {};
    courses.forEach(function (c) {
      var r = computeCourse(c, { assumed: assumed });
      perCourse[c.id] = r;
      if (c.done || isNum(c.posted)) {
        if (!isNum(r.final)) return;
        off.n++; off.sum += r.final;
      } else {
        ip.n++;
        var e = isNum(r.expectedFinal) ? r.expectedFinal : roundFinal(assumed, courseThreshold(c));
        ip.exp += e;
        ip.best += isNum(r.bestFinal) ? r.bestFinal : 10;
        ip.worst += isNum(r.worstFinal) ? r.worstFinal : 0;
        if (r.estimate || !isNum(r.expectedFinal)) ip.estimates++;
      }
    });

    var total = isNum(settings.totalCourses) && settings.totalCourses > 0 ? Math.round(settings.totalCourses) : null;
    var future;
    if (total) {
      future = Math.max(0, total - off.n - ip.n);
    } else {
      future = 0;
      (data.terms || []).forEach(function (term) {
        if (!isNum(term.planned) || term.planned <= 0) return;
        var have = courses.filter(function (c) { return c.termId === term.id; }).length;
        future += Math.max(0, Math.round(term.planned) - have);
      });
    }
    var D = off.n + ip.n + future;
    var R = D - off.n;
    var official = off.n ? off.sum / off.n : null;
    var projected = D ? (off.sum + ip.exp + future * assumed) / D : null;
    var worstCum = D ? (off.sum + ip.worst + future * passing) / D : null;
    var bestCum = D ? (off.sum + ip.best + future * 10) / D : null;

    var tiers = (settings.tiers || []).filter(function (t) { return isNum(t.target); }).map(function (tier) {
      var T = tier.target;
      var res = { id: tier.id, name: tier.name, target: T, status: 'out', neededAverage: null, ninesAffordable: null, remaining: R };
      if (!D) { res.status = 'none'; return res; }
      // Integer-safe: compare sums of grades against target x count in hundredths.
      var T100 = Math.round(T * 100);
      if (R > 0) {
        res.neededAverage = (T * D - off.sum) / R;
        var spare = off.sum * 100 + R * 1000 - T100 * D;     // hundredths of a grade to spare with all 10s
        res.ninesAffordable = spare < 0 ? null : Math.min(R, Math.floor(spare / 100 + EPS));
      }
      if (R === 0) res.status = gte(official, T) ? 'secured' : 'out';
      else if (gte(worstCum, T)) res.status = 'secured';
      else if (gte(projected, T)) res.status = 'track';
      else if (gte(bestCum, T)) res.status = 'reachable';
      else res.status = 'out';
      return res;
    });

    return {
      official: official, officialCount: off.n, officialSum: off.sum,
      projected: projected, best: bestCum, worst: worstCum,
      inProgress: ip.n, estimates: ip.estimates, future: future, assumed: assumed,
      denominator: D, remaining: R, totalCourses: total, tiers: tiers, perCourse: perCourse
    };
  }

  function atRisk(course, result, passing) {
    var p = isNum(passing) ? passing : 6;
    if (!result) return false;
    if (isNum(result.expectedFinal) && result.expectedFinal < p) return true;
    if (!course.done && isNum(result.soFar) && roundFinal(result.soFar, result.threshold) < p) return true;
    return false;
  }

  return {
    EPS: EPS,
    isNum: isNum,
    roundFinal: roundFinal,
    minRawFor: minRawFor,
    fmtRaw: fmtRaw,
    fmtAvg: fmtAvg,
    fmtNum: fmtNum,
    parseScore: parseScore,
    parseCategories: parseCategories,
    itemBaseScore: itemBaseScore,
    itemScore: itemScore,
    adjustmentTotal: adjustmentTotal,
    hasPendingAdjustments: hasPendingAdjustments,
    weightSlots: weightSlots,
    hasAltWeights: hasAltWeights,
    computeCourse: computeCourse,
    neededForFinal: neededForFinal,
    courseThreshold: courseThreshold,
    defaultAssumed: defaultAssumed,
    termAverage: termAverage,
    summarize: summarize,
    atRisk: atRisk
  };
});
