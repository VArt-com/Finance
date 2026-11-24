// Cloudflare Worker для VArt Kino: прокси к TMDB + общий список ссылок («Бесплатно») с админ-входом.
// Settings -> Variables and Secrets:
//   TMDB_KEY        (Secret) — "API Key (v3)" с themoviedb.org/settings/api  (или TMDB_TOKEN — Read Access Token)
//   ADMIN_PASSWORD  (Secret) — пароль админа для добавления/удаления ссылок
//   YT_KEY          (Secret) — ключ YouTube Data API v3 (для списка фильмов плейлиста)
//   ALLOWED_ORIGINS (Text)   — адрес сайта, например https://org-va.com
// Settings -> Bindings -> KV namespace: переменная KINO_KV (список ссылок хранится здесь)
const TMDB = 'https://api.themoviedb.org/3';
const PATH_OK = /^\/(trending\/(all|movie|tv)\/(day|week)|search\/(multi|movie|tv)|discover\/(movie|tv)|(movie|tv)\/\d{1,9}|genre\/(movie|tv)\/list)$/;
const PARAMS_OK = ['language', 'query', 'page', 'with_genres', 'with_original_language', 'sort_by', 'region'];
const SOURCES = ['youtube', 'youtube-list', 'vimeo', 'dailymotion', 'archive'];
const REF_OK = /^[A-Za-z0-9._-]{3,80}$/;
const SRC_OK = /^https:\/\/(archive\.org|www\.youtube\.com|vimeo\.com|www\.dailymotion\.com)\//;
const MAX_LINKS = 500, MAX_FAILS = 8, LOCK_SECONDS = 900;

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = !allowed.length || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (allowed.length ? origin : '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status: status || 200, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function sha(s) { return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)))); }
async function safeEqual(a, b) {
  const x = await sha(a), y = await sha(b); let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}
// 'ok' | 'bad' | 'locked' | 'off'
async function checkPw(req, env, pw) {
  if (!env.ADMIN_PASSWORD || !env.KINO_KV) return 'off';
  const key = 'fail:' + (req.headers.get('CF-Connecting-IP') || 'x');
  const n = parseInt(await env.KINO_KV.get(key), 10) || 0;
  if (n >= MAX_FAILS) return 'locked';
  if (typeof pw === 'string' && pw && await safeEqual(pw, env.ADMIN_PASSWORD)) { if (n) await env.KINO_KV.delete(key); return 'ok'; }
  await env.KINO_KV.put(key, String(n + 1), { expirationTtl: LOCK_SECONDS });
  return 'bad';
}
async function getLinks(env) { try { const v = JSON.parse((await env.KINO_KV.get('links')) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }

function cleanItem(it) {
  if (!it || typeof it !== 'object') return null;
  const title = String(it.title || '').trim();
  const year = parseInt(it.year, 10);
  const lic = String(it.license || '').trim();
  if (!SOURCES.includes(it.source) || !REF_OK.test(String(it.ref || '')) || !SRC_OK.test(String(it.src || ''))) return null;
  if (title.length < 1 || title.length > 120 || lic.length > 200) return null;
  return { source: it.source, ref: String(it.ref), title, year: (year > 1850 && year < 2100) ? year : '', license: lic, src: String(it.src) };
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const h = cors(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && origin && !allowed.includes(origin)) return new Response('{"error":"origin"}', { status: 403, headers: h });
    const url = new URL(req.url);

    // ---- Общий список ссылок ----
    if (url.pathname === '/links' && req.method === 'GET') {
      if (!env.KINO_KV) return json({ items: [] }, 200, h);
      return json({ items: await getLinks(env) }, 200, h);
    }
    if (req.method === 'POST' && url.pathname.startsWith('/admin/')) {
      let body; try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400, h); }
      const st = await checkPw(req, env, body && body.pw);
      if (st !== 'ok') return json({ ok: false, error: st }, st === 'locked' ? 429 : 401, h);
      if (url.pathname === '/admin/login') return json({ ok: true }, 200, h);
      let list = await getLinks(env);
      if (url.pathname === '/admin/add') {
        const it = cleanItem(body.item); if (!it) return json({ ok: false, error: 'invalid' }, 400, h);
        list = list.filter(x => !(x.source === it.source && x.ref === it.ref));
        list.unshift({ id: crypto.randomUUID(), ...it, created: Date.now() });
        await env.KINO_KV.put('links', JSON.stringify(list.slice(0, MAX_LINKS)));
        return json({ ok: true }, 200, h);
      }
      if (url.pathname === '/admin/del') {
        await env.KINO_KV.put('links', JSON.stringify(list.filter(x => x.id !== String(body.id || ''))));
        return json({ ok: true }, 200, h);
      }
      return json({ ok: false, error: 'not found' }, 404, h);
    }

    // ---- Список фильмов плейлиста YouTube (только те, что можно встраивать) ----
    if (url.pathname === '/yt/playlist' && req.method === 'GET') {
      if (!env.YT_KEY) return json({ error: 'yt-off' }, 503, h);
      const list = url.searchParams.get('list') || '', pt = url.searchParams.get('page') || '';
      if (!/^[A-Za-z0-9_-]{10,60}$/.test(list) || (pt && !/^[A-Za-z0-9_-]{1,100}$/.test(pt))) return json({ error: 'bad' }, 400, h);
      const cache = typeof caches !== 'undefined' ? caches.default : null;
      const ck = new Request('https://kino.cache/yt2/' + list + '/' + pt);
      if (cache) { const hit = await cache.match(ck); if (hit) { const r = new Response(hit.body, hit); Object.entries(h).forEach(([a, b]) => r.headers.set(a, b)); return r; } }
      const Y = 'https://www.googleapis.com/youtube/v3/';
      const a = await fetch(Y + 'playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=' + list + (pt ? '&pageToken=' + pt : '') + '&key=' + env.YT_KEY);
      if (!a.ok) return json({ error: 'yt-' + a.status }, 502, h);
      const aj = await a.json();
      const ids = (aj.items || []).map(i => i.contentDetails && i.contentDetails.videoId).filter(v => /^[A-Za-z0-9_-]{11}$/.test(v || ''));
      const titles = {}; (aj.items || []).forEach(i => { if (i.contentDetails) titles[i.contentDetails.videoId] = (i.snippet && i.snippet.title) || ''; });
      let items = [];
      if (ids.length) {
        const b = await fetch(Y + 'videos?part=status,contentDetails&id=' + ids.join(',') + '&key=' + env.YT_KEY);
        if (!b.ok) return json({ error: 'yt-' + b.status }, 502, h);
        const bj = await b.json();
        items = (bj.items || []).filter(v => v.status && v.status.embeddable === true && v.status.privacyStatus === 'public' && !((v.contentDetails && v.contentDetails.contentRating && v.contentDetails.contentRating.ytRating) === 'ytAgeRestricted'))
          .map(v => ({ id: v.id, title: String(titles[v.id] || '').slice(0, 150) }));
        const order = {}; ids.forEach((v, i) => order[v] = i); items.sort((x, y) => order[x.id] - order[y.id]);
      }
      const out = new Response(JSON.stringify({ items, next: aj.nextPageToken || '', total: (aj.pageInfo && aj.pageInfo.totalResults) || 0 }), { status: 200, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
      if (cache) ctx.waitUntil(cache.put(ck, out.clone()));
      return out;
    }

    // ---- Прокси к TMDB ----
    if (req.method !== 'GET') return new Response('{"error":"method"}', { status: 405, headers: h });
    if (!PATH_OK.test(url.pathname)) return new Response('{"error":"not found"}', { status: 404, headers: h });
    if (!env.TMDB_KEY && !env.TMDB_TOKEN) return new Response('{"error":"worker not configured"}', { status: 500, headers: h });

    const q = new URLSearchParams();
    for (const k of PARAMS_OK) { const v = url.searchParams.get(k); if (v) q.set(k, v.slice(0, 120)); }
    const ap = url.searchParams.get('append_to_response');
    if (ap === 'watch/providers') q.set('append_to_response', ap);
    q.set('include_adult', 'false');

    const upQ = new URLSearchParams(q);
    if (env.TMDB_KEY) upQ.set('api_key', env.TMDB_KEY);

    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const key = new Request(TMDB + url.pathname + '?' + q.toString(), { method: 'GET' });
    if (cache) { const hit = await cache.match(key); if (hit) { const r = new Response(hit.body, hit); Object.entries(h).forEach(([a, b]) => r.headers.set(a, b)); return r; } }

    const headers = { Accept: 'application/json' };
    if (!env.TMDB_KEY) headers.Authorization = 'Bearer ' + env.TMDB_TOKEN;
    const up = await fetch(TMDB + url.pathname + '?' + upQ.toString(), { headers });
    const body = await up.text();
    const res = new Response(body, { status: up.status, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': up.ok ? 'public, max-age=3600' : 'no-store' } });
    if (cache && up.ok) ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  }
};
