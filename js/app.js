/* Interfejs. Wszystko budowane przez DOM API + textContent (bez innerHTML),
 * więc tekst wpisany przez użytkownika nigdy nie jest wykonywany jako HTML. */
(function () {
  'use strict';

  const S = Store.load();
  const countries = Countries.list();
  const countryOption = c => h('option', { value: c.code, selected: S.trip.country === c.code }, c.name);
  let placeResults = [];
  let status = { text: '', error: false };
  const $ = sel => document.querySelector(sel);
  const persist = () => Store.save(S);

  const TYPE_LABEL = { K: 'Kobieta', M: 'Mężczyzna', D: 'Dziecko' };
  const AGE_LABEL = { niemowle: 'Niemowlę (0–2)', przedszkolak: 'Przedszkolak (3–6)', szkolne: 'Szkolne (7+)' };

  function nodes(kids) {
    return kids.flat(Infinity)
      .filter(k => k != null && k !== false)
      .map(k => (k instanceof Node ? k : document.createTextNode(String(k))));
  }

  function mount(el, ...kids) {
    el.replaceChildren(...nodes(kids));
  }

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'value' || k === 'selected' || k === 'open' || k === 'disabled') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    el.append(...nodes(kids));
    return el;
  }

  function todayISO() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function tripDays() {
    const { from, to } = S.trip;
    if (from && to && to >= from) {
      return { n: Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1, known: true };
    }
    return { n: 7, known: false };
  }

  const activePersons = () => S.profiles.filter(p => S.trip.include[p.id] !== false);

  // ---------- wyjazd ----------
  function weatherText() {
    const w = S.trip.weather;
    if (!w) return 'Brak pogody – używam wartości domyślnych (ciepło, ok. 26°/18°). Sprawdź pogodę albo wpisz własne wartości.';
    const rain = w.rainDays === 1 ? '1 dzień z deszczem' : w.rainDays + ' dni z deszczem';
    return 'Średnio ' + w.tmax + '° w dzień, ' + w.tmin + '° w nocy, ' + rain + ' (' + w.source + ').';
  }

  function setStatus(text, error) {
    status = { text, error: !!error };
    const el = $('#wstatus');
    if (el) { el.textContent = text; el.className = 'status' + (error ? ' err' : ''); }
  }

  function manualWeather(key, raw) {
    const prev = S.trip.weather || Object.assign({}, PackRules.DEFAULT_WEATHER);
    const v = raw === '' ? null : Number(raw);
    S.trip.weather = Object.assign({}, prev, { [key]: v, source: 'ręcznie' });
    persist();
    $('#wsummary').textContent = weatherText();
    renderList();
  }

  function renderTrip() {
    const t = S.trip;
    const d = tripDays();
    const w = t.weather || {};
    const el = $('#trip');
    mount(el,
      h('h2', { id: 'h-trip' }, 'Wyjazd ', h('span', { class: 'chip' }, 'All inclusive')),
      h('label', { class: 'field row' }, 'Kraj',
        h('select', { id: 'country', onchange: e => { t.country = e.target.value; persist(); } },
          h('option', { value: '', selected: !t.country }, '— wybierz kraj —'),
          h('optgroup', { label: 'Popularne' }, countries.popular.map(countryOption)),
          h('optgroup', { label: 'Pozostałe' }, countries.other.map(countryOption)))),
      h('div', { class: 'row two' },
        h('label', { class: 'field' }, 'Miejscowość',
          h('input', {
            type: 'text', id: 'city', value: t.city, autocomplete: 'off', placeholder: 'np. Alanya',
            oninput: e => { t.city = e.target.value; persist(); }
          })),
        h('label', { class: 'field' }, 'Kod pocztowy (opcjonalnie)',
          h('input', {
            type: 'text', id: 'postcode', value: t.postcode, autocomplete: 'off', placeholder: 'np. 07400',
            oninput: e => { t.postcode = e.target.value; persist(); }
          }))),
      h('div', { class: 'row two' },
        h('label', { class: 'field' }, 'Od',
          h('input', { type: 'date', id: 'from', value: t.from, onchange: e => { t.from = e.target.value; if (t.to && t.to < t.from) t.to = t.from; persist(); renderTrip(); renderList(); } })),
        h('label', { class: 'field' }, 'Do',
          h('input', { type: 'date', id: 'to', value: t.to, min: t.from || false, onchange: e => { t.to = e.target.value; persist(); renderTrip(); renderList(); } }))),
      h('p', { class: 'status' }, d.known ? 'Dni: ' + d.n : 'Wybierz daty w kalendarzu – na razie liczę 7 dni.'),
      h('div', { class: 'row' },
        h('div', { class: 'field' }, 'Transport',
          h('div', { class: 'seg', role: 'radiogroup' },
            ['plane', 'car'].map(v => h('label', {},
              h('input', { type: 'radio', name: 'transport', value: v, checked: t.transport === v, onchange: () => { t.transport = v; persist(); renderList(); } }),
              v === 'plane' ? 'Samolot' : 'Auto')))),
        h('label', { class: 'field' }, 'Pranie na miejscu',
          h('select', { id: 'laundry', onchange: e => { t.laundry = e.target.value; persist(); renderList(); } },
            [['none', 'Brak – pakuję na cały pobyt'], ['hand', 'Ręczne (w umywalce)'], ['machine', 'Pralka']].map(([v, l]) =>
              h('option', { value: v, selected: t.laundry === v }, l))))),
      h('button', { type: 'button', id: 'fetch-weather', onclick: doWeather }, 'Sprawdź pogodę'),
      h('p', { id: 'wstatus', class: 'status' + (status.error ? ' err' : '') }, status.text),
      placeResults.length > 1 && h('label', { class: 'field row' }, 'Znalezione miejsca',
        h('select', { id: 'places', onchange: e => { t.place = Object.assign({ query: placeKey() }, placeResults[Number(e.target.value)]); persist(); doWeather(true); } },
          placeResults.map((r, i) => h('option', { value: i, selected: t.place && t.place.lat === r.lat && t.place.lon === r.lon },
            [r.name, r.admin1, r.postcodes[0], r.country].filter(Boolean).join(', '))))),
      h('div', { class: 'weather-box' },
        h('div', { id: 'wsummary' }, weatherText()),
        h('details', { id: 'wmanual' },
          h('summary', {}, 'Popraw pogodę ręcznie'),
          h('div', { class: 'wgrid' },
            [['tmax', 'Dzień (°C)'], ['tmin', 'Noc (°C)'], ['rainDays', 'Dni z deszczem'], ['uv', 'Indeks UV (opcjonalnie)']].map(([k, label]) =>
              h('label', { class: 'field' }, label,
                h('input', { type: 'number', inputmode: 'decimal', value: w[k] == null ? '' : w[k], 'data-w': k,
                  oninput: e => manualWeather(k, e.target.value) })))))));
  }

  const placeKey = () => [S.trip.country, S.trip.city.trim(), S.trip.postcode.trim()].join('|');

  async function doWeather(keepPlace) {
    const t = S.trip;
    if (!t.country) return setStatus('Wybierz kraj z listy.', true);
    if (!t.city.trim()) return setStatus('Wpisz miejscowość.', true);
    if (!t.from || !t.to || t.to < t.from) return setStatus('Wybierz daty od–do w kalendarzu.', true);
    const btn = $('#fetch-weather');
    if (btn) btn.disabled = true;
    setStatus('Sprawdzam pogodę…');
    try {
      if (keepPlace !== true && (!t.place || t.place.query !== placeKey())) {
        placeResults = await Weather.geocode({ country: t.country, city: t.city, postcode: t.postcode });
        t.place = Object.assign({ query: placeKey() }, placeResults[0]);
      }
      const w = await Weather.fetchWeather({ lat: t.place.lat, lon: t.place.lon, from: t.from, to: t.to, today: todayISO() });
      t.weather = w;
      persist();
      status = { text: 'Pogoda dla: ' + [t.place.name, t.place.admin1, t.place.country || Countries.name(t.country)].filter(Boolean).join(', ') + '.', error: false };
      renderTrip();
      renderList();
    } catch (e) {
      status = { text: 'Nie udało się pobrać pogody (' + e.message + '). Wpisz wartości ręcznie poniżej.', error: true };
      renderTrip();
      const det = $('#wmanual');
      if (det) det.open = true;
    }
  }

  // ---------- osoby ----------
  function addPerson(type) {
    const n = S.profiles.filter(p => p.type === type).length + 1;
    S.profiles.push({
      id: Store.uid(), type, mustHave: [],
      name: TYPE_LABEL[type] + (n > 1 ? ' ' + n : ''),
      age: type === 'D' ? 'przedszkolak' : null
    });
    persist(); renderPeople(); renderList();
  }

  function removePerson(p) {
    if (!confirm('Usunąć „' + p.name + '” razem z jej/jego zapamiętanymi pozycjami?')) return;
    S.profiles = S.profiles.filter(x => x.id !== p.id);
    delete S.trip.include[p.id];
    delete S.trip.extras[p.id];
    persist(); renderPeople(); renderList();
  }

  function renderPeople() {
    const el = $('#people');
    mount(el,
      h('h2', { id: 'h-people' }, 'Kto jedzie'),
      S.profiles.length === 0 && h('p', { class: 'empty' }, 'Dodaj osoby. Zapamiętam je na kolejne wyjazdy, a odznaczeniem wyłączysz tych, którzy tym razem zostają w domu.'),
      S.profiles.map(p => h('div', { class: 'person' },
        h('input', {
          type: 'checkbox', checked: S.trip.include[p.id] !== false, 'aria-label': 'Jedzie: ' + p.name,
          onchange: e => { S.trip.include[p.id] = e.target.checked; persist(); renderList(); }
        }),
        h('div', { class: 'fields' },
          h('input', { type: 'text', class: 'name', value: p.name, 'aria-label': 'Imię', oninput: e => { p.name = e.target.value; persist(); renderList(); } }),
          h('select', { 'aria-label': 'Typ', onchange: e => { p.type = e.target.value; p.age = p.type === 'D' ? (p.age || 'przedszkolak') : null; persist(); renderPeople(); renderList(); } },
            Object.entries(TYPE_LABEL).map(([v, l]) => h('option', { value: v, selected: p.type === v }, l))),
          p.type === 'D' && h('select', { 'aria-label': 'Wiek dziecka', onchange: e => { p.age = e.target.value; persist(); renderList(); } },
            Object.entries(AGE_LABEL).map(([v, l]) => h('option', { value: v, selected: p.age === v }, l)))),
        h('button', { type: 'button', class: 'ghost rm', onclick: () => removePerson(p) }, 'Usuń'))),
      h('div', { class: 'addrow' },
        h('button', { type: 'button', class: 'ghost', onclick: () => addPerson('K') }, '+ Kobieta'),
        h('button', { type: 'button', class: 'ghost', onclick: () => addPerson('M') }, '+ Mężczyzna'),
        h('button', { type: 'button', class: 'ghost', onclick: () => addPerson('D') }, '+ Dziecko')));
  }

  // ---------- lista ----------
  function updateProgress() {
    const boxes = document.querySelectorAll('#list .item input[type=checkbox]');
    const done = [...boxes].filter(b => b.checked).length;
    $('#progress-text').textContent = done + '/' + boxes.length;
    $('#progress-bar').style.width = (boxes.length ? Math.round(100 * done / boxes.length) : 0) + '%';
  }

  function itemRow(key, entry, onRemove, removeLabel) {
    return h('li', { class: 'item' + (entry.low ? ' low' : '') },
      h('label', {},
        h('input', {
          type: 'checkbox', checked: !!S.checked[key],
          onchange: e => { if (e.target.checked) S.checked[key] = true; else delete S.checked[key]; persist(); updateProgress(); }
        }),
        h('span', { class: 'text' },
          h('span', { class: 'name' }, entry.name,
            entry.qty != null && entry.qty > 1 && h('b', { class: 'qty' }, '×' + entry.qty),
            entry.liquid && h('span', { class: 'badge' }, '≤100 ml'),
            entry.carry && h('span', { class: 'badge' }, 'podręczny')),
          entry.note && h('span', { class: 'note' }, entry.note))),
      h('button', { type: 'button', class: 'x', 'aria-label': removeLabel + ': ' + entry.name, title: removeLabel, onclick: onRemove }, '✕'));
  }

  function mustSection(ownerId, permanentList, placeholder) {
    const extras = S.trip.extras[ownerId] || [];
    const rows = [];
    permanentList.forEach(m => rows.push(itemRow(ownerId + ':m:' + m.id, { name: m.text }, () => {
      permanentList.splice(permanentList.indexOf(m), 1); persist(); renderList();
    }, 'Usuń na stałe')));
    extras.forEach(m => rows.push(itemRow(ownerId + ':e:' + m.id, { name: m.text, note: 'Tylko ten wyjazd' }, () => {
      extras.splice(extras.indexOf(m), 1); persist(); renderList();
    }, 'Usuń')));
    const input = h('input', { type: 'text', 'aria-label': 'Nowa pozycja', placeholder, autocomplete: 'off' });
    const mode = h('select', { 'aria-label': 'Zapamiętać?' },
      h('option', { value: 'always' }, 'Zawsze (zapamiętaj)'),
      h('option', { value: 'trip' }, 'Tylko ten wyjazd'));
    const add = () => {
      const text = input.value.trim();
      if (!text) return;
      if (mode.value === 'always') permanentList.push({ id: Store.uid(), text });
      else (S.trip.extras[ownerId] = S.trip.extras[ownerId] || []).push({ id: Store.uid(), text });
      persist(); renderList();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    return [
      h('h3', {}, ownerId === 'shared' ? 'Własne wspólne' : 'Moje must-have'),
      rows.length > 0 && h('ul', { class: 'items' }, rows),
      h('div', { class: 'addmust' }, input, mode, h('button', { type: 'button', onclick: add }, 'Dodaj'))
    ];
  }

  function groupsView(ownerId, groups) {
    return groups.map(g => {
      const rows = g.items.filter(e => !S.hidden[e.id]);
      if (!rows.length) return null;
      return [
        h('h3', {}, g.cat),
        h('ul', { class: 'items' }, rows.map(e => itemRow(ownerId + ':' + e.id, e, () => {
          S.hidden[e.id] = true; persist(); renderList();
        }, 'Ukryj')))
      ];
    });
  }

  function renderList() {
    const people = activePersons();
    const d = tripDays();
    const trip = { days: d.n, transport: S.trip.transport, laundry: S.trip.laundry, weather: S.trip.weather };
    const result = PackRules.buildList(trip, people);
    const hiddenCount = Object.keys(S.hidden).length;
    const el = $('#list');

    mount(el,
      h('h2', { id: 'h-list', class: 'sr-only', hidden: true }, 'Lista do spakowania'),
      S.trip.transport === 'plane' && h('p', { class: 'hint' },
        'Samolot: płyny w bagażu podręcznym do 100 ml, w przezroczystej torebce 1 l. Część lotnisk ze skanerami CT luzuje limit – sprawdź lotnisko wylotu, powrotu i przesiadki.'),
      people.length === 0 && h('p', { class: 'hint' }, 'Nikt nie jedzie? Dodaj osoby wyżej – pokażę dla nich ubrania i rzeczy osobiste.'),
      h('details', { class: 'owner', open: true },
        h('summary', {}, 'Wspólne'),
        groupsView('shared', result.shared),
        mustSection('shared', S.sharedMust, 'np. gry planszowe')),
      result.people.map(({ person, groups }) => h('details', { class: 'owner', open: true },
        h('summary', {}, person.name || TYPE_LABEL[person.type]),
        groupsView(person.id, groups),
        mustSection(person.id, person.mustHave, 'np. sprzęt do soczewek, leki'))),
      hiddenCount > 0 && h('button', { type: 'button', class: 'restore', onclick: () => { S.hidden = {}; persist(); renderList(); } },
        'Przywróć ukryte pozycje (' + hiddenCount + ')'));
    updateProgress();
  }

  function reset() {
    if (!confirm('Odznaczyć wszystko i usunąć pozycje „tylko ten wyjazd”? Zapamiętane osoby i must-have zostaną.')) return;
    S.checked = {};
    S.trip.extras = {};
    persist(); renderList();
  }

  $('#reset').addEventListener('click', reset);
  renderTrip();
  renderPeople();
  renderList();
})();
