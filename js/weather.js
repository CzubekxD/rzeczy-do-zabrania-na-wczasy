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

  const norm = s => String(s || '').trim().replace(/\s+/g, ' ');
  const flat = s => norm(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');

  /** Warianty nazwy miejscowości: całość, potem człony po przecinku ("Alanya, Antalya" -> Alanya). */
  function cityQueries(city) {
    const full = norm(city);
    const parts = full.split(',').map(norm).filter(Boolean);
    return [full].concat(parts.filter(p => p !== full));
  }

  async function getJson(url, fetchFn) {
    const res = await fetchFn(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data && data.error) throw new Error(data.reason || 'błąd API');
    return data;
  }

  function geoUrl(name, countryCode) {
    return GEO + '?name=' + encodeURIComponent(name) + '&countryCode=' + encodeURIComponent(countryCode) +
      '&count=10&language=pl&format=json';
  }

  /** Wyniki z kraju, z trafionym kodem pocztowym na początku. */
  function pickResults(results, countryCode, postcode) {
    const pc = flat(postcode).replace(/\s/g, '');
    const list = (results || []).filter(r => !r.country_code || r.country_code === countryCode).map(r => ({
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      postcodes: r.postcodes || [],
      lat: r.latitude,
      lon: r.longitude,
      hit: !!pc && (r.postcodes || []).some(c => flat(c).replace(/\s/g, '') === pc)
    }));
    return list.sort((a, b) => Number(b.hit) - Number(a.hit));
  }

  /**
   * {country: kod ISO, city, postcode?} -> lista miejsc (najlepsze pierwsze).
   * Najpierw nazwa miejscowości w danym kraju, a gdy to nie da wyniku – sam kod pocztowy w tym kraju.
   */
  async function geocode(place, fetchFn) {
    const f = fetchFn || fetch.bind(globalThis);
    const country = norm(place && place.country).toUpperCase();
    const city = norm(place && place.city);
    const postcode = norm(place && place.postcode);
    if (!country) throw new Error('wybierz kraj');
    if (!city) throw new Error('wpisz miejscowość');
    const names = cityQueries(city).filter(q => q.length >= 2);
    if (postcode) names.push(postcode);
    for (const q of names) {
      const data = await getJson(geoUrl(q, country), f);
      const found = pickResults(data.results, country, postcode);
      if (found.length) return found;
    }
    throw new Error('nie znaleziono miejscowości „' + city + '” w wybranym kraju – sprawdź pisownię' +
      (postcode ? ' lub kod pocztowy' : ''));
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

  return { summarize, average, addYears, addDays, firstArchiveShift, cityQueries, pickResults, geocode, fetchWeather, dailyUrl };
});
