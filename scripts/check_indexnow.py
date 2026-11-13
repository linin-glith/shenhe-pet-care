"""
THE PUSH SCRIPT AND THE SITE MUST AGREE.

WHAT THIS IS FOR

The script that pushes the site's addresses to the search engines runs
on the server. The same script lives in the repository. They are the
same script, and they have to be: they drifted once, and the copy in
the repository named a key that was never written on the server, so the
two were doing different things and neither was right.

It drifted a second time on 2026-11-04, in the other direction: the
server had been given the seven-endpoint, three-key script and the
repository still held the old one-key script, so this check was reading
a file that was not the one that ran.

So the check is over the script itself:

  every key it names must be a key file the site holds, and the file
  must hold that key
  it must check that a key file is published before it uses the key - a
  push that names a key the engine cannot read is refused with a
  message that says the engine is not allowed in, which looks like a
  permission problem and is really a missing file
  it must push to the shared endpoint and to Bing, the two that
  refused us
  and the routing must be right: the engines that only accept a key
  Bing issued must NOT be given the site's own key. That one line is
  the difference between a push that is taken and a push that is
  refused, and it is the thing a reader of the script cannot see by
  eye - so it is checked.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, 'scripts', 'push-indexnow.sh')
PUBLIC = os.path.join(ROOT, 'public')

problems = []

if not os.path.exists(SCRIPT):
    problems.append('the push script is missing')
else:
    text = io.open(SCRIPT, encoding='utf-8').read()

    # the keys the site holds, and what is in them
    keyfiles = []
    for f in sorted(os.listdir(PUBLIC)):
        if not f.endswith('.txt'):
            continue
        held = io.open(os.path.join(PUBLIC, f), encoding='utf-8').read().strip()
        if not re.fullmatch(r'[0-9a-f]{16,64}', held):
            continue
        keyfiles.append((held, f))

    if not keyfiles:
        problems.append('the site holds no key file')

    # a key file that does not hold its own name is a broken one
    for held, f in keyfiles:
        if f != '%s.txt' % held:
            problems.append('the key file %s does not hold the key it is named for' % f)

    # the keys the script declares
    declared = []
    for km in re.finditer(r'^KEYS="([^"]*)"', text, re.M):
        declared.extend(k for k in km.group(1).split() if re.fullmatch(r'[0-9a-f]{16,64}', k))

    if not declared:
        problems.append('the script declares no key')
    else:
        for k in declared:
            if not os.path.exists(os.path.join(PUBLIC, '%s.txt' % k)):
                problems.append('the script names a key the site does not hold: %s' % k)
            else:
                held = io.open(os.path.join(PUBLIC, '%s.txt' % k), encoding='utf-8').read().strip()
                if held != k:
                    problems.append('the key file %s.txt does not hold the key it is named for' % k)

    # the key file is read before the push
    if 'is not published' not in text or '.txt' not in text:
        problems.append('the script does not check the key file before pushing')

    # the two endpoints that refused us have to be in there
    for endpoint in ('api.indexnow.org', 'www.bing.com'):
        if endpoint not in text:
            problems.append('the script does not push to %s' % endpoint)

    # THE ROUTING.
    #
    # Each engine entry is name|endpoint|key. The engines that only
    # accept a key Bing issued - the shared endpoint and Bing itself -
    # must not be given the same key as the engines that accept any key.
    #
    # The key may be written literally or as a shell variable, and the
    # script names them through variables so that there is one list of
    # keys. So the variables are resolved first: each one is read out of
    # the KEYS list by its position.
    var_keys = {}
    for m in re.finditer(
        r"^(\w+)=\$\(echo\s+\$KEYS\s*\|\s*awk\s*'\{print\s+\$(\d)\}'\)", text, re.M
    ):
        idx = int(m.group(2)) - 1
        if 0 <= idx < len(declared):
            var_keys[m.group(1)] = declared[idx]

    entries = []
    for m in re.finditer(r'"([A-Za-z0-9_]+)\|(https?://[^|"]+)\|(\$[A-Za-z0-9_]+|[0-9a-f]{16,64})"', text):
        name, url, keyref = m.groups()
        # the reference may carry the shell sigil: $SHARED_KEY
        entries.append((name, url, var_keys.get(keyref.lstrip('$'), keyref)))

    if not entries:
        problems.append('the script does not name a key for each engine')
    else:
        # ONE DIRECTION ONLY, and it is the direction that breaks.
        #
        # Bing accepts a key only if Bing issued it for this property. The
        # five non-Bing engines accept any key whose file is published, so
        # they MAY be given a Bing-issued key - that is not a fault, and
        # since 2026-11-09 it is what they are given.
        #
        # What IS a fault is the other direction: handing the site's own
        # home-made key to api.indexnow.org or www.bing.com. That is the
        # 403 whose body says "UserForbiddedToAccessSite" and reads like a
        # permission problem when it is really a wrong-key problem.
        #
        # Which key is which is declared by position in the KEYS list: the
        # Bing-issued ones come first, the home-made one is last. The routing
        # reads the list positionally, so the check does too.
        self_made = declared[-1] if len(declared) > 1 else None
        if self_made:
            leaked = sorted({k[:12] for name, url, k in entries
                             if ('indexnow.org' in url or 'bing.com' in url)
                             and k == self_made})
            if leaked:
                problems.append(
                    'the engines that only accept a key Bing issued are given the site\'s own key '
                    '(%s): that is the 403 that reads like a permission problem'
                    % ', '.join(leaked))
        # every engine has to be given a key the site actually holds
        for name, url, k in entries:
            if k not in declared:
                problems.append(
                    'the %s endpoint is given the key %s, which the script does not declare'
                    % (name, k[:12]))

# ---------------------------------------------------------------------------
# ONE PUSH SCRIPT, AND A SCHEDULE THAT IS INSTALLED WITH IT
# ---------------------------------------------------------------------------
SCRIPTS = os.path.join(ROOT, 'scripts')
DEPLOY = os.path.join(SCRIPTS, 'deploy-push.sh')

push_scripts = sorted(f for f in os.listdir(SCRIPTS)
                      if f.startswith('push-indexnow') and f.endswith('.sh'))
if len(push_scripts) != 1:
    problems.append(
        'the repository holds %d push scripts (%s): two of them would be two '
        'versions again, and only one of them would ever be run'
        % (len(push_scripts), ', '.join(push_scripts) or 'none'))

if not os.path.exists(DEPLOY):
    problems.append(
        'scripts/deploy-push.sh is missing: the script and the schedule that '
        'runs it have to be installed by one command, or a new version can '
        'be put in place that nothing calls')
else:
    deploy = io.open(DEPLOY, encoding='utf-8').read()
    # the command has to install the one script the repository holds
    if not re.search(r'DEST=\S*push-indexnow\.sh', deploy):
        problems.append(
            'scripts/deploy-push.sh does not install push-indexnow.sh - it would '
            'install something else')
    # and it has to retire the schedules that touch a push
    #
    # The retired files are MOVED OUT of /etc/cron.d, not renamed there:
    # a cron implementation ignores a file whose name has a dot in it,
    # and relying on that is a habit rather than a guarantee.
    if 'cron-retired' not in deploy or 'mv ' not in deploy:
        problems.append(
            'scripts/deploy-push.sh does not move the other schedules that '
            'touch a push out of /etc/cron.d - that is what let three scripts run at once')
    # and it has to write the schedule that points at the file it installed
    if not re.search(r'cron\.d/shenhe-push', deploy):
        problems.append(
            'scripts/deploy-push.sh does not write the schedule in '
            '/etc/cron.d - the script and the schedule have to be one thing')
    # and it has to take the other push scripts out of the path a cron
    # reaches for them by name - a retired schedule is not enough
    if 'push-scripts' not in deploy or '/usr/local/bin' not in deploy:
        problems.append(
            'scripts/deploy-push.sh does not take the other push scripts out '
            'of /usr/local/bin - they would still be there to be called')

if problems:
    for p in problems:
        sys.stderr.write('    %s\n' % p)
    sys.stderr.write('  the push script and the site do not agree\n')
    sys.exit(1)

print('  the push script and the site agree')
