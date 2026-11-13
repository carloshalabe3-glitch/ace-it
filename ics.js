/* Ace It calendar files. Pure functions only: no DOM, no storage.
   Builds one all-day event as .ics text (RFC 5545) for the phone's own Calendar.
   Loads in the browser as window.Ics and in Node with require('./ics.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ics = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Text values: backslash, semicolon and comma are escaped, line breaks become \n.
  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function byteLength(ch) {
    var c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // No line may be longer than 75 bytes: longer ones continue on the next line after a
  // space. Whole characters only, so an accent or emoji is never cut in half.
  function fold(line) {
    var out = [], cur = '', bytes = 0;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      var code = line.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < line.length) { ch += line[i + 1]; i++; }
      var b = byteLength(ch);
      var limit = out.length ? 74 : 75;   // continuation lines start with a space
      if (bytes + b > limit) { out.push(cur); cur = ''; bytes = 0; }
      cur += ch; bytes += b;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  function isDayKey(key) { return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key); }
  function dayStamp(key) { return key.replace(/-/g, ''); }
  function nextDayStamp(key) {
    var p = key.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + 1));
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
  }
  function utcStamp(date) {
    return date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' +
      pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + 'Z';
  }

  // o: { uid, date: 'YYYY-MM-DD', summary, description?, now?: Date }
  // One all-day event with a reminder at 9:00 the morning before. The same uid always
  // means the same event, and a later file carries a higher SEQUENCE, so adding it again
  // updates the event in calendars that support that instead of making a second one.
  function eventFile(o) {
    if (!o || !o.uid || !isDayKey(o.date) || !o.summary) return null;
    var now = o.now instanceof Date ? o.now : new Date();
    var stamp = utcStamp(now);
    var sequence = Math.max(0, Math.floor((now.getTime() - Date.UTC(2025, 0, 1)) / 60000));
    var summary = escapeText(o.summary);
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ace It//Grades//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + escapeText(o.uid),
      'DTSTAMP:' + stamp,
      'LAST-MODIFIED:' + stamp,
      'SEQUENCE:' + sequence,
      'DTSTART;VALUE=DATE:' + dayStamp(o.date),
      'DTEND;VALUE=DATE:' + nextDayStamp(o.date),
      'SUMMARY:' + summary
    ];
    if (o.description) lines.push('DESCRIPTION:' + escapeText(o.description));
    lines.push(
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + summary,
      'TRIGGER:-PT15H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  // "Exam 3" -> "exam-3.ics"
  function fileName(title) {
    var slug = String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return (slug || 'event') + '.ics';
  }

  return { escapeText: escapeText, fold: fold, eventFile: eventFile, fileName: fileName };
});
