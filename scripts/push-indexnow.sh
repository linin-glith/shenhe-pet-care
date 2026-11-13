#!/usr/bin/env bash
# IndexNow: tell the search engines that the site changed.
#
# WHY
# Google does not visit a new page for weeks. Bing, Yandex, Seznam and
# Yahoo act on a push within minutes. The site publishes a new page or
# changes a page on every deployment, and IndexNow is the mechanism that
# says so. It is a POST with a key file the engine can read, and it
# costs nothing.
#
# WHAT IT PUSHES
# Every URL in every sitemap. The sitemap index only names the three
# sitemaps; the pages are inside them, so the index is not what gets
# pushed - reading the index and pushing its three <loc> entries would
# tell the engines about three files and not one page.
#
# THE KEY - and the one thing that was wrong for a week
#
# A key file on the host is necessary but NOT sufficient. Measured on
# 2026-11-03, from the server, with three keys and every endpoint:
#
#     key                            shared   Bing     Yandex Seznam Yep Amazon Naver
#     2e1e0ece (ours, self-made)     403      403      200    200    200  200   200
#     c1998c98 (Bing issued)         202      202      200    200    200  200   200
#     be0cabeb (Bing issued)         202      200      200    200    200  200   200
#
# The 403 body is the whole story:
#
#     {"errorCode":"UserForbiddedToAccessSite",
#      "message":"User is unauthorized to access the site. Please verify the site using the key..."}
#
# api.indexnow.org and www.bing.com are the same backend - the shared
# endpoint forwards to Bing for most hosts - so those two refusals are
# one refusal. The other five engines validate a key by fetching the
# key file and registering it on first contact, which is why they accept
# a self-made key and why Yandex answers 202 and then 200.
#
# Bing will not: it only accepts a key it has issued for this property.
# So the site has to be in Bing Webmaster Tools and the push has to
# carry the key Bing generated there.
#
# WHY EVERY ENGINE, NOT JUST TWO
# The old script pushed to the shared endpoint and Bing only - the two
# that were refusing us - and reported the refusals as a failure.
# Pushing to every endpoint costs a few requests and means the site is
# announced to the engines that will actually take it, today, without
# anyone's account.
#
# WHICH KEY GOES TO WHICH ENGINE - the routing
#
# The first version of this fix pushed all three keys to all seven
# endpoints. It worked, and it was wrong twice over:
#
#   1. a third of every push was a guaranteed 403 - the site's own key
#      offered to the two engines that only accept a key Bing issued
#   2. the same URL was offered three times over to each engine, so the
#      dashboard counted 3,100 submissions for a site with 64 pages
#
# So each endpoint is given the key it accepts:
#
#   shared (api.indexnow.org)  -> the first Bing-issued key
#   bing   (www.bing.com)     -> the second Bing-issued key
#   the other five engines     -> the site's own key
#
# Both Bing-issued keys are still used, on purpose. They are both
# published, and giving each of them its own endpoint means that if one
# of them is ever revoked the other still carries its own. The site's
# own key is still published too: Yandex registered it on first contact,
# and a registered key that suddenly has no file is the kind of thing
# that quietly stops working.
#
# Seven pushes per URL per run instead of twenty-one, and not one of
# them is a refusal.
#
# THE POST form is used, not the GET form. The doc gives both. GET does
# not work everywhere: Amazon's endpoint answers GET with
# 403 {"message":"Missing Authentication Token"}, while POST is 200.
#
# The two sitemap ping endpoints are gone and are not used here: Bing's
# returns 410 Gone, Google's returns 404 and says the ping is deprecated.
set -u
BASE="https://shenhezhongke.com"
HOST="shenhezhongke.com"

# The keys, in this order - the order IS the declaration of which is which,
# because the routing below reads the list positionally:
#
#   1.   the key Bing Webmaster Tools issued for this property most recently
#        (8d264c03…, added 2026-11-09). Measured that day: api.indexnow.org 200,
#        www.bing.com 200, yandex 202, seznam / yep / amazon / naver 200 - the
#        one key every endpoint takes.
#   2-3. two older Bing-issued keys. Still published and still answering 200,
#        kept in the list only as a fallback: if the new key is ever revoked,
#        either of these carries.
#   4.   made by the site itself. Stays published because Yandex registered it
#        on first contact, and a registered key whose file disappears is the
#        kind of thing that quietly stops working. No endpoint is handed it.
#
# A key is pushed only if its file is actually published - an unpublished key
# gets a 403 from every engine, and a 403 from every engine looks like "the
# site is broken".
KEYS="8d264c03477849e5a586ea13cda95398 be0cabeb4dec4481b0e7b893587a1583 c1998c9829d2420692ca88095d4b0d7f 2e1e0eceb7ea47d8863642fac0affb10"

# The routing, read out of that one list so there is a single source of
# truth: every endpoint is given the newest Bing-issued key. The two older
# keys stay published as a fallback but are not handed to any endpoint.
SHARED_KEY=$(echo $KEYS | awk '{print $1}')
BING_KEY=$(echo $KEYS | awk '{print $1}')
OWN_KEY=$(echo $KEYS | awk '{print $1}')

WORK=$(mktemp -d)
# the index first: it names the sitemaps
curl -sS "$BASE/sitemap-index.xml" -o "$WORK/index.xml"
grep -oE '<loc>[^<]+</loc>' "$WORK/index.xml" | sed -E 's#</?loc>##g' > "$WORK/maps.txt"
echo "  the sitemaps: $(wc -l < "$WORK/maps.txt")"

: > "$WORK/urls.txt"
while read -r MAP; do
  [ -z "$MAP" ] && continue
  NAME=$(basename "$MAP")
  curl -sS "$MAP" -o "$WORK/$NAME"
  grep -oE '<loc>[^<]+</loc>' "$WORK/$NAME" | sed -E 's#</?loc>##g' >> "$WORK/urls.txt"
done < "$WORK/maps.txt"

sort -u "$WORK/urls.txt" -o "$WORK/urls.txt"
COUNT=$(wc -l < "$WORK/urls.txt")
echo "  the urls in the sitemaps: $COUNT"

# ONLY WHAT CHANGED
#
# IndexNow is a way of saying "this changed". The same ninety pages,
# announced twelve times a day to seven engines, is not a change - and the
# dashboard counted it as 7,571 submissions for a site with ninety pages.
#
# So each URL is compared with the file behind it, and only the ones
# whose content differs from the last announcement are sent.
#
# Two rules keep this safe:
#   - a URL whose file cannot be found is announced anyway. The safe
#     direction is to say too much, never too little;
#   - the state is written only when an engine actually took the push
#     (at the end of this script), so a dropped connection does not
#     swallow an announcement.
DOCROOT="/www/wwwroot/shenhezhongke.com"
STATE="/data/shenhe/indexnow-state.tsv"
mkdir -p "$(dirname "$STATE")"
: > "$WORK/hashes.tsv"
: > "$WORK/changed.txt"
while read -r U; do
  [ -z "$U" ] && continue
  U_PATH="${U#https://$HOST}"
  U_PATH="${U_PATH%%\?*}"
  U_FILE="$DOCROOT$U_PATH"
  if [ -f "$U_FILE" ]; then
    U_HASH=$(sha256sum "$U_FILE" | cut -c1-32)
  else
    U_HASH="no-file"
  fi
  printf '%s\t%s\n' "$U" "$U_HASH" >> "$WORK/hashes.tsv"
  U_OLD=$(awk -F'\t' -v u="$U" '$1==u{print $2; exit}' "$STATE" 2>/dev/null)
  if [ "$U_HASH" = "no-file" ] || [ -z "$U_OLD" ] || [ "$U_HASH" != "$U_OLD" ]; then
    printf '%s\n' "$U" >> "$WORK/changed.txt"
  fi
done < "$WORK/urls.txt"

CHANGED=$(wc -l < "$WORK/changed.txt")
echo "  the urls that changed: $CHANGED"
if [ "$CHANGED" -eq 0 ]; then
  echo "  nothing changed since the last announcement - nothing to push"
  rm -rf "$WORK"
  exit 0
fi
mv "$WORK/changed.txt" "$WORK/urls.txt"
COUNT=$CHANGED
echo "  the urls to push: $COUNT"

# name|endpoint|key - every participating endpoint, the shared one first.
ENGINES=(
  "shared|https://api.indexnow.org/indexnow|$SHARED_KEY"
  "bing|https://www.bing.com/indexnow|$BING_KEY"
  "yandex|https://yandex.com/indexnow|$OWN_KEY"
  "seznam|https://search.seznam.cz/indexnow|$OWN_KEY"
  "yep|https://indexnow.yep.com/indexnow|$OWN_KEY"
  "amazon|https://indexnow.amazonbot.amazon/indexnow|$OWN_KEY"
  "naver|https://searchadvisor.naver.com/indexnow|$OWN_KEY"
)

# Which of the keys are actually published.
#
# A key file on the host is necessary but not sufficient: the engine has
# to be able to READ it. So the file is fetched over HTTP before the key
# is used, exactly as the engine will fetch it, and a key whose file
# does not answer 200 is left out.
PUBLISHED=""
for KEY in $KEYS; do
  HTTP=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/$KEY.txt")
  if [ "$HTTP" != "200" ]; then
    echo "  the key ${KEY:0:12} is not published ($HTTP) - skipped"
    continue
  fi
  PUBLISHED="$PUBLISHED $KEY"
  echo "  the key ${KEY:0:12} is published"
done

is_published() {
  case " $PUBLISHED " in
    *" $1 "*) return 0 ;;
    *) return 1 ;;
  esac
}

ACCEPTED_TOTAL=0
TRIED_TOTAL=0
for E in "${ENGINES[@]}"; do
  NAME="${E%%|*}"
  REST="${E#*|}"
  ENGINE="${REST%%|*}"
  EKEY="${REST#*|}"

  if ! is_published "$EKEY"; then
    echo "    $NAME -> skipped, the key it needs is not published"
    continue
  fi

  TRIED_TOTAL=$((TRIED_TOTAL + 1))

  cat > "$WORK/indexnow.json" <<EOF
{"host":"$HOST","key":"$EKEY","keyLocation":"$BASE/$EKEY.txt","urlList":[$(awk '{printf "%s\"%s\"", (NR==1?"":","), $0}' "$WORK/urls.txt")]}
EOF

  echo "    $NAME (key ${EKEY:0:12}):"
  # One request, and one more if the request never arrived.
  #
  # curl reports a transport failure as the code 000: a dropped
  # connection, a reset, an HTTP/2 stream error. That is not an answer
  # from the engine, so it is not counted as one - it is tried again
  # once. A refusal (403, 429) IS an answer, and is not retried.
  #
  # Without this, one dropped connection during a deployment was
  # reported as an engine that did not take the push.
  for ATTEMPT in 1 2; do
    CODE=$(curl -sS -o "$WORK/resp.txt" -w '%{http_code}' -X POST "$ENGINE" \
      -H 'Content-Type: application/json; charset=utf-8' \
      --data-binary @"$WORK/indexnow.json" 2>"$WORK/err.txt")
    [ "$CODE" != "000" ] && break
    [ "$ATTEMPT" = "1" ] && sleep 2
  done
  BODY=$(head -c 140 "$WORK/resp.txt" | tr -d '\n')
  [ "$CODE" = "000" ] && BODY="$(head -c 140 "$WORK/err.txt" | tr -d '\n')"
  case "$CODE" in
    200|202)
      ACCEPTED_TOTAL=$((ACCEPTED_TOTAL + 1))
      if [ "$CODE" = "202" ]; then
        echo "      202 accepted (the engine is verifying the key now)"
      else
        echo "      200 accepted"
      fi
      ;;
    403)
      echo "      403 this engine does not recognise the key for this host"
      echo "            (for Bing that means: the key has to be the one Bing Webmaster"
      echo "             Tools issued for this property - a self-made key is refused)"
      ;;
    429)
      echo "      429 rate limited - try again later"
      ;;
    *)
      echo "      $CODE $BODY"
      ;;
  esac
done

echo "  the pushes the engines took: $ACCEPTED_TOTAL of $TRIED_TOTAL"

# THE STATE IS WRITTEN ONLY WHEN SOMEBODY TOOK THE PUSH
#
# If nothing was accepted, the announcement did not happen - so the state
# stays as it was, and the same URLs are offered again at the next run.
if [ "$ACCEPTED_TOTAL" -gt 0 ]; then
  cp "$WORK/hashes.tsv" "$STATE"
  echo "  the state is written: $(wc -l < "$STATE") url(s) remembered"
else
  echo "  no engine took the push - the state is left as it was, so the same"
  echo "  urls are announced again at the next run"
fi
rm -rf "$WORK"
