/* Lista krajów do wyboru (kody ISO 3166-1 alfa-2). Polskie nazwy z Intl.DisplayNames,
 * a gdy przeglądarka ich nie ma – ze słownika awaryjnego poniżej. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Countries = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Najczęstsze cele wyjazdów – na początku listy.
  const POPULAR = ['PL', 'TR', 'EG', 'GR', 'ES', 'IT', 'HR', 'BG', 'PT', 'AL', 'ME', 'TN', 'CY', 'MA', 'AE'];
  const OTHER = [
    'AT', 'BE', 'BA', 'BR', 'CZ', 'CH', 'CN', 'CU', 'DE', 'DK', 'DO', 'EE', 'FI', 'FR', 'GE', 'GB', 'HU', 'HK',
    'ID', 'IE', 'IS', 'IL', 'IN', 'JO', 'JP', 'KE', 'KR', 'LK', 'LT', 'LV', 'MT', 'MU', 'MV', 'MX', 'MK', 'NL',
    'NO', 'OM', 'RO', 'RS', 'SC', 'SE', 'SI', 'SK', 'TH', 'TZ', 'UA', 'US', 'VN', 'ZA'
  ];

  const FALLBACK = {
    PL: 'Polska', TR: 'Turcja', EG: 'Egipt', GR: 'Grecja', ES: 'Hiszpania', IT: 'Włochy', HR: 'Chorwacja',
    BG: 'Bułgaria', PT: 'Portugalia', AL: 'Albania', ME: 'Czarnogóra', TN: 'Tunezja', CY: 'Cypr', MA: 'Maroko',
    AE: 'Zjednoczone Emiraty Arabskie'
  };

  function nameOf(code) {
    try {
      const n = new Intl.DisplayNames(['pl'], { type: 'region' }).of(code);
      if (n && n !== code) return n;
    } catch (e) { /* brak wsparcia – słownik awaryjny */ }
    return FALLBACK[code] || code;
  }

  /** [{code, name}] – popularne w kolejności ustalonej, reszta alfabetycznie po polsku. */
  function list() {
    const mk = c => ({ code: c, name: nameOf(c) });
    return {
      popular: POPULAR.map(mk),
      other: OTHER.map(mk).sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    };
  }

  function name(code) {
    return code ? nameOf(code) : '';
  }

  return { list, name, POPULAR, OTHER };
});
