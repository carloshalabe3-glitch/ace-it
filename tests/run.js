// Ace It tests: `node tests/run.js` (or `npm test`). No dependencies.
// Uses made-up courses only. Checks against your real data live outside the repo
// (../ace-it-private/seed.test.js) and run here too when that folder exists.
'use strict';
var path = require('path');
var fs = require('fs');
var G = require('../grades.js');
var Store = require('../store.js');

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || '') + ' expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
function near(actual, expected, tol, msg) {
  if (typeof actual !== 'number' || Math.abs(actual - expected) > (tol || 1e-6)) throw new Error((msg || '') + ' expected ~' + expected + ', got ' + actual);
}
function finiteOrNull(x, msg) {
  if (x !== null && !(typeof x === 'number' && isFinite(x))) throw new Error((msg || '') + ' not finite: ' + x);
}

var n = 0;
function item(name, score, extra) {
  var it = { id: 'i' + (++n), name: name, status: score == null ? 'pending' : 'graded', score: score == null ? null : score, adjustments: [] };
  for (var k in extra) it[k] = extra[k];
  return it;
}
function course(cats, extra) {
  var c = { id: 'c' + (++n), termId: 't1', name: 'Test', mode: 'weighted', rounding: { threshold: 5 }, categories: cats, adjustments: [] };
  for (var k in extra) c[k] = extra[k];
  return c;
}
function cat(id, weight, items) { return { id: id, name: id, weight: weight, items: items || [] }; }

console.log('Rounding');
test('rule .5: 8.49 -> 8, 8.50 -> 9, 9.49 -> 9, 9.50 -> 10', function () {
  eq(G.roundFinal(8.49, 5), 8); eq(G.roundFinal(8.5, 5), 9); eq(G.roundFinal(9.49, 5), 9); eq(G.roundFinal(9.5, 5), 10);
});
test('rule .6: 8.59 -> 8, 8.60 -> 9, 8.5 -> 8', function () {
  eq(G.roundFinal(8.59, 6), 8); eq(G.roundFinal(8.6, 6), 9); eq(G.roundFinal(8.5, 6), 8);
});
test('floating-point noise at the threshold still rounds up', function () {
  eq(G.roundFinal(8.4999999999, 5), 9);
  eq(G.roundFinal(0.1 * 3 * 10 + 5.5, 5), 9); // 8.500000000000002
  eq(G.roundFinal((0.7 + 0.1) * 10 + 0.6, 6), 9); // 8.6 via 7.999999999999999 + 0.6
  eq(G.roundFinal(10, 5), 10); eq(G.roundFinal(0, 5), 0);
});
test('display: two decimals, never a misleading one', function () {
  eq(G.fmtRaw(9.6549, 5), '9.65');
  eq(G.fmtRaw(9.4975, 5), '9.498');
  eq(G.fmtRaw(8.5, 5), '8.50');
  eq(G.fmtAvg(9.4975), '9.49');
  eq(G.fmtAvg(64 / 7), '9.14');
  eq(G.fmtAvg(null), '–');
});

console.log('Needed grade');
test('minimum raw for a 9: 8.50 under .5, 8.60 under .6; a 10 needs 9.5 / 9.6', function () {
  eq(G.minRawFor(9, 5), 8.5); eq(G.minRawFor(9, 6), 8.6); eq(G.minRawFor(10, 5), 9.5); eq(G.minRawFor(10, 6), 9.6);
});
test('needed average on the pending weight', function () {
  // 80% graded at 9.0 (7.2 points); for a 9 (8.5) need (8.5 - 7.2) / 0.2 = 6.5 on the rest
  var c = course([cat('a', 80, [item('x', 9)]), cat('b', 20, [item('p', null)])]);
  var need = G.neededForFinal(c, 9);
  eq(need.status, 'needed'); near(need.average, 6.5);
  eq(G.neededForFinal(c, 10).status, 'impossible'); near(G.neededForFinal(c, 10).average, 11.5);
});
test('needed: secured and impossible', function () {
  var c = course([cat('a', 80, [item('x', 10)]), cat('b', 20, [item('p', null)])]);
  eq(G.neededForFinal(c, 8).status, 'secured');
  var low = course([cat('a', 80, [item('x', 5)]), cat('b', 20, [item('p', null)])]);
  eq(G.neededForFinal(low, 10).status, 'impossible');
});

console.log('Weighted courses');
test('needed on one pending item, others at your average', function () {
  // 60% graded at 9; two pending items of 20% each. Expected-case average = 9.
  // For a 9 (8.5): 540 + 20*9 + 20*x >= 850 -> x >= 6.5. For a 10 (9.5): x >= 11.5 -> impossible.
  var c = course([cat('a', 60, [item('x', 9)]), cat('b', 40, [item('p1', null), item('p2', null)])]);
  var p1 = c.categories[1].items[0].id;
  var n9 = G.neededOnItem(c, p1, 9);
  eq(n9.status, 'needed'); near(n9.score, 6.5);
  eq(G.neededOnItem(c, p1, 10).status, 'impossible');
  near(G.neededOnItem(c, p1, 8).score, 1.5);
  eq(G.neededOnItem(c, p1, 7).status, 'secured');
  eq(G.neededOnItem(c, 'nope', 9).status, 'na');
});


test('grade so far is normalized by the graded weight', function () {
  var c = course([cat('hw', 30, [item('h1', 10), item('h2', 9)]), cat('ex', 50, [item('e1', 8)]), cat('fp', 20, [])]);
  var r = G.computeCourse(c);
  near(r.gradedWeight, 80); near(r.earned, 30 * 9.5 + 50 * 8); near(r.soFar, (285 + 400) / 80);
  near(r.best, (685 + 200) / 100); near(r.worst, 6.85); near(r.expected, (685 + 20 * (685 / 80)) / 100);
});
test('custom item weights within a category (two exams at 30%)', function () {
  var c = course([cat('ex', 60, [item('e1', 9, { weight: 30 }), item('e2', null, { weight: 30 })]), cat('pr', 40, [item('p', 10)])]);
  var r = G.computeCourse(c);
  near(r.gradedWeight, 70); near(r.pendingWeight, 30); near(r.soFar, (270 + 400) / 70);
});
test('x out of y converts to 0-10', function () {
  var s = G.parseScore('17/20'); near(s.score, 8.5); eq(s.points, 17); eq(s.max, 20);
  near(G.parseScore('8,9').score, 8.9); near(G.parseScore('89%').score, 8.9);
  eq(G.parseScore('11'), null); eq(G.parseScore('abc'), null); eq(G.parseScore(''), null);
  var c = course([cat('a', 100, [item('x', null, { status: 'graded', points: 45, max: 50 })])]);
  near(G.computeCourse(c).soFar, 9);
});
test('owed points only count once confirmed', function () {
  var owed = [{ id: 'a', label: '+1 owed', points: 1, confirmed: false }];
  var c = course([cat('a', 100, [item('x', 8, { adjustments: owed })])]);
  var r = G.computeCourse(c);
  near(r.soFar, 8); near(r.withOwed, 9);
  owed[0].confirmed = true;
  near(G.computeCourse(c).soFar, 9);
  var capped = course([cat('a', 100, [item('x', 9.5, { adjustments: [{ id: 'b', points: 1, confirmed: true }] })])]);
  near(G.computeCourse(capped).soFar, 10);
});
test('expected case uses the course average or a number you set', function () {
  var c = course([cat('a', 50, [item('x', 8)]), cat('b', 50, [])]);
  near(G.computeCourse(c).expected, 8);
  c.expectedPending = 10;
  near(G.computeCourse(c).expected, 9);
});
test('alternative weight split and whether the rounded final changes', function () {
  var c = course([cat('ex', 80, [item('e', 10)]), cat('hw', 20, [item('h', 6)])], { altWeights: { ex: 90, hw: 10 } });
  var a = G.computeCourse(c), b = G.computeCourse(c, { weights: c.altWeights });
  near(a.expected, 9.2); near(b.expected, 9.6);
  eq(a.expectedFinal, 9); eq(b.expectedFinal, 10);
});
test('quick category entry', function () {
  var cats = G.parseCategories('Exams 60% / Homework 40');
  eq(cats.length, 2); eq(cats[0].name, 'Exams'); eq(cats[0].weight, 60); eq(cats[1].weight, 40);
  eq(G.parseCategories('Exercises+Homework 30, Exams 50, Final project 20').length, 3);
});
test('single-grade course is an estimate with a range', function () {
  var c = { id: 's', termId: 't1', mode: 'single', rounding: { threshold: 5 }, single: { expected: 9, low: 8.6, high: 9.8 }, adjustments: [] };
  var r = G.computeCourse(c);
  eq(r.estimate, true); eq(r.expectedFinal, 9); eq(r.worstFinal, 9); eq(r.bestFinal, 10);
});

console.log('Cumulative and tiers');
function finished(grade, termId) { return { id: 'f' + (++n), termId: termId || 't1', mode: 'single', done: true, posted: grade, rounding: { threshold: 5 }, adjustments: [] }; }
test('cumulative = sum of rounded finals / count, unrounded', function () {
  var data = { settings: Store.defaultSettings(), terms: [{ id: 't1' }], courses: [8, 10, 9, 10, 8, 9, 10].map(function (g) { return finished(g); }) };
  var s = G.summarize(data);
  near(s.official, 64 / 7); eq(G.fmtAvg(s.official), '9.14');
});
test('9.47 does not reach a 9.5 tier', function () {
  // 100 courses summing to 947
  var grades = []; for (var i = 0; i < 100; i++) grades.push(i < 47 ? 10 : 9);
  var settings = Store.defaultSettings();
  var data = { settings: settings, terms: [{ id: 't1' }], courses: grades.map(function (g) { return finished(g); }) };
  var s = G.summarize(data);
  near(s.official, 9.47);
  var honors = s.tiers.filter(function (t) { return t.id === 'honors'; })[0];
  eq(honors.status, 'out');
  eq(s.tiers.filter(function (t) { return t.id === 'ideal'; })[0].status, 'secured');
});
test('needed average across remaining courses and 9s you can afford', function () {
  var settings = Store.defaultSettings(); settings.totalCourses = 10;
  var data = { settings: settings, terms: [{ id: 't1' }], courses: [10, 10, 10, 10, 9].map(function (g) { return finished(g); }) };
  var s = G.summarize(data);
  eq(s.remaining, 5); eq(s.future, 5);
  var honors = s.tiers.filter(function (t) { return t.id === 'honors'; })[0];
  near(honors.neededAverage, (95 - 49) / 5);  // 9.2
  eq(honors.ninesAffordable, 4);              // 49 + 46 = 95 -> 9.5 exactly
  var goal = s.tiers.filter(function (t) { return t.id === 'goal'; })[0];
  eq(goal.ninesAffordable, 5);
});
test('a summer course moves a course out of the future pool, total stays', function () {
  var settings = Store.defaultSettings(); settings.totalCourses = 10;
  var base = { settings: settings, terms: [{ id: 't1' }, { id: 's1' }], courses: [finished(10)] };
  eq(G.summarize(base).future, 9);
  base.courses.push(finished(10, 's1'));
  var s = G.summarize(base);
  eq(s.future, 8); eq(s.denominator, 10);
});
test('pass/fail courses are left out', function () {
  var c = finished(6); c.counts = false;
  var data = { settings: Store.defaultSettings(), terms: [{ id: 't1' }], courses: [finished(10), c] };
  near(G.summarize(data).official, 10);
});

console.log('Empty data');
test('nothing divides by zero with no data at all', function () {
  var s = G.summarize(Store.freshData());
  eq(s.official, null); eq(s.projected, null); eq(s.denominator, 0);
  s.tiers.forEach(function (t) { eq(t.status, 'none'); finiteOrNull(t.neededAverage); });
});
test('a term with no courses, a course with no categories, items all pending', function () {
  var data = Store.freshData();
  data.terms.push({ id: 't1', planned: 3 });
  var s = G.summarize(data);
  eq(s.future, 3); finiteOrNull(s.projected); eq(s.official, null);
  eq(G.termAverage(data, 't1').average, null);
  var empty = G.computeCourse(course([]));
  eq(empty.soFar, null); eq(empty.expected, null); eq(empty.final, null);
  var pend = G.computeCourse(course([cat('a', 100, [item('x', null)])]));
  eq(pend.soFar, null); near(pend.best, 10); near(pend.worst, 0); eq(pend.expected, null);
  var withAssumed = G.computeCourse(course([cat('a', 100, [item('x', null)])]), { assumed: 9 });
  near(withAssumed.expected, 9);
  var zero = G.computeCourse(course([cat('a', 0, [item('x', 9)])]));
  eq(zero.soFar, null); eq(zero.final, null);
  eq(G.neededForFinal(course([]), 9).status, 'na');
});

console.log('Storage');
test('fresh data has the current schema and default tiers', function () {
  var d = Store.freshData();
  eq(d.schemaVersion, Store.SCHEMA_VERSION); eq(d.settings.tiers.length, 4); eq(d.settings.totalCourses, null);
});
test('unversioned data migrates to the current schema', function () {
  var d = Store.migrate({ terms: [{ id: 't1', label: 'S1' }], courses: [{ id: 'c1', termId: 't1', name: 'X', mode: 'single', posted: 9 }] });
  eq(d.schemaVersion, Store.SCHEMA_VERSION); eq(d.courses.length, 1); eq(d.courses[0].rounding.threshold, 5);
});
test('a backup from a newer app version is refused, not mangled', function () {
  var threw = false;
  try { Store.migrate({ schemaVersion: 999, terms: [], courses: [] }); } catch (e) { threw = e.message === 'newer-version'; }
  eq(threw, true);
});
test('backup round trip', function () {
  var d = Store.freshData(); d.terms.push({ id: 't1', label: 'S1', kind: 'semester' });
  var back = Store.parseBackup(Store.exportBackup(Store.normalize(d)));
  eq(back.terms.length, 1); eq(back.onboarded, true);
  var bad = false; try { Store.parseBackup('{"hello":1}'); } catch (e) { bad = e.message === 'not-backup'; }
  eq(bad, true);
});

var privateTests = path.join(__dirname, '..', '..', 'ace-it-private', 'seed.test.js');
if (fs.existsSync(privateTests)) {
  console.log('Your data (private, outside the repo)');
  require(privateTests)({ test: test, eq: eq, near: near, G: G, Store: Store });
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
