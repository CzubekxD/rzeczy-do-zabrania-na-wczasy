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
  assert.equal(find(p, 'cl-underwear').qty, 8);  // W=7, W+1
  assert.equal(find(p, 'cl-shirts').qty, 7);
  assert.equal(find(p, 'cl-socks').qty, 4);      // upał: ceil(7/2)
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
  assert.ok(find(p, 'cl-rain'));
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
  assert.equal(find(p, 'cl-underwear').qty, 9); // W+1+1
  assert.equal(find(p, 'cl-shirts').qty, 8);
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
  assert.deepEqual(s, { tmax: 30, tmin: 20, rainDays: 2, uv: 9 });
  assert.throws(() => W.summarize({ temperature_2m_max: [], temperature_2m_min: [] }));
});

test('weather.firstArchiveShift wybiera rok z danymi w archiwum', () => {
  assert.equal(W.firstArchiveShift('2026-08-20', '2026-06-01'), 1);
  assert.equal(W.firstArchiveShift('2027-08-20', '2026-06-01'), 2);
  assert.equal(W.addYears('2026-08-20', -2), '2024-08-20');
});

test('geocodeQueries: pełny tekst, potem człony adresu', () => {
  assert.deepEqual(W.geocodeQueries('Hotel X, Hurghada, Egipt'),
    ['Hotel X, Hurghada, Egipt', 'Hurghada', 'Egipt', 'Hotel X']);
  assert.deepEqual(W.geocodeQueries('Zakopane'), ['Zakopane']);
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
