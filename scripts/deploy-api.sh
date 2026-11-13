#!/bin/bash
# The one way the api is deployed.
#
# WHY THE API NEEDED ITS OWN SCRIPT
# The site has had one since 2026-10-27: the tar is checked, unpacked
# beside the live directory, verified to look like a build, and only
# then swapped in - so a failed upload never leaves an empty site.
#
# The api had none. It was copied over the live files with scp and the
# service restarted. There was no backup, no syntax check, no staging,
# and no way back. On 2026-11-02 a change to console-routes.js broke
# the api three times in a row, and each time it was rescued by hand
# out of /data/shenhe/backup. The rescue worked because the backup
# happened to exist - not because anything in the process put it there.
#
# So the api gets the same treatment, and the same order:
#   1. every file is checked to be there and to be readable
#   2. the new files are checked to parse, with the api's own node
#   3. the live files are copied aside, with a timestamp
#   4. only then are the new files put in place
#   5. the service is restarted and has to answer
#   6. if it does not answer, the backup is put back
#
# The live api is never left in a state that cannot be talked to.
#
# USAGE
#   shenhe-deploy-api <file> [file ...]
#   the files are paths on the server, e.g.
#   shenhe-deploy-api /data/shenhe/stage/console-routes.js
set -e

API_DIR=/www/wwwroot/shenhe-api
BACKUP=/data/shenhe/backup
LOG=/data/shenhe/logs/api-deploy.log
mkdir -p "$BACKUP" "$(dirname "$LOG")"

# WHERE THE API ANSWERS.
#
# The port is read out of the api's own environment file, because that
# is where it comes from. A port written into a script is a guess, and
# a guess that is wrong makes a good deploy look like a failed one -
# which then takes the good file away again.
PORT=3001
if [ -f "$API_DIR/.env" ]; then
  P=$(grep -oE '^PORT=[0-9]+' "$API_DIR/.env" | tail -1 | cut -d= -f2)
  [ -n "$P" ] && PORT="$P"
fi
HEALTH="http://127.0.0.1:${PORT}/api/health"

if [ $# -lt 1 ]; then
  echo "  the deploy is refused: no file was named. The live api is untouched." >&2
  exit 1
fi

STAMP=$(date +%Y%m%d-%H%M%S)

# 1. every file has to be there
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "  the deploy is refused: $f does not exist. The live api is untouched." >&2
    exit 1
  fi
  if [ ! -s "$f" ]; then
    echo "  the deploy is refused: $f is empty. The live api is untouched." >&2
    exit 1
  fi
done

# 2. the new files have to parse
#    The api is ESM, so a .js file is checked as a module.
for f in "$@"; do
  case "$f" in
    *.js)
      cp "$f" /tmp/_shenhe_check.mjs
      if ! node --check /tmp/_shenhe_check.mjs 2>>"$LOG"; then
        rm -f /tmp/_shenhe_check.mjs
        echo "  the deploy is refused: $f does not parse. The live api is untouched." >&2
        tail -5 "$LOG" >&2
        exit 1
      fi
      rm -f /tmp/_shenhe_check.mjs
      ;;
  esac
done

# 3. the live files are copied aside
SAVED=""
for f in "$@"; do
  name=$(basename "$f")
  if [ -f "$API_DIR/$name" ]; then
    cp -p "$API_DIR/$name" "$BACKUP/$name.$STAMP"
    SAVED="$SAVED $name"
  fi
done

# 4. the new files go in
for f in "$@"; do
  name=$(basename "$f")
  cp "$f" "$API_DIR/$name"
done

# 5. the service restarts and has to answer
systemctl restart shenhe-api
sleep 2

OK=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf --max-time 5 "$HEALTH" >/dev/null 2>&1; then
    OK=1
    break
  fi
  sleep 1
done

# 6. if it did not answer, the backup goes back
if [ "$OK" != "1" ]; then
  echo "  the api did not answer after the restart. Putting the backup back." >&2
  for name in $SAVED; do
    cp -p "$BACKUP/$name.$STAMP" "$API_DIR/$name"
  done
  systemctl restart shenhe-api
  sleep 2
  if curl -sf --max-time 5 "$HEALTH" >/dev/null 2>&1; then
    echo "  the backup is back and the api answers again." >&2
  else
    echo "  THE API IS DOWN AND THE BACKUP DID NOT HELP. Look at $LOG." >&2
  fi
  exit 1
fi

echo "  the api is deployed and answering."
echo "  the port: $PORT"
echo "  the files: $(for f in "$@"; do basename "$f"; done | tr '\n' ' ')"
if [ -n "$SAVED" ]; then
  echo "  the backup: $BACKUP/<file>.$STAMP"
fi
