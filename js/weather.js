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
      tminAbs: Math.round(Math.min(...tmin)), // najzimniejsza noc – ważniejsza dla kurtki niż średnia
      rainDays: rain.filter(x => x >= 1).length,
      uv: uv.length ? Math.round(Math.max(...uv)) : null
    };
  }

  function average(summaries) {
    const uvs = summaries.map(s => s.uv).filter(x => x != null);
    return {
      tmax: Math.round(mean(summaries.map(s => s.tmax))),
      tmin: Math.round(mean(summaries.map(s => s.tmin))),
      tminAbs: Math.round(mean(summaries.map(s => s.tminAbs))),
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


  // ---------- deszcz godzinowy (PROP: wszystkie progi to propozycje z reports/, nie dane ze źródeł) ----------
  const RAIN = {
    dayFrom: 7, dayTo: 22,   // okno dnia (godziny lokalne), nocny deszcz nas nie dotyczy
    minMm: 0.1,              // godzina „z deszczem”
    minProb: 30,             // % – poniżej godziny nie liczymy (gdy prognoza podaje prawdopodobieństwo)
    drizzle: 0.5,            // mm/h poniżej – mżawka
    heavy: 7.6,              // mm/h od – ulewny (próg AMS)
    heavyEpisodeSum: 15,     // mm w jednym epizodzie – ulewny
    showerMaxHours: 2,       // epizod do tylu godzin – przelotny
    gust: 40,                // km/h – silny wiatr
    softshellHours: 4,       // godzin deszczu w dniu, od których softshell
    softshellTmax: 18        // °C – przy deszczu chłodniej niż to: softshell
  };

  const TYPE_LABEL = { ulewny: 'ulewny deszcz', przelotny: 'przelotny deszcz', ciągły: 'deszcz ciągły', mżawka: 'mżawka' };

  /** hours: [{h, mm, showers, p}] posortowane po godzinie -> epizody (kolejne godziny z deszczem). */
  function buildEpisodes(hours) {
    const rainy = hours.filter(x => x.mm >= RAIN.minMm && (x.p == null || x.p >= RAIN.minProb));
    const eps = [];
    let cur = null;
    rainy.forEach(x => {
      if (cur && x.h === cur.to + 1) { cur.to = x.h; cur.list.push(x); } else { cur = { from: x.h, to: x.h, list: [x] }; eps.push(cur); }
    });
    return eps.map(e => {
      const sum = e.list.reduce((a, x) => a + x.mm, 0);
      const showers = e.list.reduce((a, x) => a + (x.showers || 0), 0);
      const maxMm = Math.max(...e.list.map(x => x.mm));
      const ps = e.list.map(x => x.p).filter(x => x != null);
      const len = e.to - e.from + 1;
      let type;
      if (maxMm >= RAIN.heavy || sum >= RAIN.heavyEpisodeSum) type = 'ulewny';
      else if (maxMm < RAIN.drizzle) type = 'mżawka';
      else if (len <= RAIN.showerMaxHours || (sum > 0 && showers / sum >= 0.5)) type = 'przelotny';
      else type = 'ciągły';
      return { from: e.from, to: e.to + 1, type, sum: round1(sum), maxMm: round1(maxMm), p: ps.length ? Math.max(...ps) : null };
    });
  }

  const round1 = x => Math.round(x * 10) / 10;
  const pad = n => String(n).padStart(2, '0');

  /** Podsumowanie jednego dnia + decyzje co zabrać. */
  function summarizeRainDay(date, hours) {
    const day = hours.filter(x => x.h >= RAIN.dayFrom && x.h < RAIN.dayTo);
    const episodes = buildEpisodes(day);
    const rainyHours = episodes.reduce((a, e) => a + (e.to - e.from), 0);
    const sum = round1(episodes.reduce((a, e) => a + e.sum, 0));
    const maxMm = episodes.length ? Math.max(...episodes.map(e => e.maxMm)) : 0;
    const pArr = episodes.map(e => e.p).filter(x => x != null);
    const pMax = pArr.length ? Math.max(...pArr) : null;
    const gusts = day.map(x => x.g).filter(x => x != null);
    const gust = gusts.length ? Math.max(...gusts) : 0;
    const temps = day.map(x => x.t).filter(x => x != null);
    const tmax = temps.length ? Math.max(...temps) : null;
    const heavy = maxMm >= RAIN.heavy || episodes.some(e => e.type === 'ulewny');
    const rain = rainyHours > 0;
    return {
      date, episodes, hours: rainyHours, sum, maxMm, pMax, gust, tmax, heavy,
      umbrella: rain && maxMm >= 0.5 && (pMax == null || pMax >= 40) && gust < RAIN.gust,
      rainJacket: rain && (rainyHours >= 2 || sum >= 2 || gust >= RAIN.gust),
      softshell: rain && (heavy || rainyHours >= RAIN.softshellHours || (tmax != null && tmax < RAIN.softshellTmax) || gust >= RAIN.gust)
    };
  }

  function episodeText(e) {
    return pad(e.from) + ':00–' + pad(e.to) + ':00 ' + TYPE_LABEL[e.type] + ', do ' + String(e.maxMm).replace('.', ',') + ' mm/h' +
      (e.p != null ? ', ' + e.p + '%' : '');
  }

  const dm = iso => iso.slice(8, 10) + '.' + iso.slice(5, 7);

  /** days: wynik summarizeRainDay dla każdego dnia -> {mode, days, advice, lines}. */
  function rainSummary(days) {
    const rainy = days.filter(d => d.hours > 0);
    const need = key => {
      const n = days.filter(d => d[key]).length;
      return n >= 2 || days.some(d => d[key] && d.heavy);
    };
    const advice = { umbrella: need('umbrella'), rainJacket: need('rainJacket'), softshell: need('softshell') };
    const lines = rainy.slice(0, 4).map(d => dm(d.date) + ' ' + d.episodes.map(episodeText).join('; '));
    if (rainy.length > 4) lines.push('…i ' + (rainy.length - 4) + ' kolejnych dni z deszczem');
    if (!rainy.length) lines.push('Bez istotnego deszczu w godz. ' + RAIN.dayFrom + ':00–' + RAIN.dayTo + ':00.');
    return { mode: 'hourly', days: rainy, advice, lines };
  }

  function hourlyUrl(lat, lon, from, to) {
    return FORECAST + '?latitude=' + lat + '&longitude=' + lon + '&start_date=' + from + '&end_date=' + to +
      '&hourly=precipitation,showers,precipitation_probability,wind_gusts_10m,temperature_2m&timezone=auto';
  }

  /** hourly: odpowiedź Open-Meteo (tablice time/precipitation/…) -> rainSummary. */
  function summarizeHourly(hourly) {
    const t = (hourly && hourly.time) || [];
    if (!t.length) throw new Error('brak danych godzinowych');
    const byDate = {};
    t.forEach((stamp, i) => {
      const date = stamp.slice(0, 10);
      (byDate[date] = byDate[date] || []).push({
        h: Number(stamp.slice(11, 13)),
        mm: nums([hourly.precipitation && hourly.precipitation[i]])[0] || 0,
        showers: nums([hourly.showers && hourly.showers[i]])[0] || 0,
        p: nums([hourly.precipitation_probability && hourly.precipitation_probability[i]])[0] ?? null,
        g: nums([hourly.wind_gusts_10m && hourly.wind_gusts_10m[i]])[0] ?? null,
        t: nums([hourly.temperature_2m && hourly.temperature_2m[i]])[0] ?? null
      });
    });
    return rainSummary(Object.keys(byDate).sort().map(d => summarizeRainDay(d, byDate[d])));
  }

  async function fetchHourlyRain(lat, lon, from, to, f) {
    const data = await getJson(hourlyUrl(lat, lon, from, to), f);
    return summarizeHourly(data.hourly);
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
      const start = from < today ? today : from;
      const [s, rain] = await Promise.all([
        fetchDaily(FORECAST, lat, lon, start, to, true, f),
        fetchHourlyRain(lat, lon, start, to, f).catch(() => null) // błąd godzin nie psuje reszty pogody
      ]);
      return Object.assign(s, { source: 'prognoza' }, rain ? { rain } : {});
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

  return { summarize, average, addYears, addDays, firstArchiveShift, cityQueries, pickResults, geocode, fetchWeather, dailyUrl,
    RAIN, buildEpisodes, summarizeRainDay, summarizeHourly, hourlyUrl };
});
