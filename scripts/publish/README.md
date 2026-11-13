# Publishing this repository

The repository this script lives in is the company's own: it carries the
ledger, the internal desk, the local database and the working documents.
It is not what the world should see.

`build_public_copy.py` writes the copy that should be seen, from the
repository it lives in, into a directory of your choosing:

```
python scripts/publish/build_public_copy.py --target <the directory>
```

What it leaves out, and why, is written down in the copy itself, in
`PUBLISHING.md`, and in machine-readable form in `publish-excluded.txt`.
The rules are in this script, and they are mechanical: a path list, a
content scan, and the price fields of the catalogue.

The copy is a SNAPSHOT of the repository at the moment it was made. It does
not track later commits and it is not a mirror: the two have different
histories, so a change is made here and made again there.

After it has run:

```
cd <the directory>
git init -b main
git add -A
git commit -m "the site, published"
git remote add origin <the repository>
git push -u origin main
```
