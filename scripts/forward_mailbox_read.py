#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read the company mailbox and write down the letters a buyer sent.

WHAT IT DOES
  It reads the INBOX over IMAP, and for every message a BUYER sent - not
  one of our own notices, not a system mail, not a bounce - it writes the
  message down: who it is from, what it is about, and the body, byte for
  byte.

WHY A BUYER'S LETTER IS WORTH FORWARDING
  The back office knows about an enquiry that came through the form. A
  buyer who wrote to the company's address instead is a lead nobody can
  see from the back office at all - and the mailbox that holds it
  translates what it thinks is a foreign message, so the desk reads a
  translation of the buyer instead of the buyer.

WHY IT IS A SEPARATE PIECE
  The node IMAP client written for this lost the untagged lines, so a
  search returned nothing. Python's imaplib reads that protocol
  correctly, and it is already on the server.

WHY IT READS MORE THAN ONE MAILBOX
  The company has more than one address, and a buyer does not know which
  one is live: postmaster@ is the address people try, and a letter that
  landed there used to be invisible to the desk entirely. One reader that
  reads one mailbox cannot fix that, because the letter is in the other
  one.

  So the mailboxes are a list. The first is the account the api sends as;
  the others are named in MAIL_INBOX_EXTRA, as "account|password" pairs
  separated by commas. Every mailbox is read, and one that cannot be
  opened does not stop the others - it is reported and the rest carry on.

  The key of a letter carries the mailbox it came from, because the same
  letter can arrive in two mailboxes (a copy, a forward) and one lead is
  one lead.

WHAT IS NOT FORWARDED
  - our own notices (they are from our own domain)
  - the provider's mail (Aliyun) and the bounces it sends back
  - a letter one of the readers sent us - it would come back to them
  - anything already carrying the forwarded marker

WHERE THE OUTPUT GOES
  One JSON file per letter in the working directory, named after the
  letter's key. The sender reads them and keeps its own ledger of what
  it has already sent, so this can write the same file again without
  anything being sent twice.
"""
import base64
import email
import hashlib
import imaplib
import json
import os
import re
import ssl
import sys
from email.header import decode_header
from email.utils import parseaddr

API_DIR = '/www/wwwroot/shenhe-api'
WORK = '/data/shenhe/forward/mailbox'
os.chdir(API_DIR)


def env():
    out = {}
    for line in open('.env', encoding='utf-8', errors='replace'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


ENV = env()
USER = ENV.get('MAIL_USER', '')
PW = ENV.get('MAIL_PASSWORD', '')
HOST = ENV.get('MAIL_IMAP_HOST', 'imap.qiye.aliyun.com')
READERS = [
    a.strip().lower()
    for raw in (ENV.get('MAIL_NOTICE_TO', ''), ENV.get('MAIL_FORWARD_TO', ''))
    for a in raw.split(',') if a.strip()
]
OUR_DOMAIN = 'shenhezhongke.com'

# THE ADDRESSES A MACHINE ANSWERS FROM.
#
# A DMARC report about our own domain arrived in postmaster@ and the
# reader counted it as a buyer's letter - it would have become a lead
# with a reference, and the desk would have had to read a DMARC report
# as though somebody were asking about pet dental chew.
#
# The local part says who it is. The match is on the START of it, not
# the whole thing, because that is the shape these addresses take:
# noreply-dmarc-support, no-reply-notifications, bounces-1.
MACHINE_SENDER = re.compile(
    r'^(no-?reply|noreply|do-?not-?reply|donotreply|mailer-?daemon|'
    r'bounce|bounces|dmarc-support|postmaster|abuse)',
    re.I,
)


def mailboxes():
    """
    THE MAILBOXES TO READ, IN ORDER.

    The first is the account the api sends as. The rest come from
    MAIL_INBOX_EXTRA, which holds "account|password" pairs separated by
    commas - because a company can have more than one address and a buyer
    does not know which one is live.
    """
    out = []
    if USER and PW:
        out.append((USER, PW))
    for raw in (ENV.get('MAIL_INBOX_EXTRA', '') or '').split(','):
        raw = raw.strip()
        if not raw:
            continue
        parts = raw.split('|')
        if len(parts) != 2 or not parts[0].strip() or not parts[1].strip():
            print('[read] an entry in MAIL_INBOX_EXTRA is not "account|password" - skipped', flush=True)
            continue
        account, password = parts[0].strip(), parts[1].strip()
        if not any(a.lower() == account.lower() for a, _ in out):
            out.append((account, password))
    return out


def decoded(value):
    """
    The subject as text, without losing a character.

    A subject that arrives as an encoded word carries its own charset and
    is decoded by that. A subject that arrives as raw bytes is UTF-8 -
    RFC 6532 says so, and it is what every current client writes.

    Decoding raw bytes as latin-1 instead turns every Chinese character
    into U+FFFD, and the message goes out with the subject ruined.
    """
    if not value:
        return ''
    try:
        parts = decode_header(value)
    except Exception:
        parts = [(value, None)]
    out = []
    for text, charset in parts:
        if isinstance(text, bytes):
            if charset:
                try:
                    out.append(text.decode(charset, 'replace'))
                    continue
                except LookupError:
                    pass
            out.append(text.decode('utf-8', 'replace'))
        else:
            out.append(text)
    return ''.join(out)


def body_of(raw):
    """The body, byte for byte: everything after the header block."""
    i = raw.find(b'\r\n\r\n')
    if i >= 0:
        return raw[i + 4:]
    i = raw.find(b'\n\n')
    if i >= 0:
        return raw[i + 2:]
    return b''


def text_of(msg, raw):
    """
    The buyer's words, as text.

    The body kept byte for byte is what gets forwarded. This is the same
    body read as text, and it is what goes into the lead: the desk reads
    what the buyer wrote, not a summary of it, and it cannot be answered
    from a summary.
    """
    if not msg.is_multipart():
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode(msg.get_content_charset() or 'utf-8', 'replace')
        return str(msg.get_payload())
    for part in msg.walk():
        if part.get_content_type() == 'text/plain':
            payload = part.get_payload(decode=True)
            if payload:
                return payload.decode(part.get_content_charset() or 'utf-8', 'replace')
    return body_of(raw).decode('utf-8', 'replace')


def is_a_buyer_letter(msg, raw):
    """
    IS THIS A LETTER FROM A BUYER?

    The rules are about who it is from, not about what it says:
      - not from our own domain: that is our own notice
      - not from the provider: that is system mail and bounces
      - not from one of the readers: it would come back to them
      - not from a machine that answers on its own: a DMARC report, a
        delivery daemon, a no-reply notification
      - not already carrying the forwarded marker
    """
    frm = msg.get('From', '')
    address = parseaddr(frm)[1].lower()
    if not address:
        return False, 'no sender'
    if address.endswith('@' + OUR_DOMAIN):
        return False, 'our own notice'
    domain = address.split('@')[-1]
    if domain.endswith('aliyun.com') or domain.endswith('alibaba.com'):
        return False, 'the provider'
    if address in READERS:
        return False, 'a reader wrote it'
    if MACHINE_SENDER.match(address):
        return False, 'a machine answer'
    if msg.get('X-Shenhe-Forwarded-From'):
        return False, 'already forwarded'
    if msg.get('Auto-Submitted') or msg.get('X-Failed-Recipients'):
        return False, 'a machine answer'
    return True, address


def slug(value):
    return re.sub(r'[^A-Za-z0-9._-]', '_', value)[:120]


def read_mailbox(account, password):
    """
    READ ONE MAILBOX, AND WRITE DOWN THE LETTERS IN IT.

    A mailbox that cannot be opened is reported and does not stop the
    others: one locked mailbox must not cost the desk the letters that
    arrived in a working one.
    """
    try:
        m = imaplib.IMAP4_SSL(HOST, 993, ssl_context=ssl.create_default_context(), timeout=40)
        m.login(account, password)
    except Exception as e:
        print('[read] %s cannot be opened: %s: %s' % (account, type(e).__name__, str(e)[:140]), flush=True)
        return 0, 0

    kept = 0
    total = 0
    try:
        m.select('"INBOX"')
        typ, ids = m.search(None, 'ALL')
        ids = ids[0].split() if ids and ids[0] else []
        total = len(ids)
        print('[read] %s holds %d message(s)' % (account, total), flush=True)
        for num in ids:
            typ, full = m.fetch(num, '(RFC822)')
            if not full or not full[0]:
                continue
            raw = full[0][1]
            msg = email.message_from_bytes(raw)
            ok, why = is_a_buyer_letter(msg, raw)
            if not ok:
                continue
            address = parseaddr(msg.get('From', ''))[1]
            name = parseaddr(msg.get('From', ''))[0]
            # The key identifies the letter and not the delivery: the same
            # letter can arrive twice (a delivery check and the real thing).
            # The mailbox is part of it, because the same letter can be in
            # two mailboxes and one lead is one lead.
            key = (msg.get('Message-ID') or '').strip()
            if not key:
                key = 'sha1-' + hashlib.sha1(raw).hexdigest()[:20]
            key = slug(account) + '__' + slug(key)
            record = {
                'key': key,
                'mailbox': account,
                'from': address,
                'from_name': name,
                'subject': decoded(msg.get('Subject', '')),
                'content_type': msg.get('Content-Type', 'text/plain; charset=UTF-8'),
                'content_transfer_encoding': msg.get('Content-Transfer-Encoding', ''),
                'date': msg.get('Date', ''),
                'message_id': msg.get('Message-ID', ''),
                'text': text_of(msg, raw),
                'body_b64': base64.b64encode(body_of(raw)).decode('ascii'),
            }
            with open(os.path.join(WORK, key + '.json'), 'w', encoding='utf-8') as f:
                json.dump(record, f, ensure_ascii=False)
            kept += 1
            print('[read]   %s  %s  %s' % (key[:44], address[:34], record['subject'][:44]), flush=True)
    finally:
        try:
            m.logout()
        except Exception:
            pass
    return total, kept


def main():
    boxes = mailboxes()
    if not boxes:
        print('[read] the mailbox is not configured', flush=True)
        return 1
    os.makedirs(WORK, exist_ok=True)

    print('[read] reading %d mailbox/mailboxes: %s' % (
        len(boxes), ', '.join(a for a, _ in boxes)), flush=True)
    kept = 0
    for account, password in boxes:
        total, k = read_mailbox(account, password)
        kept += k
    print('[read] %d letter(s) from a buyer' % kept, flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
