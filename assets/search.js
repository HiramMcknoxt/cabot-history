(function () {
  const $ = (id) => document.getElementById(id);
  const status = $('status'), results = $('results');
  let meta = null, pointers = null, shardCache = {};

  function esc(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function snippet(text, terms) {
    const low = text.toLowerCase();
    let pos = -1, term = '';
    for (const t of terms) {
      const p = low.indexOf(t);
      if (p >= 0 && (pos < 0 || p < pos)) { pos = p; term = t; }
    }
    if (pos < 0) return esc(text.slice(0, 220)) + '…';
    const start = Math.max(0, pos - 110), end = Math.min(text.length, pos + term.length + 130);
    let s = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    s = esc(s);
    for (const t of terms) {
      s = s.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    }
    return s;
  }
  function countHits(text, terms) {
    const low = text.toLowerCase();
    let n = 0;
    for (const t of terms) {
      let i = 0;
      while ((i = low.indexOf(t, i)) >= 0) { n++; i += t.length; if (n > 400) return n; }
    }
    return n;
  }

  async function loadShard(file) {
    if (!shardCache[file]) {
      shardCache[file] = fetch('data/' + file).then((r) => r.json()).catch(() => []);
    }
    return shardCache[file];
  }

  async function init() {
    meta = await fetch('data/meta.json').then((r) => r.json());
    pointers = await fetch('data/pointers.json').then((r) => r.json());
    const cf = $('collfilters');
    cf.innerHTML = meta.collections.map((c) =>
      `<label><input type="checkbox" class="coll" value="${esc(c)}" checked> ${esc(c)}</label>`).join('');
    const years = meta.years;
    $('yfrom').innerHTML = years.map((y) => `<option>${y}</option>`).join('');
    $('yto').innerHTML = years.map((y) => `<option>${y}</option>`).join('');
    $('yfrom').value = years[0];
    $('yto').value = years[years.length - 1];
    status.textContent = `${meta.stats.docs} documents (${meta.stats.docs_with_text} with full text) and ${meta.stats.pointers} pointers ready.`;
    const q = new URLSearchParams(location.search).get('q');
    if (q) { $('q').value = q; runSearch(); }
  }

  async function runSearch() {
    const raw = $('q').value.trim().toLowerCase();
    results.innerHTML = '';
    if (!raw) { status.textContent = 'Type a search term to begin.'; return; }
    const terms = raw.split(/\s+/).filter(Boolean);
    const colls = new Set([...document.querySelectorAll('.coll:checked')].map((b) => b.value));
    const yf = $('yfrom').value, yt = $('yto').value;
    const wantPtr = $('inclpointers').checked;
    status.textContent = 'Searching… (first full-text search downloads the index, about 30 MB; later searches are instant)';
    const files = meta.shards.filter((s) => {
      const y = s.year;
      return y === 'undated' || (y >= yf && y <= yt);
    }).map((s) => s.file);
    const shards = await Promise.all(files.map(loadShard));
    const docHits = [];
    for (const docs of shards) {
      for (const d of docs) {
        if (!colls.has(d.c)) continue;
        const hay = (d.t + ' ' + (d.x || '')).toLowerCase();
        if (!terms.every((t) => hay.includes(t))) continue;
        const score = countHits(d.t + ' ' + (d.x || ''), terms);
        docHits.push({ d, score });
      }
    }
    docHits.sort((a, b) => b.score - a.score || (b.d.d || '').localeCompare(a.d.d || ''));
    const ptrHits = [];
    if (wantPtr) {
      for (const p of pointers) {
        const yr = (p.d || '').slice(0, 4);
        if (yr && (yr < yf || yr > yt)) continue;
        const hay = (p.s + ' ' + p.t + ' ' + p.x + ' ' + p.g).toLowerCase();
        if (!terms.every((t) => hay.includes(t))) continue;
        ptrHits.push({ p, score: countHits(hay, terms) });
      }
      ptrHits.sort((a, b) => b.score - a.score || (b.p.d || '').localeCompare(a.p.d || ''));
    }
    const total = docHits.length + ptrHits.length;
    status.textContent = total
      ? `${total} result${total === 1 ? '' : 's'} for “${$('q').value.trim()}”${docHits.length > 100 ? ' — showing the top 100 documents' : ''}.`
      : `No results for “${$('q').value.trim()}”. Try fewer words, or a name as it appears in the minutes.`;
    const frag = [];
    for (const { d } of docHits.slice(0, 100)) {
      const link = d.u ? `<a href="${esc(d.u)}" target="_blank" rel="noopener">Open document (Google Drive)</a>` : '';
      frag.push(`<article class="result"><h3>${esc(d.t)}</h3>
        <p class="meta"><span class="tag">${esc(d.c)}</span>${d.d ? esc(d.d) : 'date in file'} · ${d.x ? 'full text' : 'index entry only — text layer not ready'}</p>
        ${d.x ? `<p>${snippet(d.x, terms)}</p>` : ''}
        <p>${link}</p></article>`);
    }
    for (const { p } of ptrHits.slice(0, 100)) {
      const link = p.u ? `<a href="${esc(p.u)}" target="_blank" rel="noopener">Open source</a>` : '';
      frag.push(`<article class="result"><h3>${esc(p.t)}</h3>
        <p class="meta"><span class="tag">${esc(p.s)}</span>${p.d ? esc(p.d) : ''}${p.g ? ' · ' + esc(p.g) : ''} · pointer only</p>
        <p>${snippet(p.x || '', terms)}</p>
        <p>${link}</p></article>`);
    }
    results.innerHTML = frag.join('');
  }

  $('searchform').addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
  init();
})();
