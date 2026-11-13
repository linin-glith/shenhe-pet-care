/**
 * THE ONE-BUSINESS-DAY PROMISE, IN ONE PLACE.
 *
 * WHY IT IS A FILE AND NOT A FUNCTION IN A COMPONENT
 *
 * The promise is made to the buyer in the enquiry form - "we will reply
 * by Thursday, 18:00 China Standard Time" - and it is judged against the
 * buyer on the staff desk - "this row is overdue". Those are the same
 * promise, so they have to be the same rule.
 *
 * They were not, and the drift was not subtle. The form skipped only
 * Sunday and promised 18:00 on the next working day. The desk skipped
 * Saturday as well, and judged the promise at the same clock time the
 * enquiry arrived. So a buyer who wrote at 10:00 on Wednesday was told
 * "Thursday, 18:00", and the desk called the row late on Thursday at
 * 10:00 - eight hours before the promise the buyer had actually been
 * given. A desk that judges a promise nobody made is worse than no
 * clock at all, because it produces false alarms that teach the team to
 * ignore the real ones.
 *
 * The desk's version had one more thing wrong with it, which the site
 * itself says out loud: it closed Saturday, while the published hours
 * are "Mon-Sat, 09:00-18:00 China Standard Time" (lib/shenhe.config.ts,
 * response.hours). Saturday is a working day for the people answering.
 *
 * THE RULE, EXACTLY
 *
 *   1. The working week is Monday to Saturday, because that is what the
 *      site publishes. Sunday is the only day the desk is closed.
 *   2. An enquiry is due at 18:00 China Standard Time on the next
 *      working day. China Standard Time is UTC+8 with no daylight
 *      saving, so the offset is a constant and the same arithmetic gives
 *      the same answer everywhere - in the browser, on the server, and in
 *      whatever timezone the desk is sitting in.
 *   3. So a Friday arrival is due on Saturday, a Saturday arrival on
 *      Monday, and a Sunday arrival on Monday.
 */

/** China Standard Time. UTC+8, no daylight saving. */
export const CST_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The hour the desk closes, China Standard Time. */
const CLOSE_HOUR = 18;

/**
 * The instant a value is, in milliseconds. Null when it is not a time.
 *
 * The same parse everywhere, so a value that the desk can read is a
 * value the form can read and vice versa.
 */
export function toMs(value: string | number | Date | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Is this day a day the desk is open?
 *
 * Sunday is the only day the desk is closed. The published hours run
 * Monday to Saturday, so Saturday is a working day.
 */
export function isWorkingDay(cstWeekday: number): boolean {
  return cstWeekday !== 0; // 0 = Sunday
}

/**
 * When the promise runs out, for an enquiry that arrived at this instant.
 *
 * The rule: 18:00 China Standard Time on the next working day.
 */
export function nextWorkingDayDeadline(anchorMs: number): number {
  // Shift into CST and read the calendar parts off it. The UTC fields of
  // the shifted date ARE the China Standard Time wall clock.
  const cst = new Date(anchorMs + CST_OFFSET_MS);
  const due = new Date(
    Date.UTC(
      cst.getUTCFullYear(),
      cst.getUTCMonth(),
      cst.getUTCDate() + 1,
      CLOSE_HOUR,
      0,
      0,
      0,
    ),
  );
  // Step over the days the desk is closed.
  while (!isWorkingDay(due.getUTCDay())) {
    due.setUTCDate(due.getUTCDate() + 1);
  }
  return due.getTime() - CST_OFFSET_MS;
}

/**
 * The deadline of an enquiry that arrived at the given moment.
 *
 * Null when the arrival is not a time we can read.
 */
export function responseDeadline(
  arrivedAt: string | number | Date | null | undefined,
): number | null {
  const ms = toMs(arrivedAt);
  if (ms === null) return null;
  return nextWorkingDayDeadline(ms);
}

/**
 * Is the promise already broken at this moment?
 */
export function isPastDeadline(
  arrivedAt: string | number | Date | null | undefined,
  now: number = Date.now(),
): boolean {
  const due = responseDeadline(arrivedAt);
  return due !== null && now > due;
}

/**
 * The deadline in the buyer's words: "Thursday, 18:00 China Standard Time".
 *
 * This is what the enquiry form says back to the buyer, so the buyer and
 * the desk are reading the same clock.
 */
export function deadlineLabel(from: Date = new Date()): { day: string; time: string } {
  const due = new Date(nextWorkingDayDeadline(from.getTime()));
  const day = due.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return { day, time: '18:00 China Standard Time' };
}
