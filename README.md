# Na wczasy – lista rzeczy do spakowania

Prosta checklista na wakacje. Wpisujesz miejsce, daty, transport, pranie i osoby (K/M/D), a aplikacja
dobiera pozycje i ilości ubrań do długości wyjazdu oraz pogody.

**Wersja 1:** wyjazdy typu all inclusive. Czysty HTML/CSS/JS, bez budowania.

## Co robi

- Daty od–do z kalendarza, liczba dni liczona automatycznie.
- Pogoda z [Open-Meteo](https://open-meteo.com/) po wpisaniu miejsca: prognoza do ok. 15 dni naprzód,
  dalej średnia z trzech poprzednich lat dla tych samych dat. Wartości można poprawić ręcznie.
- Ilości ubrań z „okna prania” (pralka 7 dni, ręczne 5, brak – do 14) i progów pogodowych
  (kurtka, klapki, kapelusz, bluza…). Wzory i progi: `js/rules.js`.
- Osoby K/M/D (dziecko: niemowlę / przedszkolak / szkolne) zapamiętane na stałe; odznaczasz tych,
  którzy tym razem nie jadą.
- Rzeczy wspólne raz, osobiste pod imieniem każdej osoby.
- Własne pozycje: „zawsze” (zapamiętane przy osobie, np. sprzęt do soczewek) albo „tylko ten wyjazd”.
  Domyślne pozycje można ukryć i przywrócić.
- Samolot: znaczniki „≤100 ml” przy płynach i „podręczny” przy powerbanku.
- Jasny/ciemny motyw według ustawień telefonu. Dane zostają w przeglądarce (localStorage).

## Uruchomienie lokalnie

```bash
npm start        # serwer na http://localhost:8080 (wymaga python3)
npm test         # testy reguł i pogody (Node 20+)
```

Można też po prostu otworzyć `index.html`.

## GitHub Pages

Repo → Settings → Pages → Source: „Deploy from a branch”, gałąź domyślna, katalog `/ (root)`.

## Uwagi o danych

Reguły i progi to propozycje oparte na poradnikach i blogach, nie na jednym autorytatywnym źródle
(szczegóły i luki: `reports/Reguły pakowania na wakacje.md`). Zasady dotyczące płynów i dokumentów
zmieniają się – przed wyjazdem sprawdź stronę lotniska i linii.

## Licencja

MIT
