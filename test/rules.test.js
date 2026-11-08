const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rules.js');
const W = require('../js/weather.js');

const hot = { tmax: 31, tmin: 23, rainDays: 0, uv: 9 };
const cold = { tmax: 4, tmin: -3, rainDays: 3, uv: 1 };
const adultM = { id: 'm', name: 'M', type: 'M' };
const adultK = { id: 'k', name: 'K', type: 'K' };
const baby = { id: 'b', name: 'B', type: 'D', age: 'niemowle' };
const kid = { id: 'd', name: 'D', type: 'D', age: 'przedszkolak' };

function find(list, id) {
  const all = list.groups ? list.groups.flatMap(g => g.items) : list.flatMap(g => g.items);
  return all.find(e => e.id === id);
}
const personList = (trip, person) => R.buildList(trip, [person]).people[0];

test('okno prania zależy od pralki i jest ograniczone liczbą dni', () => {
  assert.equal(R.washWindow(3, 'machine'), 3);
  assert.equal(R.washWindow(10, 'machine'), 7);
  assert.equal(R.washWindow(10, 'hand'), 5);
  assert.equal(R.washWindow(30, 'none'), 14);
  assert.equal(R.washWindow(0, 'none'), 1);
});

test('10 dni, upał, pralka: ilości ubrań dla dorosłego', () => {
  const p = personList({ days: 10, laundry: 'machine', transport: 'plane', weather: hot }, adultM);
  assert.equal(find(p, 'cl-underwear').qty, 9);  // W=7, upał: W+2
  assert.equal(find(p, 'cl-shirts').qty, 8);     // upał: W+1
  assert.equal(find(p, 'cl-socks').qty, 7);      // zawsze co najmniej tyle co dni prania
  assert.equal(find(p, 'cl-shorts').qty, 4);
  assert.equal(find(p, 'cl-swim').qty, 2);
  assert.ok(find(p, 'sh-flipflops'));
  assert.ok(find(p, 'sun-hat'));
  assert.equal(find(p, 'cl-warm'), undefined);
  assert.equal(find(p, 'cl-rain'), undefined);
});

test('mróz i deszcz: ciepła kurtka, czapka, brak klapek i stroju', () => {
  const p = personList({ days: 5, laundry: 'none', transport: 'car', weather: cold }, adultM);
  assert.ok(find(p, 'cl-warm'));
  assert.ok(find(p, 'cl-hat-gloves'));
  assert.ok(find(p, 'cl-softshell')); // 3 dni deszczu i zimno
  assert.equal(find(p, 'cl-rain'), undefined);
  assert.equal(find(p, 'sh-flipflops'), undefined);
  assert.equal(find(p, 'cl-swim'), undefined);
  assert.equal(find(p, 'cl-hoodie').qty, 1);
});

test('szczoteczka jest u każdej osoby, a pasta tylko raz wspólnie', () => {
  const r = R.buildList({ days: 7, laundry: 'machine', transport: 'plane', weather: hot }, [adultM, adultK, kid]);
  r.people.forEach(pp => assert.ok(find(pp, 'hy-tooth')));
  assert.ok(find(r.shared, 'hy-paste'));
  r.people.forEach(pp => assert.equal(find(pp, 'hy-paste'), undefined));
});

test('pozycje zależne od płci', () => {
  const trip = { days: 7, laundry: 'machine', transport: 'plane', weather: hot };
  assert.ok(find(personList(trip, adultK), 'hy-period'));
  assert.equal(find(personList(trip, adultM), 'hy-period'), undefined);
  assert.ok(find(personList(trip, adultM), 'hy-razor'));
});

test('niemowlę: pieluchy i body zamiast bielizny, fotelik tylko w aucie', () => {
  const plane = personList({ days: 7, laundry: 'machine', transport: 'plane', weather: hot }, baby);
  assert.equal(find(plane, 'kid-diapers').qty, 56);
  assert.equal(find(plane, 'cl-underwear'), undefined);
  assert.equal(find(plane, 'cl-body').qty, 9);
  assert.equal(find(plane, 'kid-seat'), undefined);
  const car = personList({ days: 7, laundry: 'machine', transport: 'car', weather: hot }, baby);
  assert.ok(find(car, 'kid-seat'));
});

test('dziecko dostaje zapas ubrań', () => {
  const p = personList({ days: 7, laundry: 'machine', transport: 'plane', weather: hot }, kid);
  assert.equal(find(p, 'cl-underwear').qty, 10); // upał W+2, dziecko +1
  assert.equal(find(p, 'cl-shirts').qty, 9);
  assert.ok(find(p, 'kid-float'));
});

test('samolot: znaczniki płynów i bagażu podręcznego, auto: bez nich', () => {
  const plane = R.buildList({ days: 7, laundry: 'machine', transport: 'plane', weather: hot }, [adultM]);
  assert.equal(find(plane.shared, 'hy-paste').liquid, true);
  assert.equal(find(plane.people[0], 'el-powerbank').carry, true);
  const car = R.buildList({ days: 7, laundry: 'machine', transport: 'car', weather: hot }, [adultM]);
  assert.equal(find(car.shared, 'hy-paste').liquid, false);
  assert.equal(find(car.people[0], 'el-powerbank'), undefined);
  assert.ok(find(car.shared, 'car-kit'));
});

test('brak pogody: domyślne wartości, bez wyjątków', () => {
  const r = R.buildList({ days: 7, laundry: 'machine', transport: 'plane' }, [adultM]);
  assert.equal(r.ctx.tmax, R.DEFAULT_WEATHER.tmax);
  assert.ok(find(r.people[0], 'cl-underwear'));
});

test('lista bez osób: tylko pozycje wspólne', () => {
  const r = R.buildList({ days: 7, laundry: 'machine', transport: 'plane', weather: hot }, []);
  assert.equal(r.people.length, 0);
  assert.ok(find(r.shared, 'doc-hotel'));
});

test('weather.summarize liczy średnie, dni z deszczem i max UV', () => {
  const s = W.summarize({
    temperature_2m_max: [30, 32, 28], temperature_2m_min: [20, 22, 18],
    precipitation_sum: [0, 2.5, 1], uv_index_max: [7, 9, 8]
  });
  assert.deepEqual(s, { tmax: 30, tmin: 20, tminAbs: 18, rainDays: 2, uv: 9 });
  assert.throws(() => W.summarize({ temperature_2m_max: [], temperature_2m_min: [] }));
});

test('weather.firstArchiveShift wybiera rok z danymi w archiwum', () => {
  assert.equal(W.firstArchiveShift('2026-08-20', '2026-06-01'), 1);
  assert.equal(W.firstArchiveShift('2027-08-20', '2026-06-01'), 2);
  assert.equal(W.addYears('2026-08-20', -2), '2024-08-20');
});

test('cityQueries: całość, potem człony po przecinku', () => {
  assert.deepEqual(W.cityQueries('Alanya, Antalya'), ['Alanya, Antalya', 'Alanya', 'Antalya']);
  assert.deepEqual(W.cityQueries('  Zakopane '), ['Zakopane']);
});

const geo = results => ({ results });
const r = (name, cc, postcodes, lat) => ({ name, country_code: cc, country: cc, postcodes, latitude: lat, longitude: 1 });

test('geocode: wysyła kod kraju i wybiera wynik z pasującym kodem pocztowym', async () => {
  const urls = [];
  const out = await W.geocode({ country: 'tr', city: 'Alanya', postcode: '07400' },
    fakeFetch(u => { urls.push(u); return geo([r('Alanya', 'TR', ['07000'], 1), r('Alanya', 'TR', ['07400'], 2)]); }));
  assert.ok(urls[0].includes('name=Alanya') && urls[0].includes('countryCode=TR'));
  assert.equal(out[0].lat, 2);
});

test('geocode: odrzuca wyniki z innego kraju', async () => {
  const out = await W.geocode({ country: 'PL', city: 'Rzym' },
    fakeFetch(() => geo([r('Rzym', 'IT', [], 1), r('Rzym', 'PL', [], 2)])));
  assert.equal(out.length, 1);
  assert.equal(out[0].lat, 2);
});

test('geocode: gdy miejscowość nic nie da, próbuje kodu pocztowego', async () => {
  const names = [];
  const out = await W.geocode({ country: 'TR', city: 'Alanyaa', postcode: '07400' },
    fakeFetch(u => { const n = new URL(u).searchParams.get('name'); names.push(n); return n === '07400' ? geo([r('Alanya', 'TR', ['07400'], 3)]) : {}; }));
  assert.deepEqual(names, ['Alanyaa', '07400']);
  assert.equal(out[0].lat, 3);
});

test('geocode: brak kraju, miejscowości lub wyniku daje czytelny błąd', async () => {
  await assert.rejects(W.geocode({ country: '', city: 'X' }, fakeFetch(() => ({}))), /wybierz kraj/);
  await assert.rejects(W.geocode({ country: 'TR', city: ' ' }, fakeFetch(() => ({}))), /wpisz miejscowość/);
  await assert.rejects(W.geocode({ country: 'TR', city: 'Nigdzie' }, fakeFetch(() => ({}))), /nie znaleziono/);
});

function fakeFetch(handler) {
  return async url => {
    const body = handler(url);
    return { ok: true, json: async () => body };
  };
}
const daily = (n, tmax, tmin, rain) => ({
  daily: {
    temperature_2m_max: Array(n).fill(tmax), temperature_2m_min: Array(n).fill(tmin),
    precipitation_sum: Array(n).fill(rain), uv_index_max: Array(n).fill(8)
  }
});

test('fetchWeather: bliski termin używa prognozy', async () => {
  const urls = [];
  const out = await W.fetchWeather(
    { lat: 1, lon: 2, from: '2026-06-05', to: '2026-06-10', today: '2026-06-01' },
    fakeFetch(u => { urls.push(u); return daily(6, 30, 20, 0); }));
  assert.equal(out.source, 'prognoza');
  assert.equal(out.tmax, 30);
  assert.ok(urls[0].startsWith('https://api.open-meteo.com/v1/forecast'));
});

test('fetchWeather: daleki termin uśrednia trzy lata z archiwum', async () => {
  const urls = [];
  const out = await W.fetchWeather(
    { lat: 1, lon: 2, from: '2026-08-10', to: '2026-08-20', today: '2026-06-01' },
    fakeFetch(u => { urls.push(u); return daily(11, 32, 22, 0); }));
  assert.equal(out.source, 'średnia z lat 2023–2025');
  assert.equal(urls.length, 3);
  assert.ok(urls.every(u => u.includes('archive-api.open-meteo.com')));
});

test('fetchWeather: błąd API przechodzi jako wyjątek z powodem', async () => {
  await assert.rejects(
    W.fetchWeather({ lat: 1, lon: 2, from: '2026-06-05', to: '2026-06-10', today: '2026-06-01' },
      fakeFetch(() => ({ error: true, reason: 'limit' }))),
    /limit/);
});

// ---------- adapter do gniazdek ----------
const P = require('../js/plugs.js');
const adapterFor = country => find(R.buildList({ days: 7, country, countryName: country }, [adultM]).shared, 'el-adapter');

test('adapter: kraje z gniazdkami C/E/F – pozycja widoczna z informacją, że adapter niepotrzebny', () => {
  ['PL', 'TR', 'EG', 'GR', 'ES', 'IT', 'DE', 'FR', 'tr'].forEach(c => {
    assert.ok(adapterFor(c), c);
    assert.match(adapterFor(c).note, /^Nie potrzebujesz adaptera/, c);
  });
});

test('adapter: UK, USA, Cypr, ZEA – pozycja widoczna z typem gniazdka', () => {
  ['GB', 'US', 'CY', 'AE', 'JP'].forEach(c => assert.ok(adapterFor(c), c));
  assert.match(adapterFor('GB').note, /typu G/);
  assert.match(adapterFor('CY').note, /^Potrzebujesz adaptera/);
  assert.match(adapterFor('CY').note, /nie pasuje/);
});

test('adapter: kraje mieszane (np. Indie, Tajlandia) – adapter „na wszelki wypadek”', () => {
  assert.match(adapterFor('IN').note, /na wszelki wypadek/);
  assert.match(adapterFor('TH').note, /na wszelki wypadek/);
});

test('adapter: USA/Japonia/Meksyk ostrzegają o niskim napięciu', () => {
  ['US', 'JP', 'MX'].forEach(c => assert.match(adapterFor(c).note, /napięcie/i, c));
  assert.doesNotMatch(adapterFor('GB').note, /napięcie/i);
});

test('adapter: brak kraju lub kraj spoza bazy – ogólna wskazówka', () => {
  assert.match(adapterFor('').note, /sprawdź cel podróży/);
  assert.match(adapterFor('XX').note, /sprawdź cel podróży/);
});

test('adapter: każdy kraj z listy wyboru jest w bazie gniazdek', () => {
  const C = require('../js/countries.js');
  const l = C.list();
  const missing = [...l.popular, ...l.other].map(c => c.code).filter(c => !P.lookup(c));
  assert.deepEqual(missing, []);
});

// ---------- ubrania vs pogoda: strefa przejściowa, niezmienniki ----------
const mild = { tmax: 20, tmin: 12, tminAbs: 8, rainDays: 1, uv: 4 };
const mildP = (days, laundry) => personList({ days, laundry, transport: 'car', weather: mild }, adultM);

test('strefa przejściowa 20°/12° (min. 8°): kurtka przejściowa, długi rękaw, spodenki, ciepła piżama', () => {
  const p = mildP(8, 'none');
  assert.ok(find(p, 'cl-softshell'));
  assert.ok(find(p, 'cl-longsleeve'));
  assert.ok(find(p, 'cl-shorts'));
  assert.match(find(p, 'cl-pyjamas').note, /Ciepła/);
  assert.equal(find(p, 'cl-rain'), undefined); // softshell zastępuje lekką kurtkę
});

test('niezmienniki: skarpetek co najmniej tyle co dni prania, bielizny nie mniej niż skarpetek, spodnie max 3', () => {
  [3, 7, 14, 30].forEach(days => ['none', 'hand', 'machine'].forEach(l => [hot, mild, cold].forEach(w => {
    const p = personList({ days, laundry: l, transport: 'car', weather: w }, adultM);
    const W = R.washWindow(days, l);
    assert.ok(find(p, 'cl-socks').qty >= W);
    assert.ok(find(p, 'cl-underwear').qty >= find(p, 'cl-socks').qty);
    assert.ok(find(p, 'cl-underwear').qty >= 3);
    assert.ok(find(p, 'cl-trousers').qty <= 3);
  })));
});

test('granice progów: najzimniejsza noc decyduje o ciepłej kurtce, czapce i szaliku', () => {
  const at = tminAbs => personList({ days: 5, transport: 'car', weather: { tmax: 12, tmin: 8, tminAbs, rainDays: 0 } }, adultM);
  assert.ok(find(at(4), 'cl-warm') && find(at(4), 'cl-hat-gloves'));
  assert.equal(find(at(5), 'cl-warm'), undefined);
  assert.equal(find(at(5), 'cl-hat-gloves'), undefined);
});

test('spodenki od 20°, strój kąpielowy od 22°', () => {
  const at = tmax => personList({ days: 5, transport: 'car', weather: { tmax, tmin: tmax - 8, rainDays: 0 } }, adultM);
  assert.ok(find(at(20), 'cl-shorts'));
  assert.equal(find(at(19), 'cl-shorts'), undefined);
  assert.equal(find(at(21), 'cl-swim'), undefined);
  assert.ok(find(at(22), 'cl-swim'));
});

test('1 dzień z deszczem bez danych godzinowych: lekka kurtka jest, parasola nie ma', () => {
  const r = R.buildList({ days: 5, transport: 'car', weather: { tmax: 25, tmin: 16, rainDays: 1, uv: 6 } }, [adultM]);
  assert.ok(find(r.people[0], 'cl-rain'));
  assert.equal(find(r.shared, 'sun-umbrella'), undefined);
});

// ---------- deszcz godzinowy ----------
const hrs = (date, spec, extra = {}) => Array.from({ length: 24 }, (_, h) => ({
  h, mm: spec[h] || 0, showers: 0, p: spec[h] ? 60 : 0, g: 10, t: 15, ...extra
}));

test('buildEpisodes: przelotny (≤2 h), ciągły (≥3 h), ulewny (≥7,6 mm/h), mżawka', () => {
  const day = [];
  const mk = (from, vals) => vals.forEach((mm, i) => day.push({ h: from + i, mm, showers: 0, p: 70 }));
  mk(8, [0.3, 1.2]);           // 8-10: przelotny
  mk(12, [1, 1, 1, 1]);        // 12-16: ciągły
  mk(18, [9]);                 // 18-19: ulewny
  mk(21, [0.2]);               // 21-22: mżawka
  const eps = W.buildEpisodes(day.sort((a, b) => a.h - b.h));
  assert.deepEqual(eps.map(e => e.type), ['przelotny', 'ciągły', 'ulewny', 'mżawka']);
  assert.equal(eps[0].p, 70);
});

test('buildEpisodes: godziny z niskim prawdopodobieństwem są pomijane', () => {
  const eps = W.buildEpisodes([{ h: 10, mm: 1, showers: 0, p: 10 }, { h: 11, mm: 1, showers: 0, p: 50 }]);
  assert.equal(eps.length, 1);
  assert.equal(eps[0].from, 11);
});

test('summarizeRainDay: noc poza oknem 7–22 nie liczy się', () => {
  const d = W.summarizeRainDay('2026-06-05', hrs('2026-06-05', { 2: 5, 3: 5 }));
  assert.equal(d.hours, 0);
  assert.equal(d.rainJacket, false);
});

test('summarizeRainDay: krótki przelotny deszcz = parasol, bez softshella; ulewa = softshell', () => {
  const light = W.summarizeRainDay('2026-06-05', hrs('2026-06-05', { 14: 1.5, 15: 1 }, { t: 22 }));
  assert.equal(light.episodes[0].type, 'przelotny');
  assert.equal(light.umbrella, true);
  assert.equal(light.softshell, false);
  const heavy = W.summarizeRainDay('2026-06-06', hrs('2026-06-06', { 14: 9 }));
  assert.equal(heavy.heavy, true);
  assert.equal(heavy.softshell, true);
});

test('summarizeHourly: jeden przelotny dzień nie włącza kurtki, ulewa tak; tekst ma godziny, mm/h i %', () => {
  const build = spec => {
    const rows = hrs('2026-06-05', spec);
    return {
      time: rows.map(r => '2026-06-05T' + String(r.h).padStart(2, '0') + ':00'),
      precipitation: rows.map(r => r.mm), showers: rows.map(() => 0),
      precipitation_probability: rows.map(r => r.p), wind_gusts_10m: rows.map(() => 10), temperature_2m: rows.map(() => 15)
    };
  };
  const one = W.summarizeHourly(build({ 14: 1.5, 15: 1 }));
  assert.equal(one.advice.rainJacket, false);
  assert.match(one.lines[0], /05\.06 14:00–16:00 przelotny deszcz, do 1,5 mm\/h, 60%/);
  const storm = W.summarizeHourly(build({ 14: 9 }));
  assert.equal(storm.advice.softshell, true);
  assert.equal(W.summarizeHourly(build({})).lines[0].startsWith('Bez istotnego deszczu'), true);
});

test('fetchWeather: prognoza dokłada dane godzinowe, a ich błąd nie psuje pogody', async () => {
  const hourlyBody = { hourly: { time: ['2026-06-05T14:00', '2026-06-05T15:00'], precipitation: [9, 0],
    showers: [0, 0], precipitation_probability: [80, 0], wind_gusts_10m: [10, 10], temperature_2m: [15, 15] } };
  const opts = { lat: 1, lon: 2, from: '2026-06-05', to: '2026-06-05', today: '2026-06-01' };
  const ok = await W.fetchWeather(opts, fakeFetch(u => (u.includes('hourly=') ? hourlyBody : daily(1, 20, 10, 0))));
  assert.equal(ok.rain.mode, 'hourly');
  assert.equal(ok.rain.advice.softshell, true);
  const bad = await W.fetchWeather(opts, fakeFetch(u => (u.includes('hourly=') ? { error: true, reason: 'x' } : daily(1, 20, 10, 0))));
  assert.equal(bad.rain, undefined);
  assert.equal(bad.tmax, 20);
});

test('softshell/kurtka z godzin deszczu zastępuje regułę dni z deszczem', () => {
  const weather = { tmax: 24, tmin: 15, tminAbs: 15, rainDays: 5, rain: { mode: 'hourly', lines: ['x'], advice: { umbrella: false, rainJacket: false, softshell: false } } };
  const r = R.buildList({ days: 5, transport: 'car', weather }, [adultM]);
  assert.equal(find(r.people[0], 'cl-rain'), undefined);
  assert.equal(find(r.shared, 'sun-umbrella'), undefined);
});
