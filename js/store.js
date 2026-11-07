/* Zapis stanu w localStorage (jeden klucz). Wszystko opakowane w try/catch –
 * w trybie prywatnym lub z zablokowanymi danymi strony aplikacja nadal działa, tylko bez pamięci. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Store = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KEY = 'wczasy.v1';

  function defaults() {
    return {
      profiles: [],   // [{id, name, type:'K'|'M'|'D', age, mustHave:[{id,text}]}] – zapamiętane na stałe
      sharedMust: [], // [{id,text}] – własne pozycje wspólne, na stałe
      hidden: {},     // {itemId:true} – ukryte pozycje domyślne
      checked: {},    // {klucz:true}
      trip: {
        address: '', place: null, from: '', to: '',
        transport: 'plane', laundry: 'machine', type: 'all-inclusive',
        weather: null,
        include: {},  // {personId:false} gdy dana osoba nie jedzie
        extras: {}    // {ownerId:[{id,text}]} – pozycje tylko na ten wyjazd
      }
    };
  }

  function uid() {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  }

  function load(storage) {
    const base = defaults();
    try {
      const raw = (storage || localStorage).getItem(KEY);
      if (!raw) return base;
      const d = JSON.parse(raw);
      return Object.assign(base, d, { trip: Object.assign(base.trip, d.trip || {}) });
    } catch (e) {
      return base;
    }
  }

  function save(state, storage) {
    try {
      (storage || localStorage).setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  return { KEY, defaults, uid, load, save };
});
