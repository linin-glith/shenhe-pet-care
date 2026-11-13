#!/usr/bin/env bash
# The push script and the schedule that runs it are installed together.
#
# WHY THEY HAVE TO BE ONE THING
#
# On 2026-11-04 this server held three push scripts and three schedule
# entries, and the one that was running was not the good one:
#
#   push-indexnow.sh   the seven-engine script, byte-identical to the
#                      repository's copy, answering 7 of 7 when it was
#                      run by hand - and called by nothing
#   shenhe-indexnow    an older script, one key, one endpoint, and it
#                      stopped at the first 200 - called twice
#   shenhe-push        the first script of all, from 2026-10-26, never
#                      touched since - called every two hours, and
#                      refused with 403 every time
#
# The cause was not a broken script. It was that every repair ADDED a
# file and a schedule line, and no repair ever retired the previous
# one. The fixes were all to the SCRIPT's behaviour - which key, which
# endpoint, which key each engine gets - and none of them was to the
# SCHEDULE, which is the thing that decides which script runs.
#
# So the script and the schedule are installed by one command, and the
# command retires every other schedule that touches a push. A new
# version of the script cannot be put in place without the schedule
# pointing at it, and an old schedule cannot survive the installation.
#
# USAGE
#   deploy-push.sh <the script to install>
#   on the server: shenhe-deploy-push /data/shenhe/stage/push-indexnow.sh
set -eu

SRC="${1:-}"
if [ -z "$SRC" ]; then
  echo "  the deploy is refused: no file was named." >&2
  exit 1
fi
if [ ! -f "$SRC" ]; then
  echo "  the deploy is refused: $SRC does not exist." >&2
  exit 1
fi

DEST=/usr/local/bin/push-indexnow.sh
CRON=/etc/cron.d/shenhe-push
LOG=/data/shenhe/logs/push.log
STAMP=$(date +%Y%m%d-%H%M%S)
# The schedules that touch a push. Named by their binaries, so that a
# cron line about something else that happens to contain the word
# "push" is not retired by accident.
PUSHY='shenhe-push|shenhe-indexnow|push-indexnow|indexnow'

echo "=== 1. the script, checked before it goes anywhere ==="
bash -n "$SRC"
install -m 0755 "$SRC" "$DEST"
echo "  installed: $DEST"

echo
echo "=== 2. the schedule, pointing at that file ==="
cat > "$CRON" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=root
# THE PUSH
#
# One schedule, one script. They are installed together by
# /usr/local/bin/shenhe-deploy-push, which also retires every other
# schedule that touches a push - because on 2026-11-04 this server ran
# three push scripts at once, and the one on the clock was not the one
# that worked.
17 */2 * * * root $DEST >> $LOG 2>&1
EOF
chmod 644 "$CRON"
echo "  written: $CRON"

echo
echo "=== 3. every other schedule that touches a push is retired ==="
# The retired files are MOVED OUT of /etc/cron.d, not renamed in place.
# A cron implementation ignores a file in that directory whose name has a
# dot in it, and relying on that is a habit rather than a guarantee - and
# a schedule that is still on the clock is exactly the thing this command
# exists to prevent.
RETIRED=/data/shenhe/backup/cron-retired
mkdir -p "$RETIRED"
for F in /etc/cron.d/*; do
  [ -f "$F" ] || continue
  [ "$F" = "$CRON" ] && continue
  if grep -qiE "$PUSHY" "$F" 2>/dev/null; then
    mv "$F" "$RETIRED/$(basename "$F").$STAMP"
    echo "  retired: $F"
  fi
done
if crontab -l 2>/dev/null | grep -qiE "$PUSHY"; then
  crontab -l 2>/dev/null | grep -viE "$PUSHY" > /tmp/shenhe-cron.$$ || true
  crontab /tmp/shenhe-cron.$$
  rm -f /tmp/shenhe-cron.$$
  echo "  the root crontab: the push lines are out"
fi

echo
echo "=== 4. and only one push script is left where a cron can reach it ==="
# A retired schedule is not enough. The other push scripts are moved out
# of /usr/local/bin, which is where a schedule - or a person - reaches
# for them by name. Their content is kept in the backup directory, so
# nothing is destroyed; what is destroyed is the chance of calling the
# wrong one.
KEEP=/data/shenhe/backup/push-scripts
mkdir -p "$KEEP"
for F in /usr/local/bin/*push* /usr/local/bin/*indexnow*; do
  [ -f "$F" ] || continue
  [ "$F" = "$DEST" ] && continue
  case "$F" in
    /usr/local/bin/shenhe-deploy-push) continue ;;
  esac
  mv "$F" "$KEEP/$(basename "$F").$STAMP"
  echo "  removed from the path: $F"
done
echo "  the scripts that are left:"
ls -1 /usr/local/bin/ 2>/dev/null | grep -iE 'push|indexnow' | sed 's/^/    /'

echo
echo "=== 5. what will run now ==="
echo "  /etc/cron.d:"
grep -vE '^\s*#' "$CRON" | grep -vE '^\s*$' | sed 's/^/    /'
echo "  the root crontab, the push lines:"
crontab -l 2>/dev/null | grep -iE "$PUSHY" | sed 's/^/    /' || echo "    (none)"
echo "  the other cron.d files that touch a push:"
ls /etc/cron.d/ 2>/dev/null | grep -iE "$PUSHY" | grep -v '^shenhe-push$' | sed 's/^/    /' || echo "    (none)"
echo
echo "  the push is installed and the schedule points at it."
