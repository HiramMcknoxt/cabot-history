# Cabot History Reference

A public, searchable reference for the history of Cabot, Arkansas — built from the
city's public records and local news indexes.

**Site:** https://hirammcknoxt.github.io/cabot-history/ (GitHub Pages, served from
the `main` branch root of this repository)

## What's here

- `index.html` — home: what the site is, how to search, Cabot at a glance
- `search.html` + `assets/search.js` — client-side search. No server: the browser
  downloads JSON shards from `data/` and searches locally
- `mayors.html` — mayors of Cabot with evidence and honest gaps
  (1891–1960 and 1979–c. 1995 are not identified in any public source found)
- `council.html` — who held each of the eight council seats, by year, 2015–2026
- `sources.html` — sources & method, including the Facebook-group theme survey
  (paraphrased) and the Cabot Star-Herald lineage
- `ask.html` — how questions are researched, reviewed, and published
- `data/meta.json` — shard list and collection statistics
- `data/docs-*.json` — the document index: government documents with full text
  (public records), sharded by year
- `data/pointers.json` — news and source pointers: title, date, short summary, link

## Content rules

- Government documents (council, school board, other city bodies, legislative
  audit) are public records and are reproduced in full, with links to the
  original files in public Google Drive folders.
- The Arkansas Leader, Arkansas Democrat-Gazette, and local TV coverage are
  **pointers only** — date, title, short summary, link. Their text is never
  included in this repository or its search index.
- Facebook group material appears only as paraphrased themes. No posts or
  comments are reproduced.
- Uncertain facts stay labeled: the Camp Nelson cemetery relocation date
  (1905 vs. 1907) is carried as disputed, and unidentified mayors stay unknown.

## Rebuilding

The site is generated from the project's corpus (council packets and minutes
2015–2026, school board minutes, other city bodies, legislative audits, the
Leader issue index, the ADG/TV indexes, the mayors and seat rosters, and the
online-sources registry). The build also dedupes council texts by content and
matches them to the packet index so each document carries its Drive link.
