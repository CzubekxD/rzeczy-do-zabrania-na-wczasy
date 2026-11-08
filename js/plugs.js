/* Baza gniazdek elektrycznych w krajach z listy (kody ISO 3166-1 alfa-2).
 * types – typy gniazdek w użyciu (litery A–N), v – napięcie sieci w woltach,
 * fit  – czy polska wtyczka (C/F) wchodzi bez adaptera:
 *   'ok'      – tak (C/E/F),
 *   'partial' – zwykle tak, ale gniazdka bywają mieszane – adapter na wszelki wypadek,
 *   'no'      – nie, trzeba adaptera.
 * Dane z poradników (np. Światowa mapa wtyczek IEC) – to propozycja, nie źródło urzędowe. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Plugs = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EU = 230;
  const DATA = {
    // popularne
    PL: { types: 'CE', v: EU, fit: 'ok' }, TR: { types: 'CF', v: EU, fit: 'ok' }, EG: { types: 'CF', v: EU, fit: 'ok' },
    GR: { types: 'CF', v: EU, fit: 'ok' }, ES: { types: 'CF', v: EU, fit: 'ok' }, IT: { types: 'CFL', v: EU, fit: 'ok' },
    HR: { types: 'CF', v: EU, fit: 'ok' }, BG: { types: 'CF', v: EU, fit: 'ok' }, PT: { types: 'CF', v: EU, fit: 'ok' },
    AL: { types: 'CF', v: EU, fit: 'ok' }, ME: { types: 'CF', v: EU, fit: 'ok' }, TN: { types: 'CE', v: EU, fit: 'ok' },
    CY: { types: 'G', v: EU, fit: 'no' }, MA: { types: 'CE', v: EU, fit: 'ok' }, AE: { types: 'G', v: EU, fit: 'no' },
    // pozostałe
    AT: { types: 'CF', v: EU, fit: 'ok' }, BE: { types: 'CE', v: EU, fit: 'ok' }, BA: { types: 'CF', v: EU, fit: 'ok' },
    BR: { types: 'CN', v: '127/220', fit: 'ok' }, CZ: { types: 'CE', v: EU, fit: 'ok' }, CH: { types: 'CJ', v: EU, fit: 'ok' },
    CN: { types: 'ACI', v: EU, fit: 'partial' }, CU: { types: 'ABCL', v: '110/220', fit: 'partial', low: true },
    DE: { types: 'CF', v: EU, fit: 'ok' }, DK: { types: 'CEFK', v: EU, fit: 'ok' }, DO: { types: 'AB', v: 110, fit: 'no', low: true },
    EE: { types: 'CF', v: EU, fit: 'ok' }, FI: { types: 'CF', v: EU, fit: 'ok' }, FR: { types: 'CE', v: EU, fit: 'ok' },
    GE: { types: 'CF', v: EU, fit: 'ok' }, GB: { types: 'G', v: EU, fit: 'no' }, HU: { types: 'CF', v: EU, fit: 'ok' },
    HK: { types: 'G', v: EU, fit: 'no' }, ID: { types: 'CF', v: EU, fit: 'ok' }, IE: { types: 'G', v: EU, fit: 'no' },
    IS: { types: 'CF', v: EU, fit: 'ok' }, IL: { types: 'CH', v: EU, fit: 'partial' }, IN: { types: 'CDM', v: EU, fit: 'partial' },
    JO: { types: 'CDFGJ', v: EU, fit: 'partial' }, JP: { types: 'AB', v: 100, fit: 'no', low: true },
    KE: { types: 'G', v: EU, fit: 'no' }, KR: { types: 'CF', v: EU, fit: 'ok' }, LK: { types: 'DGM', v: EU, fit: 'no' },
    LT: { types: 'CF', v: EU, fit: 'ok' }, LV: { types: 'CF', v: EU, fit: 'ok' }, MT: { types: 'G', v: EU, fit: 'no' },
    MU: { types: 'CG', v: EU, fit: 'partial' }, MV: { types: 'DGJKL', v: EU, fit: 'no' }, MX: { types: 'AB', v: 127, fit: 'no', low: true },
    MK: { types: 'CF', v: EU, fit: 'ok' }, NL: { types: 'CF', v: EU, fit: 'ok' }, NO: { types: 'CF', v: EU, fit: 'ok' },
    OM: { types: 'G', v: EU, fit: 'no' }, RO: { types: 'CF', v: EU, fit: 'ok' }, RS: { types: 'CF', v: EU, fit: 'ok' },
    SC: { types: 'G', v: EU, fit: 'no' }, SE: { types: 'CF', v: EU, fit: 'ok' }, SI: { types: 'CF', v: EU, fit: 'ok' },
    SK: { types: 'CE', v: EU, fit: 'ok' }, TH: { types: 'ABCO', v: EU, fit: 'partial' }, TZ: { types: 'DG', v: EU, fit: 'no' },
    UA: { types: 'CF', v: EU, fit: 'ok' }, US: { types: 'AB', v: 120, fit: 'no', low: true }, VN: { types: 'ACG', v: EU, fit: 'partial' },
    ZA: { types: 'CDMN', v: EU, fit: 'partial' }
  };

  /** null, gdy kraju nie ma w bazie; inaczej {code, types:[…], v, fit, needAdapter, lowVoltage}. */
  function lookup(country) {
    const d = country && DATA[String(country).toUpperCase()];
    if (!d) return null;
    return {
      code: String(country).toUpperCase(),
      types: d.types.split(''),
      v: d.v,
      fit: d.fit,
      needAdapter: d.fit !== 'ok',
      lowVoltage: !!d.low
    };
  }

  /** Gotowa wskazówka do listy: {show, note}. Pozycja jest zawsze widoczna – notatka mówi,
   *  czy adapter jest potrzebny (żeby nie trzeba było tego szukać). */
  function advice(country, countryName) {
    const p = lookup(country);
    if (!p) return { show: true, note: 'Potrzebny w krajach z innymi gniazdkami niż typ C/F – sprawdź cel podróży.' };
    const where = countryName || p.code;
    const sockets = where + ': gniazdka typu ' + p.types.join('/') + ', ' + p.v + ' V.';
    if (!p.needAdapter) return { show: true, note: 'Nie potrzebujesz adaptera. ' + sockets + ' Polska wtyczka pasuje.' };
    let note = p.fit === 'partial'
      ? 'Adapter na wszelki wypadek. ' + sockets + ' Polska wtyczka zwykle pasuje, ale gniazdka bywają różne – weź adapter uniwersalny.'
      : 'Potrzebujesz adaptera. ' + sockets + ' Polska wtyczka nie pasuje.';
    if (p.lowVoltage) note += ' Niskie napięcie – sprawdź, czy ładowarki obsługują ' + p.v + ' V (zwykle 100–240 V).';
    return { show: true, note };
  }

  return { DATA, lookup, advice };
});
