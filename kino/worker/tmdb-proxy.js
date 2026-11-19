// Cloudflare Worker: прокси к TMDB. Ключ TMDB живёт только здесь (Secret TMDB_TOKEN), в браузер не попадает.
// Settings -> Variables and Secrets:
//   TMDB_KEY        (Secret) — "API Key (v3)" с themoviedb.org/settings/api  (достаточно одного из двух)
//   TMDB_TOKEN      (Secret) — "API Read Access Token" (альтернатива ключу v3)
//   ALLOWED_ORIGINS (Text, необязательно) — адреса сайта через запятую, например https://org-va.com
const TMDB = 'https://api.themoviedb.org/3';
const PATH_OK = /^\/(trending\/(all|movie|tv)\/(day|week)|search\/(multi|movie|tv)|discover\/(movie|tv)|(movie|tv)\/\d{1,9}|genre\/(movie|tv)\/list)$/;
const PARAMS_OK = ['language', 'query', 'page', 'with_genres', 'with_original_language', 'sort_by', 'region'];

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = !allowed.length || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (allowed.length ? origin : '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin'
  };
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const h = cors(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'GET') return new Response('{"error":"method"}', { status: 405, headers: h });
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && origin && !allowed.includes(origin)) return new Response('{"error":"origin"}', { status: 403, headers: h });

    const url = new URL(req.url);
    if (!PATH_OK.test(url.pathname)) return new Response('{"error":"not found"}', { status: 404, headers: h });
    if (!env.TMDB_KEY && !env.TMDB_TOKEN) return new Response('{"error":"worker not configured"}', { status: 500, headers: h });

    const q = new URLSearchParams();
    for (const k of PARAMS_OK) { const v = url.searchParams.get(k); if (v) q.set(k, v.slice(0, 120)); }
    const ap = url.searchParams.get('append_to_response');
    if (ap === 'watch/providers') q.set('append_to_response', ap);
    q.set('include_adult', 'false'); // взрослый контент отключён всегда

    // Ключ добавляется только перед запросом к TMDB; в кэш-ключ и в ответ браузеру он не попадает
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
