// Clean up the rows the probes left in the local demo database.
//
// The contract probes and the behaviour regression create rows on purpose -
// a quotation, a shipment, a payment - and the CSRF check used to write one
// inquiry with an empty message. Those rows are not data; they are litter
// in a database the desk reads.
//
// This removes only what the probes made: inquiries with no message, and
// the quotations and shipments stamped with the probe's own markers. It
// touches nothing that came from a real enquiry.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DB = path.join(HERE, '..', 'server', 'data', 'shenhe.db');
const db = new DatabaseSync(DB);

function run(sql, ...args) {
  return db.prepare(sql).run(...args);
}

const before = {
  inquiries: db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,
  quotes: db.prepare('SELECT COUNT(*) AS n FROM quotes').get().n,
  shipments: db.prepare('SELECT COUNT(*) AS n FROM shipments').get().n,
  payments: db.prepare('SELECT COUNT(*) AS n FROM payments').get().n,
};

const empty = run(
  "DELETE FROM inquiries WHERE (message IS NULL OR TRIM(message) = '')");
const probeQuotes = run(
  "DELETE FROM quote_lines WHERE quote_id IN (SELECT id FROM quotes WHERE quote_no LIKE 'QT-%' AND company_name IS NULL AND subtotal = 0 AND total = 0)");
const quotes = run(
  "DELETE FROM quotes WHERE quote_no LIKE 'QT-%' AND company_name IS NULL AND subtotal = 0 AND total = 0");
const items = run(
  "DELETE FROM shipment_items WHERE shipment_id IN (SELECT id FROM shipments WHERE shipment_no LIKE 'SH-%' AND tracking_no IS NULL AND carrier IS NULL)");
const shipments = run(
  "DELETE FROM shipments WHERE shipment_no LIKE 'SH-%' AND tracking_no IS NULL AND carrier IS NULL");
const activities = run(
  "DELETE FROM activities WHERE kind IN ('quote','shipment','payment') AND title LIKE '%QT-%' OR title LIKE '%SH-%' OR title LIKE '%PM-%'");

const after = {
  inquiries: db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,
  quotes: db.prepare('SELECT COUNT(*) AS n FROM quotes').get().n,
  shipments: db.prepare('SELECT COUNT(*) AS n FROM shipments').get().n,
  payments: db.prepare('SELECT COUNT(*) AS n FROM payments').get().n,
};

console.log('removed  inquiries %d  quote_lines %d  quotes %d  shipment_items %d  shipments %d  activities %d',
  empty.changes, probeQuotes.changes, quotes.changes, items.changes, shipments.changes, activities.changes);
console.log('before', JSON.stringify(before));
console.log('after ', JSON.stringify(after));
db.close();
