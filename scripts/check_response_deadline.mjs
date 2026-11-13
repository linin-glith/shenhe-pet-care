/**
 * THE ONE-BUSINESS-DAY PROMISE, CHECKED.
 *
 * WHY THIS IS A GATE AND NOT A NOTE
 *
 * The site promises, in a dozen places and in the enquiry form itself,
 * that a sales manager answers within one business day. The promise is
 * also a deadline, and a deadline is arithmetic - which means two
 * people can do the arithmetic two different ways.
 *
 * They did. The form skipped only Sunday and promised 18:00 on the next
 * working day; the staff desk skipped Saturday as well - which the
 * site's own published hours say is a working day - and judged the
 * promise at the same clock time the enquiry arrived. So a buyer who
 * wrote at 10:00 on Wednesday was told "Thursday, 18:00", and the desk
 * called the row late on Thursday at 10:00: eight hours before the
 * promise the buyer had actually been given.
 *
 * A desk that judges a promise nobody made is worse than no clock at
 * all, because false alarms teach the team to ignore the real ones.
 *
 * WHAT IS CHECKED
 *
 *   1. The rule itself: 18:00 China Standard Time on the next working
 *      day, with Sunday the only day the desk is closed. The working
 *      week is read from the site's own published hours, so if those
 *      hours change, this check has to change with them.
 *   2. That there is ONE rule. The form and the desk must both read the
 *      shared file, and neither may keep a copy.
 *   3. That the two sides agree - the deadline the buyer is told and the
 *      deadline the desk judges are the same instant.
 *
 * It runs the shipped rule, not a copy of it: the import below is the
 * file the site ships.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  nextWorkingDayDeadline,
  responseDeadline,
  isPastDeadline,
  deadlineLabel,
} from '../lib/response-deadline.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..');

let failures = 0;

function ok(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}`);
    console.error(`      expected: ${expected}`);
    console.error(`      actual  : ${actual}`);
  }
}

function okThat(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}${detail ? ` - ${detail}` : ''}`);
  }
}

/* ------------------------------------------------------------------ */
/* 1. the rule                                                         */
/* ------------------------------------------------------------------ */

/**
 * A China Standard Time wall clock, as the site reads it.
 *
 * China Standard Time is UTC+8 with no daylight saving, so the offset
 * is a constant and this is exact in both directions.
 */
const CST = 8 * 60 * 60 * 1000;

function cst(y, m, d, hh = 10, mm = 0, ss = 0) {
  return Date.UTC(y, m - 1, d, hh, mm, ss) - CST;
}

function parts(ms) {
  const p = new Date(ms + CST);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    y: p.getUTCFullYear(),
    m: pad(p.getUTCMonth() + 1),
    d: pad(p.getUTCDate()),
    hh: pad(p.getUTCHours()),
    mm: pad(p.getUTCMinutes()),
    wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][p.getUTCDay()],
  };
}

function due(anchorMs) {
  const p = parts(nextWorkingDayDeadline(anchorMs));
  return `${p.wd} ${p.y}-${p.m}-${p.d} ${p.hh}:${p.mm}`;
}

console.log('=== the rule: 18:00 CST on the next working day, Sunday closed ===');
ok('a Wednesday arrival is due on Thursday', due(cst(2026, 10, 28)), 'Thu 2026-10-29 18:00');
ok('a Thursday arrival is due on Friday', due(cst(2026, 11, 5, 9)), 'Fri 2026-11-06 18:00');
ok('a Friday arrival is due on Saturday - the desk works Saturday', due(cst(2026, 11, 6)), 'Sat 2026-11-07 18:00');
ok('a Saturday arrival is due on Monday', due(cst(2026, 11, 7, 19, 55)), 'Mon 2026-11-09 18:00');
ok('a Sunday arrival is due on Monday', due(cst(2026, 11, 8)), 'Mon 2026-11-09 18:00');
ok('a late-evening arrival is still due the next working day', due(cst(2026, 11, 9, 23, 59)), 'Tue 2026-11-10 18:00');
ok('an after-midnight arrival is due the next working day', due(cst(2026, 11, 10, 0, 0)), 'Wed 2026-11-11 18:00');

console.log('');
console.log('=== the published hours are the rule ===');
const config = readFileSync(join(SITE, 'lib', 'shenhe.config.ts'), 'utf8');
const hours = /hours:\s*'([^']+)'/.exec(config);
okThat(
  'the site still publishes working hours the rule can be read from',
  Boolean(hours),
  hours ? '' : 'no hours: line in lib/shenhe.config.ts',
);
if (hours) {
  const published = hours[1];
  okThat('the published hours include Saturday', published.includes('Sat'), published);
  okThat('the published hours stop at 18:00', published.includes('18:00'), published);
  okThat('the published hours do not include Sunday', !published.includes('Sun'), published);
}

console.log('');
console.log('=== there is one rule, not two ===');
const form = readFileSync(join(SITE, 'components', 'v2', 'InquiryForm.tsx'), 'utf8');
const desk = readFileSync(join(SITE, 'components', 'v2', 'EnquiryWorkbench.tsx'), 'utf8');

/*
 * A COPY, WHATEVER IT IS CALLED.
 *
 * The first version of these three checks looked for one identifier:
 * `function replyDeadline(` in the form, `CLOSED_WEEKDAYS` in the desk
 * and `export function responseDeadline(` in the desk. Two of those
 * three names have never existed in this repository - the desk's copy of
 * the rule was never written down, only the form's was - so the checks
 * passed because the name was absent, not because a copy was absent. A
 * check that names a thing the code never contained is a check that
 * cannot fail.
 *
 * So the check is for the arithmetic itself. A file that works out 18:00
 * on a day of its own has a copy of the rule, whatever the function
 * happens to be called.
 */
const RULE_ARITHMETIC = /setUTCHours\(\s*18|getUTCDay\(\)|getDay\(\)/;
const LOCAL_DEFINITION = /function\s+responseDeadline\s*\(/;

okThat('the form reads the shared rule', form.includes("from '@/lib/response-deadline'"));
okThat('the form keeps no copy of it', !RULE_ARITHMETIC.test(form));
okThat('the desk reads the shared rule', desk.includes("from '@/lib/response-deadline'"));
okThat('the desk keeps no copy of it', !RULE_ARITHMETIC.test(desk));
okThat('the desk does not redefine the deadline', !LOCAL_DEFINITION.test(desk));

console.log('');
console.log('=== the buyer and the desk read the same clock ===');
const arrived = cst(2026, 11, 7, 19, 55);
ok(
  'the desk deadline is the buyer deadline',
  String(responseDeadline(new Date(arrived))),
  String(nextWorkingDayDeadline(arrived)),
);
okThat(
  'a row is not overdue at the deadline',
  !isPastDeadline(new Date(arrived), nextWorkingDayDeadline(arrived)),
);
okThat(
  'a row is overdue a minute after the deadline',
  isPastDeadline(new Date(arrived), nextWorkingDayDeadline(arrived) + 60000),
);

console.log('');
console.log('=== the production record, judged by the shipped rule ===');
// Vetzcare: arrived Wed 2026-10-28 10:00:19 CST, claimed Mon 2026-11-02
// 09:31:40 CST. This is the one real enquiry the site ever took, and it
// was answered 119.52 hours after it landed.
const vetzcare = cst(2026, 10, 28, 10, 0, 19);
const claimed = cst(2026, 11, 2, 9, 31, 40);
const lateHours = (claimed - vetzcare) / 3600000;
ok('hours from arrival to claim', lateHours.toFixed(2), '119.52');
okThat(
  'it was overdue when it was finally claimed',
  isPastDeadline(new Date(vetzcare), claimed),
);
ok(
  'hours past the promise, judged by the shipped rule',
  ((claimed - nextWorkingDayDeadline(vetzcare)) / 3600000).toFixed(1),
  '87.5',
);

console.log('');
console.log('=== what the buyer is told ===');
const label = deadlineLabel(new Date(cst(2026, 10, 28, 10, 0)));
ok('the hour is the published one', label.time, '18:00 China Standard Time');
okThat('the day names a working day', !label.day.startsWith('Sunday'), label.day);

console.log('');
console.log('=== no page may promise faster than the rule ===');
/*
 * WHY THIS SECTION EXISTS
 *
 * The rule above is arithmetic, and arithmetic was never the part that
 * broke. The words were. Eighteen places on the site told the buyer
 * "1h Quote", "1h Reply", "1h response" - the legacy product pages, the
 * homepage card, the OEM card in lib/shenhe.config.ts and the AI reading
 * files. Every one of them passed the checks above, because those checks
 * compare the form's clock to the desk's clock and never look at what
 * the marketing copy claims.
 *
 * A promise faster than the rule is not a typo. It is a different
 * deadline, and the desk is judged against the slower one, so every
 * enquiry answered between the hour and the business day reads as a
 * failure to a buyer who was told an hour.
 *
 * So the built site itself is scanned: anything that puts an hour count
 * or a same-day promise next to reply/response/quote/answer is a
 * promise the rule does not support. The build runs before this check,
 * so `out/` is what a crawler sees.
 */
{
  const OUT = join(SITE, 'out');
  const FAST = [
    /(?:\b(?:reply|replies|response|respond|quote|quotes|answer|answers|get back)\b[^.<]{0,40}\b\d{1,2}\s?h\b)/i,
    /(?:\b\d{1,2}\s?h\b[^.<]{0,40}\b(?:reply|replies|response|respond|quote|quotes|answer|answers)\b)/i,
    /\bwithin (?:an|the|one) hour\b/i,
    /\bsame[-\s]day (?:reply|response|quote|answer)\b/i,
    /\b(?:reply|response|quote|answer) (?:within |in )?(?:a|one) single hour\b/i,
  ];

  if (!existsSync(OUT)) {
    okThat('the built site is available to scan', false, 'out/ is missing - run the build before the gate');
  } else {
    const walk = (dir, depth = 0) => {
      if (depth > 6) return [];
      let entries = [];
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return [];
      }
      return entries.flatMap((e) => {
        const full = join(dir, e.name);
        if (e.isDirectory()) return walk(full, depth + 1);
        if (!/\.(html|txt|json|xml)$/.test(e.name)) return [];
        return [full];
      });
    };

    const pages = walk(OUT);
    const offenders = [];
    for (const page of pages) {
      let text = '';
      try {
        text = readFileSync(page, 'utf8');
      } catch {
        continue;
      }
      for (const rx of FAST) {
        const hit = rx.exec(text);
        if (hit) {
          const where = hit.index > 0 ? text.slice(Math.max(0, hit.index - 40), hit.index + 80) : hit[0];
          offenders.push(`${page.slice(OUT.length + 1).replace(/\\/g, '/')}: ${where.replace(/\s+/g, ' ').trim().slice(0, 120)}`);
          break;
        }
      }
    }

    okThat(`the built site was scanned (${pages.length} files)`, pages.length > 0, 'out/ produced no pages to read');
    okThat(`no promise outruns the rule across ${pages.length} built files`, offenders.length === 0, offenders.slice(0, 3).join(' | '));
    if (offenders.length) {
      console.error(`      ${offenders.length} file(s) still promise an hour:`);
      for (const o of offenders.slice(0, 12)) console.error(`        ${o}`);
    }
  }
}

console.log('');
if (failures) {
  console.error(`FAIL  the one-business-day promise is checked and it does not hold: ${failures} problem(s)`);
  process.exit(1);
}
console.log('the promise the buyer is given and the promise the desk judges are one promise');
