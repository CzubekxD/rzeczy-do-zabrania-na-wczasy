/* Reguły pakowania: czyste funkcje, bez DOM. Działa w przeglądarce (window.PackRules)
 * i w Node (require) – dzięki temu da się je testować.
 *
 * Oznaczenia: wszystkie progi i wzory to propozycje (PROP) z raportu w reports/.
 * Zmiana jednej liczby nie wymaga ruszania logiki – stałe są w THRESHOLDS i WASH_CAP. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./plugs.js'));
  else root.PackRules = factory(root.Plugs);
})(typeof self !== 'undefined' ? self : this, function (Plugs) {
  'use strict';

  const CATS = [
    'Dokumenty', 'Pieniądze', 'Elektronika', 'Higiena', 'Apteczka i leki',
    'Ubrania', 'Obuwie', 'Plaża i słońce', 'Dziecko', 'Auto', 'Przed wyjściem z domu'
  ];

  // Okno prania: ile dni ubrań pakujemy, zanim zakładamy pranie.
  const WASH_CAP = { none: 14, hand: 5, machine: 7 };

  // Progi pogodowe (°C, dni).
  const THRESHOLDS = {
    swim: 22,        // strój kąpielowy, spodenki
    sandals: 24,     // sandały
    hot: 28,         // mniej skarpetek
    sunUv: 3,        // krem, kapelusz, okulary od indeksu UV
    fleece: 18,      // nocą poniżej – bluza/polar
    warmNight: 22,   // nocą poniżej – lekka bluza na wieczór/klimatyzację
    heavyJacket: 5,  // ciepła kurtka
    hatGloves: 3,    // czapka i rękawiczki
    rainJacket: 2,   // dni z deszczem -> lekka kurtka przeciwdeszczowa
    umbrella: 3
  };

  const DEFAULT_WEATHER = { tmax: 26, tmin: 18, rainDays: 1, uv: null, source: 'domyślnie' };

  function washWindow(days, laundry) {
    const cap = WASH_CAP[laundry] || WASH_CAP.none;
    return Math.max(1, Math.min(days, cap));
  }

  function num(v, fallback) {
    return typeof v === 'number' && isFinite(v) ? v : fallback;
  }

  function makeCtx(trip, persons) {
    const w = Object.assign({}, DEFAULT_WEATHER, trip.weather || {});
    const days = Math.max(1, Math.round(num(trip.days, 7)));
    const tmax = num(w.tmax, DEFAULT_WEATHER.tmax);
    const tmin = num(w.tmin, DEFAULT_WEATHER.tmin);
    const rainDays = num(w.rainDays, DEFAULT_WEATHER.rainDays);
    const uv = w.uv == null ? null : num(w.uv, null);
    const socket = Plugs ? Plugs.advice(trip.country, trip.countryName) : { show: true, note: '' };
    return {
      days,
      socket,
      W: washWindow(days, trip.laundry),
      laundry: trip.laundry || 'none',
      plane: trip.transport === 'plane',
      car: trip.transport === 'car',
      tmax, tmin, rainDays, uv,
      uvHigh: uv != null ? uv >= THRESHOLDS.sunUv : tmax >= 20,
      swim: tmax >= THRESHOLDS.swim,
      hot: tmax >= THRESHOLDS.hot,
      hasKids: (persons || []).some(isKid),
      hasBaby: (persons || []).some(isBaby)
    };
  }

  const isKid = p => p.type === 'D';
  const isBaby = p => p.type === 'D' && p.age === 'niemowle';
  const isAdult = p => p.type !== 'D';
  const notBaby = p => !isBaby(p);
  const kidBonus = p => (isKid(p) ? 1 : 0);

  // scope: 'shared' – raz na cały wyjazd; 'person' – dla każdej jadącej osoby.
  const ITEMS = [
    // ---- Dokumenty
    { id: 'doc-id', cat: 'Dokumenty', scope: 'person', name: 'Dowód osobisty lub paszport',
      note: 'W Schengen wystarczy dowód, poza nim paszport (UK: paszport + ETA). Dziecko ma własny dokument.' },
    { id: 'doc-ekuz', cat: 'Dokumenty', scope: 'person', name: 'Karta EKUZ', low: true,
      note: 'Ważna do daty na karcie; status sprawdzisz w mojeIKP. Dotyczy wyjazdów po UE.' },
    { id: 'doc-license', cat: 'Dokumenty', scope: 'person', name: 'Prawo jazdy', who: isAdult, when: c => c.car },
    { id: 'doc-tickets', cat: 'Dokumenty', scope: 'shared', name: 'Bilety / karty pokładowe', when: c => c.plane },
    { id: 'doc-hotel', cat: 'Dokumenty', scope: 'shared', name: 'Rezerwacja / voucher hotelu' },
    { id: 'doc-insurance', cat: 'Dokumenty', scope: 'shared', name: 'Ubezpieczenie podróżne (polisa i numer alarmowy)' },
    { id: 'doc-car', cat: 'Dokumenty', scope: 'shared', name: 'Dowód rejestracyjny i polisa OC', when: c => c.car },

    // ---- Pieniądze
    { id: 'money-cash', cat: 'Pieniądze', scope: 'shared', name: 'Gotówka w walucie lokalnej' },
    { id: 'money-card', cat: 'Pieniądze', scope: 'shared', name: 'Karta płatnicza + zapasowa' },
    { id: 'money-app', cat: 'Pieniądze', scope: 'shared', name: 'Aplikacja banku / BLIK', note: 'Sprawdź limity płatności za granicą.', low: true },

    // ---- Elektronika
    { id: 'el-phone', cat: 'Elektronika', scope: 'person', name: 'Telefon i ładowarka', who: isAdult },
    { id: 'el-powerbank', cat: 'Elektronika', scope: 'person', name: 'Powerbank', who: isAdult, carry: true, when: c => c.plane,
      note: 'Tylko w bagażu podręcznym; do 100 Wh bez zgody linii.' },
    { id: 'el-headphones', cat: 'Elektronika', scope: 'person', name: 'Słuchawki', who: isAdult, low: true },
    { id: 'el-adapter', cat: 'Elektronika', scope: 'shared', name: 'Adapter do gniazdek', low: true,
      when: c => c.socket.show, note: c => c.socket.note },
    { id: 'el-car', cat: 'Elektronika', scope: 'shared', name: 'Ładowarka samochodowa i uchwyt na telefon', when: c => c.car },

    // ---- Higiena
    { id: 'hy-tooth', cat: 'Higiena', scope: 'person', name: 'Szczoteczka do zębów' },
    { id: 'hy-paste', cat: 'Higiena', scope: 'shared', name: 'Pasta do zębów', liquid: true },
    { id: 'hy-deo', cat: 'Higiena', scope: 'person', name: 'Dezodorant', who: isAdult, liquid: true },
    { id: 'hy-comb', cat: 'Higiena', scope: 'person', name: 'Szczotka / grzebień', low: true },
    { id: 'hy-shampoo', cat: 'Higiena', scope: 'person', name: 'Szampon i żel pod prysznic', who: isAdult, liquid: true, low: true,
      note: 'Hotele all inclusive zwykle dają podstawowe kosmetyki.' },
    { id: 'hy-period', cat: 'Higiena', scope: 'person', name: 'Podpaski / tampony', who: p => p.type === 'K' },
    { id: 'hy-makeup', cat: 'Higiena', scope: 'person', name: 'Kosmetyki do makijażu i demakijażu', who: p => p.type === 'K', liquid: true, low: true },
    { id: 'hy-razor', cat: 'Higiena', scope: 'person', name: 'Golarka / maszynka', who: p => p.type === 'M', low: true },
    { id: 'hy-spf', cat: 'Higiena', scope: 'shared', name: 'Krem z filtrem SPF 30+', liquid: true, when: c => c.uvHigh,
      note: 'Dla dzieci SPF 50.' },
    { id: 'hy-after', cat: 'Higiena', scope: 'shared', name: 'Balsam po opalaniu', liquid: true, low: true, when: c => c.uvHigh },
    { id: 'hy-repellent', cat: 'Higiena', scope: 'shared', name: 'Repelent na komary', liquid: true, low: true, when: c => c.tmax >= 20 },

    // ---- Apteczka i leki
    { id: 'med-pain', cat: 'Apteczka i leki', scope: 'shared', name: 'Leki przeciwbólowe i na gorączkę' },
    { id: 'med-plaster', cat: 'Apteczka i leki', scope: 'shared', name: 'Plastry i opatrunki' },
    { id: 'med-stomach', cat: 'Apteczka i leki', scope: 'shared', name: 'Środek na biegunkę / żołądek' },
    { id: 'med-allergy', cat: 'Apteczka i leki', scope: 'shared', name: 'Lek na alergię', low: true },
    { id: 'med-thermo', cat: 'Apteczka i leki', scope: 'shared', name: 'Termometr', low: true, when: c => c.hasKids },
    { id: 'med-kids', cat: 'Apteczka i leki', scope: 'person', name: 'Lek na gorączkę dla dziecka (syrop / czopki)', who: isKid, liquid: true },

    // ---- Ubrania (każda osoba)
    { id: 'cl-underwear', cat: 'Ubrania', scope: 'person', name: 'Bielizna', who: notBaby, qty: (c, p) => c.W + 1 + kidBonus(p) },
    { id: 'cl-body', cat: 'Ubrania', scope: 'person', name: 'Body / koszulki', who: isBaby, qty: c => c.W + 2 },
    { id: 'cl-socks', cat: 'Ubrania', scope: 'person', name: 'Skarpetki',
      qty: (c, p) => (c.hot ? Math.ceil(c.W / 2) : Math.max(1, c.W - 1)) + kidBonus(p) },
    { id: 'cl-shirts', cat: 'Ubrania', scope: 'person', name: 'Koszulki', who: notBaby, qty: (c, p) => c.W + kidBonus(p) },
    { id: 'cl-shorts', cat: 'Ubrania', scope: 'person', name: 'Spodenki', when: c => c.swim,
      qty: (c, p) => Math.ceil(c.W / 2) + kidBonus(p) },
    { id: 'cl-trousers', cat: 'Ubrania', scope: 'person', name: 'Spodnie długie',
      qty: (c, p) => (c.swim ? 1 : Math.ceil(c.W / 3)) + kidBonus(p),
      note: c => (c.swim ? 'Jedna para na chłodniejszy wieczór.' : '') },
    { id: 'cl-dress', cat: 'Ubrania', scope: 'person', name: 'Sukienka / spódnica', who: p => p.type === 'K', when: c => c.swim,
      qty: c => Math.ceil(c.W / 3), low: true },
    { id: 'cl-pyjamas', cat: 'Ubrania', scope: 'person', name: 'Piżama', qty: (c, p) => (isKid(p) ? 2 : 1) },
    { id: 'cl-swim', cat: 'Ubrania', scope: 'person', name: 'Strój kąpielowy', when: c => c.swim, qty: () => 2,
      note: 'Dwa, żeby jeden zdążył wyschnąć.' },
    { id: 'cl-hoodie', cat: 'Ubrania', scope: 'person', name: 'Bluza / polar',
      when: c => c.tmin < THRESHOLDS.warmNight,
      qty: c => (c.tmin < THRESHOLDS.fleece ? Math.max(1, Math.ceil(c.W / 5)) : 1),
      note: c => (c.tmin < THRESHOLDS.fleece ? '' : 'Na wieczór i klimatyzację.') },
    { id: 'cl-rain', cat: 'Ubrania', scope: 'person', name: 'Lekka kurtka przeciwdeszczowa', when: c => c.rainDays >= THRESHOLDS.rainJacket },
    { id: 'cl-warm', cat: 'Ubrania', scope: 'person', name: 'Ciepła kurtka', when: c => c.tmin < THRESHOLDS.heavyJacket },
    { id: 'cl-hat-gloves', cat: 'Ubrania', scope: 'person', name: 'Czapka i rękawiczki', when: c => c.tmin < THRESHOLDS.hatGloves },

    // ---- Obuwie
    { id: 'sh-daily', cat: 'Obuwie', scope: 'person', name: 'Buty na co dzień', qty: () => 1 },
    { id: 'sh-flipflops', cat: 'Obuwie', scope: 'person', name: 'Klapki', when: c => c.swim, qty: () => 1 },
    { id: 'sh-sandals', cat: 'Obuwie', scope: 'person', name: 'Sandały', when: c => c.tmax >= THRESHOLDS.sandals, qty: () => 1, low: true },
    { id: 'sh-warm', cat: 'Obuwie', scope: 'person', name: 'Ciepłe, zamknięte buty', when: c => c.tmin < THRESHOLDS.heavyJacket, qty: () => 1 },

    // ---- Plaża i słońce
    { id: 'sun-hat', cat: 'Plaża i słońce', scope: 'person', name: 'Kapelusz / czapka z daszkiem', when: c => c.uvHigh },
    { id: 'sun-glasses', cat: 'Plaża i słońce', scope: 'person', name: 'Okulary przeciwsłoneczne', when: c => c.uvHigh, who: isAdult },
    { id: 'sun-towel', cat: 'Plaża i słońce', scope: 'person', name: 'Ręcznik plażowy', low: true, when: c => c.swim,
      note: 'Hotele all inclusive zwykle wydają ręczniki basenowe.' },
    { id: 'sun-bag', cat: 'Plaża i słońce', scope: 'shared', name: 'Torba plażowa', when: c => c.swim, low: true },
    { id: 'sun-umbrella', cat: 'Plaża i słońce', scope: 'shared', name: 'Parasol przeciwdeszczowy', low: true, when: c => c.rainDays >= THRESHOLDS.umbrella },

    // ---- Dziecko
    { id: 'kid-diapers', cat: 'Dziecko', scope: 'person', name: 'Pieluchy', who: isBaby, qty: c => 8 * c.days,
      note: 'Około 8 na dobę – dobierz do swojego dziecka.' },
    { id: 'kid-swim-diapers', cat: 'Dziecko', scope: 'person', name: 'Pieluchy do pływania', who: isBaby, when: c => c.swim, qty: c => c.days },
    { id: 'kid-wipes', cat: 'Dziecko', scope: 'person', name: 'Chusteczki nawilżane', who: isBaby },
    { id: 'kid-cream', cat: 'Dziecko', scope: 'person', name: 'Krem na pupę', who: isBaby, liquid: true },
    { id: 'kid-milk', cat: 'Dziecko', scope: 'person', name: 'Mleko / butelki / smoczek', who: isBaby, liquid: true },
    { id: 'kid-stroller', cat: 'Dziecko', scope: 'person', name: 'Wózek lub nosidło', who: isBaby },
    { id: 'kid-seat', cat: 'Dziecko', scope: 'person', name: 'Fotelik samochodowy', who: p => isKid(p) && p.age !== 'szkolne', when: c => c.car },
    { id: 'kid-float', cat: 'Dziecko', scope: 'person', name: 'Rękawki / kapok', who: p => isKid(p) && p.age === 'przedszkolak', when: c => c.swim },
    { id: 'kid-beach-toys', cat: 'Dziecko', scope: 'person', name: 'Zabawki plażowe', who: p => isKid(p) && !isBaby(p), when: c => c.swim, low: true },
    { id: 'kid-toy', cat: 'Dziecko', scope: 'person', name: 'Ulubiona zabawka / przytulanka', who: isKid },
    { id: 'kid-spare', cat: 'Dziecko', scope: 'person', name: 'Zapasowy komplet ubrań w bagażu podręcznym', who: isKid, when: c => c.plane, carry: true },
    { id: 'kid-books', cat: 'Dziecko', scope: 'person', name: 'Książki / gry na podróż', who: p => isKid(p) && !isBaby(p), low: true },

    // ---- Auto
    { id: 'car-kit', cat: 'Auto', scope: 'shared', name: 'Apteczka, trójkąt i kamizelka odblaskowa', when: c => c.car,
      note: 'Wyposażenie obowiązkowe zależy od kraju – sprawdź trasę.' },
    { id: 'car-snacks', cat: 'Auto', scope: 'shared', name: 'Woda i przekąski na drogę', when: c => c.car },

    // ---- Przed wyjściem z domu
    { id: 'home-water', cat: 'Przed wyjściem z domu', scope: 'shared', name: 'Zakręcić wodę i gaz' },
    { id: 'home-appliances', cat: 'Przed wyjściem z domu', scope: 'shared', name: 'Wyłączyć sprzęty z prądu' },
    { id: 'home-trash', cat: 'Przed wyjściem z domu', scope: 'shared', name: 'Wynieść śmieci i opróżnić lodówkę' },
    { id: 'home-lock', cat: 'Przed wyjściem z domu', scope: 'shared', name: 'Zamknąć okna i drzwi' },
    { id: 'home-plants', cat: 'Przed wyjściem z domu', scope: 'shared', name: 'Podlewanie roślin / kogoś poprosić', low: true }
  ];

  function resolve(v, c, p) {
    return typeof v === 'function' ? v(c, p) : v;
  }

  function toEntry(it, c, p) {
    const qty = it.qty ? it.qty(c, p) : null;
    return {
      id: it.id,
      cat: it.cat,
      name: it.name,
      qty,
      note: resolve(it.note, c, p) || '',
      liquid: !!(it.liquid && c.plane),
      carry: !!(it.carry && c.plane),
      low: !!it.low
    };
  }

  function visible(it, c) {
    return !it.when || it.when(c);
  }

  function byCategory(entries) {
    return CATS.map(cat => ({ cat, items: entries.filter(e => e.cat === cat) })).filter(g => g.items.length);
  }

  /** trip: {days, transport:'plane'|'car', laundry:'none'|'hand'|'machine', weather}
   *  persons: [{id, name, type:'K'|'M'|'D', age?}] – tylko osoby, które jadą.
   *  Zwraca {ctx, shared:[{cat, items}], people:[{person, groups:[{cat, items}]}]}. */
  function buildList(trip, persons) {
    const c = makeCtx(trip, persons);
    const shared = ITEMS.filter(it => it.scope === 'shared' && visible(it, c)).map(it => toEntry(it, c));
    const people = (persons || []).map(p => {
      const mine = ITEMS
        .filter(it => it.scope === 'person' && visible(it, c) && (!it.who || it.who(p)))
        .map(it => toEntry(it, c, p));
      return { person: p, groups: byCategory(mine) };
    });
    return { ctx: c, shared: byCategory(shared), people };
  }

  return { CATS, ITEMS, THRESHOLDS, WASH_CAP, DEFAULT_WEATHER, washWindow, makeCtx, buildList };
});
