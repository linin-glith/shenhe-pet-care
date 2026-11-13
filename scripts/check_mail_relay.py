# -*- coding: utf-8 -*-
"""The mail relay gate.

TWO THINGS THAT BROKE, AND COULD BREAK AGAIN

1. THE MESSAGE AND THE PERIOD THAT ENDS IT.
   The api implements its own SMTP client rather than using a library.
   It sent the message and then sent the period - the line that ends a
   DATA block - as the NEXT command. But the client sends one command
   per reply it receives, so after the message it waited for a reply the
   server was not going to give until the period arrived. Neither side
   moved, and every send timed out after twenty-five seconds.

   It was never noticed because no send had ever got past the
   credentials: a module that has never sent a mail cannot have its
   sending proven by reading it.

2. WHERE A REPLY GOES.
   The mail server will only let an account send as itself, so the From
   address is the sending account - and a reply to that address would
   land in a mailbox nobody reads. The reply address has to be a
   separate thing, and it has to be the address the site publishes for
   buyers. The quotation mail promises the buyer that a reply "will
   reach the sales manager who wrote it"; a promise the site cannot keep
   is worse than no promise.

    python scripts/check_mail_relay.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIL = os.path.join(ROOT, "server-pg", "mail.js")

failures = []


def check(label, ok, detail=""):
    print("  %s  %s%s" % ("PASS" if ok else "FAIL", label, "" if ok else "   " + detail))
    if not ok:
        failures.append(label)


if not os.path.exists(MAIL):
    print("  FAIL  server-pg/mail.js is missing")
    sys.exit(1)

text = io.open(MAIL, encoding="utf-8", errors="replace").read()

# ---------------------------------------------------------------------------
# 1. The period travels with the message.
# ---------------------------------------------------------------------------
data_block = re.search(r"const commands = \[(.*?)\];", text, re.S)
if not data_block:
    check("the command list is readable", False, "no 'const commands = [' in server-pg/mail.js")
else:
    block = data_block.group(1)
    # the DATA payload must carry the period, and the period must not also
    # be a command of its own
    payload = re.search(r"'DATA',\s*(.*?),\s*'QUIT',", block, re.S)
    carries = bool(payload and re.search(r"CRLF\s*\+\s*'\.'", payload.group(1)))
    alone = bool(re.search(r"^\s*'\.',\s*$", block, re.M))
    check("the message and the period that ends it travel together",
          carries and not alone,
          "the DATA payload does not carry the period" if not carries
          else "the period is still a command of its own")

# ---------------------------------------------------------------------------
# 2. A reply has somewhere to go.
# ---------------------------------------------------------------------------
check("the configuration carries a reply address",
      bool(re.search(r"replyTo:\s*process\.env\.MAIL_REPLY_TO", text)),
      "there is no MAIL_REPLY_TO - a reply would go to the sending account")

check("the Reply-To header falls back to it",
      bool(re.search(r"Reply-To:\s*'\s*\+\s*\(\s*replyTo\s*\|\|\s*cfg\.replyTo", text)),
      "the Reply-To header does not use the configured reply address")

check("the desk's notice replies to the buyer",
      bool(re.search(r"replyTo:\s*\(body\s*&&\s*body\.email\)", text)),
      "the notice the desk receives does not carry the buyer's address")

# ---------------------------------------------------------------------------
# 3. The notice reaches a second mailbox.
# ---------------------------------------------------------------------------
# WHY
#   The company mailbox translates what it thinks is a foreign message, so a
#   notice that is part Chinese and part English comes back with the BUYER's
#   own sentence translated along with the labels. The desk then reads a
#   translation of the buyer instead of the buyer - which is exactly the
#   thing the notice exists to prevent.
#
#   So the notice goes to a second mailbox as well: the same mail, to a
#   mailbox that shows it as it was sent. That list is MAIL_NOTICE_TO, and
#   it is part of the recipient list - not a separate send that nobody
#   would notice failing.
#
#   This check cannot see the server's .env, so it checks the thing it CAN
#   see: that the code merges the copy list into the recipients. If someone
#   drops that line, the copy stops and this gate says so.
check("the notice also goes to the copy list",
      bool(re.search(r"MAIL_NOTICE_TO", text)),
      "there is no MAIL_NOTICE_TO - the enquiry notice reaches only one mailbox")

recipients = re.search(r"export function inquiryRecipients\(\)\s*\{([\s\S]*?)\n\}", text)
check("the copy list is merged into the recipients",
      bool(recipients and "MAIL_NOTICE_TO" in recipients.group(1)),
      "inquiryRecipients() does not read the copy list")

# ---------------------------------------------------------------------------
# 4. One sender, one set of rules.
# ---------------------------------------------------------------------------
# WHY
#   The forwarder used to carry its own SMTP client and build its own
#   headers. Gmail rejected every message it produced:
#
#     550 5.7.1 This message is not RFC 5322 compliant.
#     There are multiple Reply-To headers.
#
#   Two Reply-To headers, the original Message-ID reused, and a subject
#   that went out unencoded. The api's own module has one Reply-To, a
#   fresh Message-ID and an encoded subject, and Gmail accepts what it
#   produces - so the forwarder uses it rather than writing its own.
#
#   The check is that the forwarder does NOT talk SMTP itself. A second
#   SMTP client is a second set of rules, and that is how the two
#   Reply-To headers happened.
forwarder_path = os.path.join(ROOT, "server-pg", "forward-inquiries.js")
if not os.path.exists(forwarder_path):
    check("the forwarder sends with the api's own mail module", False,
          "server-pg/forward-inquiries.js is missing")
else:
    fwd = io.open(forwarder_path, encoding="utf-8", errors="replace").read()
    check("the forwarder sends with the api's own mail module",
          "sendInquiryNotice" in fwd and "from './mail.js'" in fwd,
          "the forwarder does not use the api's mail module")
    check("the forwarder does not carry its own SMTP client",
          not re.search(r"\bEHLO\b|\bAUTH LOGIN\b|tls\.connect|createConnection",
                        fwd),
          "the forwarder talks SMTP itself - a second sender with a second "
          "set of rules, which is how Gmail ended up rejecting every message")

# ---------------------------------------------------------------------------
# 5. One ledger, two senders.
# ---------------------------------------------------------------------------
# WHY
#   The api sends the notice the moment an enquiry arrives; the forwarder
#   sends the backlog. If the api does not record what it sent, the
#   forwarder cannot know, and every new enquiry arrives in a reader's
#   mailbox twice - once from each sender.
api_path = os.path.join(ROOT, "server-pg", "server.js")
api = io.open(api_path, encoding="utf-8", errors="replace").read()
# The CALL, not the definition. A file that defines the helper but never
# calls it leaves the ledger empty, and the check that only looks for the
# name would pass anyway.
check("the api records what it sent",
      bool(re.search(r"await\s+recordForwarded\s*\(", api)) and "inquiry_forwards" in api,
      "the api does not write to inquiry_forwards - the forwarder would "
      "send every enquiry a second time")

# ---------------------------------------------------------------------------
# 6. A buyer's letter, forwarded as it arrived.
# ---------------------------------------------------------------------------
# WHY
#   A buyer who writes to the company's address is a lead the back office
#   cannot see at all, and the mailbox that holds the letter translates
#   what it thinks is a foreign message. So the letter is forwarded - and
#   it has to be forwarded WITHOUT being touched: the body is the buyer's,
#   byte for byte, and the headers are ours.
#
#   The gate is that the forwarder uses the api's mail module, and that
#   the reader takes the body as bytes. A reader that decodes the body is
#   a reader that can change it.
mailbox_path = os.path.join(ROOT, "server-pg", "forward-mailbox.js")
if not os.path.exists(mailbox_path):
    check("the mailbox forwarder sends with the api's own mail module", False,
          "server-pg/forward-mailbox.js is missing")
else:
    mb = io.open(mailbox_path, encoding="utf-8", errors="replace").read()
    check("the mailbox forwarder sends with the api's own mail module",
          "forwardMail" in mb and "from './mail.js'" in mb,
          "the mailbox forwarder does not use the api's mail module")
    check("the mailbox forwarder does not carry its own SMTP client",
          not re.search(r"\bEHLO\b|\bAUTH LOGIN\b|tls\.connect|createConnection",
                        mb),
          "the mailbox forwarder talks SMTP itself")

reader_path = os.path.join(ROOT, "scripts", "forward_mailbox_read.py")
if not os.path.exists(reader_path):
    check("the reader keeps the buyer's words as they are", False,
          "scripts/forward_mailbox_read.py is missing")
else:
    rd = io.open(reader_path, encoding="utf-8", errors="replace").read()
    # The thing handed to b64encode must not have been decoded. Checking
    # that the file "mentions" b64encode is not enough: a reader that
    # decodes the body and then encodes it again mentions every word the
    # gate looks for, and still changes the buyer's words.
    body_expr = re.search(
        r"'body_b64':\s*base64\.b64encode\((.*?)\)\.decode\('ascii'\)", rd, re.S)
    check("the reader keeps the buyer's words as they are",
          bool(body_expr) and ".decode(" not in body_expr.group(1),
          "the reader decodes the body - a decoded body is a body that can "
          "be changed")
    check("the reader does not lose a character of the subject",
          "utf-8" in rd and "decode_header" in rd,
          "the reader does not decode the subject carefully")

# ---------------------------------------------------------------------------
# 7. A buyer's letter becomes a lead.
# ---------------------------------------------------------------------------
#
# WHY
#   A forwarded letter reaches a reader's mailbox and stops there. It has
#   no reference, it is not on the desk's clock, and nobody can answer it
#   with a number the buyer can quote. That is not a lead - it is a piece
#   of mail. The one real inquiry the site ever took sat unanswered for
#   five days for exactly this reason.
#
#   So the letter is written into the table as well, and from there
#   everything that already works applies to it: the notice goes out, the
#   clock starts, and the desk can quote a reference.
fwd2_path = os.path.join(ROOT, "server-pg", "forward-mailbox.js")
if not os.path.exists(fwd2_path):
    check("a buyer's letter becomes a lead", False,
          "server-pg/forward-mailbox.js is missing")
else:
    mb2 = io.open(fwd2_path, encoding="utf-8", errors="replace").read()
    check("a buyer's letter becomes a lead",
          bool(re.search(r"async\s+function\s+createLead\s*\(", mb2)),
          "the mailbox forwarder does not turn a letter into a lead")
    check("the lead is written into the inquiries table",
          bool(re.search(r"insert\s+into\s+inquiries", mb2)),
          "the letter never reaches the inquiries table - the desk has a "
          "piece of mail instead of a lead")
    check("the lead says where it came from",
          "'email'" in mb2 and "source_detail" in mb2,
          "the lead does not record that it came from a letter")
    # ONE LEAD PER LETTER. The ledger says it has been done; the table is
    # asked as well, so a letter that was written and then not recorded
    # does not become two.
    check("one letter, one lead",
          bool(re.search(r"source\s*=\s*'email'.*?source_detail->>'key'", mb2, re.S)),
          "the forwarder does not check whether the letter is already a lead")

# ---------------------------------------------------------------------------
# 8. Every mailbox is read.
# ---------------------------------------------------------------------------
#
# WHY
#   The company has more than one address, and a buyer does not know which
#   one is live. The letters that go to the other one are exactly the ones
#   that get lost - one of them is still unread. A reader that reads one
#   mailbox cannot fix that, because the letter is in the other one.
check("the reader is told about more than one mailbox",
      "MAIL_INBOX_EXTRA" in rd,
      "the reader reads exactly one mailbox - a letter to any other "
      "address is invisible")
check("the reader reads a list of mailboxes",
      bool(re.search(r"def\s+mailboxes\s*\(", rd)),
      "the reader has no list of mailboxes")
check("one locked mailbox does not stop the others",
      bool(re.search(r"cannot be opened", rd)) and
      bool(re.search(r"for\s+account,\s*password\s+in\s+boxes\s*:", rd)),
      "the reader stops at the first mailbox it cannot open")

# THE WHOLE LIST, NOT ONE ELEMENT OF IT.
#
# "in boxes" also matches "in boxes[:1]", which reads exactly one mailbox
# - and then a letter to any other address is invisible again, which is
# the whole point of the list. The colon is the difference.
check("the reader reads every mailbox in the list",
      not re.search(r"in\s+boxes\s*\[", rd),
      "the reader reads one mailbox out of the list - a letter to any other "
      "address is invisible again")

# ---------------------------------------------------------------------------
# 9. One reference, one rule.
# ---------------------------------------------------------------------------
ref_path = os.path.join(ROOT, "server-pg", "reference.js")
check("the reference has its own file",
      os.path.exists(ref_path),
      "server-pg/reference.js is missing - the reference is written twice")
if os.path.exists(ref_path):
    rf = io.open(ref_path, encoding="utf-8", errors="replace").read()
    check("the reference is exported from it",
          "export function reference()" in rf,
          "server-pg/reference.js does not export the reference")
    check("the api uses that one",
          "from './reference.js'" in api,
          "the api does not use the shared reference")
    check("the letter path uses that one",
          "from './reference.js'" in mb2,
          "the mailbox forwarder does not use the shared reference")

    # AND THERE IS NO SECOND COPY.
    #
    # The import is not enough. A second definition of the reference - one
    # copy in the api and one in the shared file - is two sets of rules,
    # and the database enforces the format, so the copy that drifts is
    # refused at the moment a buyer's letter becomes a lead.
    check("the api keeps no second copy of the reference",
          "function reference(" not in api,
          "the api defines a reference of its own - two sets of rules")
    check("the letter path keeps no second copy of the reference",
          "function reference(" not in mb2,
          "the mailbox forwarder defines a reference of its own - two sets of rules")

# ---------------------------------------------------------------------------
# 10. The running copy is the repository's copy.
# ---------------------------------------------------------------------------
#
# WHY
#   The reader that decides what a buyer's letter IS lives on the server,
#   and the repository holds a copy of it. A drift between them is a rule
#   enforced on one machine and documented on another. So the deployment
#   has to put the repository's file there - and the nightly backup has to
#   keep it, because it is not in git where it runs.
deploy_scripts = os.path.join(ROOT, "scripts")
check("the reader is deployed from the repository's copy",
      os.path.exists(os.path.join(deploy_scripts, "forward_mailbox_read.py")),
      "scripts/forward_mailbox_read.py is missing - the file that runs on "
      "the server has no source in the repository")

if failures:
    print()
    for f in failures:
        print("  x %s" % f)
    print("  the mail relay can fail in a way nothing notices")
    sys.exit(1)

print("  the mail relay is wired so a send ends and a reply lands, and a "
      "letter a buyer wrote becomes a lead")
