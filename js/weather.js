/* Pogoda z Open-Meteo (bez klucza, z przeglądarki). Czyste funkcje + cienkie wywołania fetch,
 * którym można podać własny fetch (testy). Endpointy nie były sprawdzone w sesji deweloperskiej
 * (sieć zablokowana) – dlatego każdy błąd kończy się komunikatem i ręcznym wpisem w aplikacji. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Weather = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST = 'https://api.open-meteo.com/v1/forecast';
  const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
  const FORECAST_DAYS = 15; // dziś + 15 dni
  const DAY = 864e5;

  const toMs = iso => Date.parse(iso + 'T00:00:00Z');
  const toIso = ms => new Date(ms).toISOString().slice(0, 10);
  const addDays = (iso, n) => toIso(toMs(iso) + n * DAY);

  function addYears(iso, n) {
    const d = new Date(toMs(iso));
    d.setUTCFullYear(d.getUTCFullYear() + n);
    return d.toISOString().slice(0, 10);
  }

  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const nums = a => (a || []).filter(x => typeof x === 'number' && isFinite(x));

  /** daily: odpowiedź Open-Meteo (pola *_max/min/sum jako tablice). */
  function summarize(daily) {
    const tmax = nums(daily.temperature_2m_max);
    const tmin = nums(daily.temperature_2m_min);
    if (!tmax.length || !tmin.length) throw new Error('brak danych temperatury');
    const rain = nums(daily.precipitation_sum);
    const uv = nums(daily.uv_index_max);
    return {
      tmax: Math.round(mean(tmax)),
      tmin: Math.round(mean(tmin)),
      rainDays: rain.filter(x => x >= 1).length,
      uv: uv.length ? Math.round(Math.max(...uv)) : null
    };
  }

  function average(summaries) {
    const uvs = summaries.map(s => s.uv).filter(x => x != null);
    return {
      tmax: Math.round(mean(summaries.map(s => s.tmax))),
      tmin: Math.round(mean(summaries.map(s => s.tmin))),
      rainDays: Math.round(mean(summaries.map(s => s.rainDays))),
      uv: uvs.length ? Math.round(mean(uvs)) : null
    };
  }

  /** Najmniejsze k>=1 takie, że data sprzed k lat jest już w archiwum (co najmniej 6 dni temu). */
  function firstArchiveShift(to, today) {
    const limit = addDays(today, -6);
    let k = 1;
    while (addYears(to, -k) > limit) k++;
    return k;
  }

  /** Warianty zapytania dla geokodera: pełny tekst, potem kolejne człony po przecinku. */
  function geocodeQueries(address) {
    const full = address.trim().replace(/\s+/g, ' ');
    const parts = full.split(',').map(s => s.trim()).filter(Boolean);
    const out = [full];
    parts.slice(1).concat(parts.slice(0, 1)).forEach(p => {
      if (!out.includes(p)) out.push(p);
    });
    return out;
  }

  async function getJson(url, fetchFn) {
    const res = await fetchFn(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data && data.error) throw new Error(data.reason || 'błąd API');
    return data;
  }

  async function geocode(address, fetchFn) {
    const f = fetchFn || fetch.bind(globalThis);
    for (const q of geocodeQueries(address)) {
      const url = GEO + '?name=' + encodeURIComponent(q) + '&count=5&language=pl&format=json';
      const data = await getJson(url, f);
      if (data.results && data.results.length) {
        return data.results.map(r => ({
          name: r.name,
          admin1: r.admin1 || '',
          country: r.country || '',
          lat: r.latitude,
          lon: r.longitude
        }));
      }
    }
    throw new Error('nie znaleziono miejsca „' + address.trim() + '”');
  }

  function dailyUrl(base, lat, lon, from, to, withUv) {
    const vars = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'];
    if (withUv) vars.push('uv_index_max');
    return base + '?latitude=' + lat + '&longitude=' + lon + '&start_date=' + from + '&end_date=' + to +
      '&daily=' + vars.join(',') + '&timezone=auto';
  }

  async function fetchDaily(base, lat, lon, from, to, withUv, f) {
    const data = await getJson(dailyUrl(base, lat, lon, from, to, withUv), f);
    if (!data.daily) throw new Error('brak danych w odpowiedzi');
    return summarize(data.daily);
  }

  /** {lat, lon, from, to, today} (daty ISO) -> {tmax, tmin, rainDays, uv, source} */
  async function fetchWeather(opts, fetchFn) {
    const f = fetchFn || fetch.bind(globalThis);
    const { lat, lon, from, to, today } = opts;
    if (to < today) {
      const s = await fetchDaily(ARCHIVE, lat, lon, from, to, false, f);
      return Object.assign(s, { source: 'dane historyczne' });
    }
    if (to <= addDays(today, FORECAST_DAYS)) {
      const s = await fetchDaily(FORECAST, lat, lon, from < today ? today : from, to, true, f);
      return Object.assign(s, { source: 'prognoza' });
    }
    const k0 = firstArchiveShift(to, today);
    const years = [k0, k0 + 1, k0 + 2];
    const results = await Promise.allSettled(
      years.map(k => fetchDaily(ARCHIVE, lat, lon, addYears(from, -k), addYears(to, -k), false, f))
    );
    const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!ok.length) throw results[0].reason;
    const y = years.map(k => addYears(to, -k).slice(0, 4)).sort();
    return Object.assign(average(ok), { source: 'średnia z lat ' + y[0] + '–' + y[y.length - 1] });
  }

  return { summarize, average, addYears, addDays, firstArchiveShift, geocodeQueries, geocode, fetchWeather, dailyUrl };
});
