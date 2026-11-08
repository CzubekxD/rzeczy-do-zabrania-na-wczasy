# Audyt logiki ilości ubrań (lista UBRANIA) vs pogoda

Repo: /home/user/rzeczy-do-zabrania-na-wczasy (commit 791ebb1). Źródła: kod (`js/rules.js`, `js/app.js`, `js/weather.js`, `js/store.js`), `test/rules.test.js`, `README.md`, `reports/Reguły pakowania na wakacje.md`. Wszystkie odwołania są w formacie plik:linia (lokalne, brak URL-i). Tabele scenariuszy wygenerowano uruchamiając `buildList` w Node (skrypt: /tmp/claude-0/-home-user-rzeczy-do-zabrania-na-wczasy/aa4dbb69-52df-5db8-a728-c3a156eb8259/scratchpad/scen.js); `npm test` = 26/26 przechodzi. Żaden plik repo nie został zmieniony.

## 1. Jak dokładnie powstają ilości w UBRANIACH (wzory, progi, plik:linia)

### Takeaway
Ilość większości ubrań zależy od jednej liczby W (okno prania = min(dni, limit zależny od prania), `rules.js:36-39`), a pogoda działa głównie przez progi włącz/wyłącz oraz przełączniki wzoru (upał: skarpetki i spodnie; tmin<18: ilość bluz). Przykład użytkownika (Bielizna ×9, Skarpetki ×7, Koszulki ×8, Spodnie ×3, Piżama bez ilości, Bluza ×2) odtwarza się dokładnie dla 8 dni, pranie „Brak”, 20°/12°, 1 dzień deszczu (W=8).

### Cited Findings
**Liczba dni (skąd bierze się D)**
- `tripDays()` = (Do − Od) w dniach + 1, włącznie z oboma końcami; bez poprawnych dat domyślnie 7 dni i komunikat „na razie liczę 7 dni” — `js/app.js:46-52`, komunikat `app.js:107`. W `makeCtx` dodatkowo `days = max(1, round(trip.days, domyślnie 7))` — `rules.js:47`.
- Dni liczone są kalendarzowo (bez rozróżnienia dnia przyjazdu/wyjazdu, noclegów, liczby dni „w drodze”).

**Okno prania W**
- `WASH_CAP = { none: 14, hand: 5, machine: 7 }` — `rules.js:18`; `washWindow = max(1, min(days, cap))` — `rules.js:36-39`. Test: `rules.test.js:19-25`.
- Domyślne pranie w nowym stanie aplikacji to `machine` (W max 7) — `js/store.js:21`. Etykieta w UI: „Brak – pakuję na cały pobyt / Ręczne (w umywalce) / Pralka” — `app.js:116`.
- Brak ostrzeżenia, gdy pobyt >14 dni bez prania (raport proponował je; w kodzie go nie ma — grep: brak).

**Pogoda wchodząca do reguł (`makeCtx`, `rules.js:45-67`)**
- tmax, tmin = ŚREDNIE (zaokrąglone) z dziennych max/min z całego wyjazdu (`weather.js:30-42`). rainDays = liczba dni z opadem ≥ 1 mm (`weather.js:39`); przy średniej z 3 lat archiwum — zaokrąglona średnia (`weather.js:44-52`). uv = max z okresu (prognoza) lub średnia z max (archiwum); w archiwum UV nie jest w ogóle pobierane (`weather.js:140,150`, `withUv=false`) → uv=null → `uvHigh` spada do reguły `tmax ≥ 20` (`rules.js:61`).
- Flagi: `swim = tmax ≥ 22`, `hot = tmax ≥ 28`, `uvHigh = uv≥3 lub (uv==null i tmax≥20)` — `rules.js:21-32, 61-63`.
- Domyślna pogoda bez danych: 26°/18°, 1 dzień deszczu — `rules.js:34`.
- Progi (`THRESHOLDS`, `rules.js:21-32`): swim 22, sandals 24, hot 28, sunUv 3, fleece 18, warmNight 22, heavyJacket 5, hatGloves 3, rainJacket 2, umbrella 3.

**Formuły pozycji ubraniowych** (`rules.js:126-147`; `kidBonus` = +1 dla dziecka, `rules.js:73`)
| Pozycja | Warunek pojawienia się | Ilość | Linia |
|---|---|---|---|
| Bielizna (nie niemowlę) | zawsze | W + 1 (+1 dziecko) | 126 |
| Body/koszulki (niemowlę) | niemowlę | W + 2 | 127 |
| Skarpetki | zawsze | hot (tmax≥28): ceil(W/2); inaczej max(1, W−1); +1 dziecko | 128-129 |
| Koszulki (nie niemowlę) | zawsze | W (+1 dziecko) | 130 |
| Spodenki | swim (tmax≥22) | ceil(W/2) (+1 dziecko) | 131-132 |
| Spodnie długie | zawsze | swim: 1; inaczej ceil(W/3) (+1 dziecko); BEZ górnego limitu | 133-135 |
| Sukienka/spódnica (tylko K) | swim | ceil(W/3), oznaczone jako „low” | 136-137 |
| Piżama | zawsze | 1 (dziecko 2); UI nie pokazuje „×” gdy ilość ≤1 → „Piżama” bez liczby | 138; UI `app.js:223` |
| Strój kąpielowy | swim | 2 | 139-140 |
| Bluza / polar | tmin < 22 | tmin<18: max(1, ceil(W/5)); 18≤tmin<22: 1 („Na wieczór i klimatyzację”) | 141-144 |
| Lekka kurtka przeciwdeszczowa | rainDays ≥ 2 | bez ilości (1) | 145 |
| Ciepła kurtka | tmin < 5 | bez ilości | 146 |
| Czapka i rękawiczki | tmin < 3 | bez ilości | 147 |
| Buty: na co dzień / klapki (swim) / sandały (tmax≥24) / ciepłe zamknięte (tmin<5) | — | 1 | 150-153 |
| Kapelusz, okulary (dorośli) | uvHigh | — | 156-157 |
| Parasol (wspólny) | rainDays ≥ 3 | — | 161 |

**Istniejące testy dot. ubrań** (`test/rules.test.js`)
- `:19-25` washWindow. `:27-38` 10 dni, upał, pralka: bielizna 8, koszulki 7, skarpetki 4, spodenki 4, strój 2, klapki, kapelusz, brak ciepłej kurtki i przeciwdeszczowej. `:40-48` mróz+deszcz: ciepła kurtka, czapka, kurtka przeciwdeszczowa, brak klapek/stroju, bluza ×1. `:64-72` niemowlę (body 9). `:74-79` dziecko: bielizna 9, koszulki 8.
- Brak testów dla: spodni, piżamy, strojów w innych progach, granic progów (np. tmin 18/22, rainDays 1/2), przypadku „umiarkowanie” (12–20°), bluzy ×2+, dni>W, walidacji spójności (np. skarpetki ≤ bielizna).

**Tabela scenariuszy – dorosły (M), samolot, uv=null.** W = okno prania; „✓” = pozycja bez ilości. Dla pranie=Brak W=dni (14 dni → W=14); dla pralki W=min(dni,7) – 14 dni daje identyczne liczby jak 7 dni (patrz niżej). Kolumny: Bie=Bielizna, Sk=Skarpetki, Kosz=Koszulki, Spod=Spodenki, SpDł=Spodnie długie, Piż=Piżama, Bluza, Kurt-dsz=lekka kurtka przeciwdeszczowa (rain 3 dni), Ciepła, Czap=czapka+rękawiczki, Kapel=kapelusz, Parasol. „rain” 0 lub 3 dni.

Pranie = BRAK:
| Dni | tmax/tmin | rain | W | Bie | Sk | Kosz | Spod | SpDł | Piż | Strój | Bluza | Kurt-dsz | Ciepła | Czap | Kapel | Parasol |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 5/0 | 0 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | - | ✓ | ✓ | - | - |
| 3 | 5/0 | 3 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | ✓ | ✓ | ✓ | - | - |
| 3 | 12/5 | 0 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | - | - | - | - | - |
| 3 | 12/5 | 3 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | ✓ | - | - | - | - |
| 3 | 20/12 | 0 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | - | - | - | ✓ | - |
| 3 | 20/12 | 3 | 3 | 4 | 2 | 3 | - | 1 | ✓ | - | ✓ | ✓ | - | - | ✓ | - |
| 3 | 30/20 | 0 | 3 | 4 | 2 | 3 | 2 | 1 | ✓ | 2 | ✓ | - | - | - | ✓ | - |
| 3 | 30/20 | 3 | 3 | 4 | 2 | 3 | 2 | 1 | ✓ | 2 | ✓ | ✓ | - | - | ✓ | - |
| 7 | 5/0 | 0 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | - | ✓ | ✓ | - | - |
| 7 | 5/0 | 3 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | ✓ | ✓ | ✓ | - | - |
| 7 | 12/5 | 0 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | - | - | - | - | - |
| 7 | 12/5 | 3 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | ✓ | - | - | - | - |
| 7 | 20/12 | 0 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | - | - | - | ✓ | - |
| 7 | 20/12 | 3 | 7 | 8 | 6 | 7 | - | 3 | ✓ | - | 2 | ✓ | - | - | ✓ | - |
| 7 | 30/20 | 0 | 7 | 8 | 4 | 7 | 4 | 1 | ✓ | 2 | ✓ | - | - | - | ✓ | - |
| 7 | 30/20 | 3 | 7 | 8 | 4 | 7 | 4 | 1 | ✓ | 2 | ✓ | ✓ | - | - | ✓ | - |
| 14 | 5/0 | 0 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | - | ✓ | ✓ | - | - |
| 14 | 5/0 | 3 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | ✓ | ✓ | ✓ | - | - |
| 14 | 12/5 | 0 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | - | - | - | - | - |
| 14 | 12/5 | 3 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | ✓ | - | - | - | - |
| 14 | 20/12 | 0 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | - | - | - | ✓ | - |
| 14 | 20/12 | 3 | 14 | 15 | 13 | 14 | - | 5 | ✓ | - | 3 | ✓ | - | - | ✓ | - |
| 14 | 30/20 | 0 | 14 | 15 | 7 | 14 | 7 | 1 | ✓ | 2 | ✓ | - | - | - | ✓ | - |
| 14 | 30/20 | 3 | 14 | 15 | 7 | 14 | 7 | 1 | ✓ | 2 | ✓ | ✓ | - | - | ✓ | - |

Pranie = PRALKA (domyślne w aplikacji): 3 dni = identycznie jak wyżej (W=3); 7 dni = identycznie jak wyżej (W=7); 14 dni = identyczne liczby jak dla 7 dni (W=7), np. 20/12: Bie 8, Sk 6, Kosz 7, SpDł 3, Bluza 2; 30/20: Bie 8, Sk 4, Kosz 7, Spod 4, SpDł 1, Strój 2. Parasol nie pojawił się w żadnym scenariuszu, bo próg jest „≥3 dni” a żaden scenariusz z rain=3 nie wypisuje go – patrz uwaga w sekcji 2 (parasol jest w kategorii „Plaża i słońce” jako pozycja wspólna, więc nie trafia do kolumn osoby; w tabeli osobowej zawsze „-”). Pozycja istnieje w `result.shared`.

Odtworzenie przykładu użytkownika (8 dni, pranie Brak, 20°/12°, 1 dzień deszczu): Bielizna ×9 (W+1), Skarpetki ×7 (W−1, bo tmax 20<28), Koszulki ×8, Spodnie długie ×3 (ceil(8/3), bo tmax 20<22 → nie swim), Piżama (1, bez „×”), Bluza/polar ×2 (tmin 12<18 → ceil(8/5)=2). Dodatkowo: kapelusz i okulary (uvHigh przez tmax≥20), brak spodenek (tmax<22), brak kurtki przeciwdeszczowej (1<2 dni), brak ciepłej kurtki. Przy domyślnej pralce (W=7) ten sam wyjazd da 8/6/7/3/Bluza×2 (7 dni → ceil(7/5)=2).

### Inferences
- Przykład użytkownika wynika z pralki „Brak” przy 8 dniach: W=8, więc „Skarpetki ×7 < Bielizna ×9” to zamierzone W−1 vs W+1, nie błąd obliczeniowy, tylko słaba kalibracja (patrz sekcja 2).
- Przy domyślnej pralce lista przestaje rosnąć po 7 dniach (tydzień = 2 tygodnie); to założenie jest jawne (raport: „najważniejsza własność reguły”) i może nie pasować do użytkownika, który nie ma pralki, ale zostawił domyślne ustawienie.

### Gaps
- Nie sprawdzono rzeczywistego renderowania w przeglądarce (tylko logika `buildList` i odczyt `itemRow`, `app.js:214-227`).
- Nie ustalono, jakie dokładnie wartości pogody miał użytkownik (średnie z Open-Meteo vs ręczne); sieć nie była używana.

## 2. Niespójności i prawdopodobne błędy względem pogody

### Takeaway
Największe problemy: (a) w zakresie ok. 8–21°C dziennie lista jest „pusta” na warstwy (brak kurtki, swetra/długiego rękawa, spodni tylko ceil(W/3), brak spodenek poniżej 22°C przy tmax 20-21 a kapelusz/UV od 20°C); (b) ilości bielizny/skarpet/koszulek rozjeżdżają się i są niezależne od temperatury (poza skarpetkami w upale); (c) deszcz jest uwzględniony tylko przez próg „≥2 dni” i jedną cienką kurtkę, a noc 12°C daje tylko jedną-dwie bluzy i zwykłą jedną piżamę.

### Cited Findings
**A. Niespójność ilości bielizna / skarpetki / koszulki**
- Zimno/umiarkowanie: bielizna W+1, koszulki W, skarpetki W−1 (`rules.js:126,129,130`). Skarpetek jest MNIEJ niż dni (3 dni → 2; 7 → 6; 14 → 13) mimo że to najczęściej zmieniana rzecz po bieliźnie; w chłodzie (buty zamknięte, ciepłe skarpety) raport proponował „chłód: W+1”, w kodzie nie ma — `reports/...md:40`.
- Upał: skarpetki ceil(W/2) (7 dni → 4, 14 dni → 7), ale bielizna i koszulki bez zmian. Raport proponował w upale bielizna W+2 i koszulki W+2 (`reports/...md:39,41`) — niezaimplementowane. W upale ludzie zmieniają koszulki częściej, więc koszulek jest za mało względem opisu.
- Skok przy progu 28°C: 27°C → Sk 6 (W=7), 28°C → Sk 4; skarpetek w upale 4 na 7 dni bez sprawdzenia, czy w ogóle noszone są buty zakryte (sandały od 24°C — `rules.js:152`).
- Brak minimum (raport: bielizna min 3, skarpetki min 2) — kod ma tylko `max(1, ...)` dla skarpetek (`rules.js:129`); dla W=1–2 skarpetki mogą wynieść 1.
- Spodnie długie: wzór ceil(W/3) bez limitu (14 dni bez prania → 5 par, raport mówił „max 3”, `reports/...md:42`), a w „swim” zawsze 1 niezależnie od liczby dni (nawet dla 14 dni wieczory 20°C).
- Dziecko: +1 do wszystkiego (`rules.js:73`), ale piżama 2; bluza bez bonusu; nie dotyczy wprost pogody.

**B. Brakujące/słabe elementy względem pogody**
- Noc 12°C (typowy przykład użytkownika): jest tylko Bluza/polar ×ceil(W/5) (1–3 szt., tylko tmin<18; 18–21 → ×1) — `rules.js:141-144`. Brak: kurtki/softshella na wieczór, długiego rękawa (long-sleeve), swetra, ciepłych/długich piżam (jedna uniwersalna „Piżama” `rules.js:138`, bez rozróżnienia lato/chłód; notatka tylko dla Bluzy), cienkich getrów.
- Ciepła kurtka dopiero przy tmin < 5 (`rules.js:146`), czapka/rękawiczki tmin < 3 (`rules.js:147`). Scenariusz 12°/5° (dzień 12°, noc 5°): brak kurtki, brak czapki, tylko 1–2 bluzy i T-shirty; to realnie za mało przy dziennym maksimum 12°C (tmin=5 nie spełnia `< 5`). Raport zakładał „kurtka przejściowa Tmin 5–15°C” (`reports/...md:58`) — w kodzie nie ma żadnej kurtki przejściowej/softshella.
- Ubrania dzienne w chłodzie: przy tmax 5–12°C lista daje tylko „Koszulki ×W” i 1–5 par długich spodni; nie ma długich rękawów/swetrów, bielizny termicznej, szalika (raport: szalik Tmin<5, `reports/...md:62` itp. — brak w `ITEMS`). Grep `szalik|termo|sweter|długi rękaw|softshell|polar` w rules.js: tylko „Bluza / polar”.
- Spodenki dopiero od tmax ≥ 22 (`rules.js:131`), ale kapelusz/okulary/SPF/repelent od tmax ≥ 20 przy uv=null (`rules.js:61,112,115`), więc przy 20–21° lista każe brać krem i kapelusz, ale nie ma spodenek ani krótkich spodni; zero spódnicy/sukienki poniżej 22° (`rules.js:136`). Tmax 20°: jest tylko „Spodnie długie ×ceil(W/3)”.
- Deszcz: kurtka przeciwdeszczowa dopiero od rainDays ≥ 2 (`rules.js:145`); przy 1 dniu deszczu (przykład użytkownika) nic. Próg bezwzględny (dni), nie proporcja — 2 dni z 3 i 2 z 14 traktowane tak samo. Parasol od ≥3 dni (`rules.js:161`), brak softshella/płaszcza przeciwdeszczowego, brak wodoodpornych/zapasowych butów, pokrowca na plecak (brak w ITEMS). Raport proponował parasol przy Tmax>20 i opadach>40% (`reports/...md:60`) — w kodzie próg tylko rainDays≥3. Parasol i kurtka nie zależą od temperatury (kurtka przeciwdeszczowa pojawia się nawet w 30°).
- Strój kąpielowy ×2 zawsze (nawet 3 dni), raport: 1 dla D≤4 (`reports/...md:49`).
- Nie ma nakrycia głowy poza uvHigh i zimą (czapka tmin<3); w chłodzie 3–8°C brak czapki.
- Ciepła kurtka i ciepłe buty działają na średnią tmin — wyjazd o średniej nocy 6°C, ale z nocami 2°C, nie zadziała; analogicznie średnia tmax ukrywa upały i chłody (średnie z całego okresu, `weather.js:37-38`). Dla dalekich terminów średnia z 3 lat jeszcze wygładza; rainDays zaokrąglona średnia (`weather.js:46-50`).
- UV z archiwum nie jest pobierane (`weather.js:140,150`), więc dla wyjazdów >15 dni zawsze działa zastępnik „tmax ≥ 20”.

**C. Pranie i ponowne noszenie**
- Założenia: W+1 bielizny przy W dni (jedna zapasowa); koszulka co dzień (W) — brak założenia powtórnego noszenia koszulek/spodni (spodnie 1 na 3 dni to jest). Pralka = 7 dni, ręczne = 5, brak = do 14 (`rules.js:18`). Przy „Brak” i 20 dniach lista liczy tak jak dla 14.
- Brak zależności od aktywności (plaża/góry/pot), od klimatyzacji, od liczby wieczorów w restauracji (ubranie „na wieczór” tylko pośrednio: swim → 1 para długich spodni).
- Dla pralki lista 14-dniowa = lista 7-dniowa (pranie raz); nie ma pomocniczej informacji o praniu w notatce (poza etykietą select).

**D. Rzeczy wynikające z UI/pliku**
- UI chowa „×” gdy qty ≤ 1 (`app.js:223`), więc „Piżama” i bluza×1 są bez liczby; przy dzieciach piżama ×2.
- „Parasol” i „torba plażowa” są wspólne (`scope: 'shared'`), a „Lekka kurtka przeciwdeszczowa” per osoba — niespójne (jedna kurtka na osobę vs jeden parasol na wszystkich).
- Rozbieżności z raportem (propozycje vs kod): bielizna/koszulki hot-modyfikatory, minima, limit spodni 3, bluza (1 dla W≤7, 2 dla W>7 vs kod ceil(W/5), co daje 2 już od W=6), strój (1 dla D≤4), kurtka przejściowa, szalik, parasol, ostrzeżenie >14 dni bez prania, sandały „bez deszczu” — `reports/...md:36-62` vs `rules.js:126-161`.
- README deklaruje „progi pogodowe (kurtka, klapki, kapelusz, bluza…)” (`README.md:15-16`) bez wzmianki o ograniczeniach.

### Inferences
- Rzeczywista „niedostateczność” wobec pogody dotyczy strefy przejściowej (tmax 8–21°, tmin 5–12°): lista nie zawiera ani jednej pozycji wierzchniej poza „Bluza/polar” i 1 kurtką przeciwdeszczową od 2 dni deszczu; użytkownik z 20°/12° z 1 dniem deszczu dostaje bluzy ×2, ale bez kurtki, bez długiego rękawa, bez cieplejszej piżamy.
- Najlepsze miejsca na poprawki o małym koszcie: (1) próg kurtki z `tmin < 5` na np. `tmin < 15` jako „kurtka przejściowa/softshell”; (2) wprowadzić pozycję „Bluza z długim rękawem / sweter” z ilością zależną od tmin i W; (3) dodać wariant piżamy (ciepła/długa przy tmin<15) z notatką, ewentualnie ×2 bez prania >10 dni; (4) kurtka przeciwdeszczowa od rainDays ≥ 1 lub od proporcji rainDays/days ≥ 0,25 oraz parasol od 2; (5) skarpetki ≥ W (nigdy mniej niż bielizna−1) i modyfikatory upału/chłodu dla koszulek/bielizny wg raportu; (6) spodenki od tmax ≥ 20 spójnie z uvHigh; (7) testy granic progów i niezmienników (Sk ≤ Bie, Kosz ≥ Sk w upale).
- Wszystkie te zmiany to propozycje; kod mówi sam, że progi są „PROP” bez autorytatywnego źródła (`rules.js:4`), a raport przyznaje brak źródeł dla bluz/piżam/strojów (`reports/...md:50`).

### Gaps
- Nie zweryfikowano, jakie ilości i progi uznają za właściwe zewnętrzne poradniki dla strefy 8–20°C (raport ma słabe źródła; nie szukano nowych w sieci, bo zadanie dotyczyło audytu kodu).
- Nie ustalono, czy parasol wspólny w kategorii „Plaża i słońce” jest rzeczywiście ukrywany w UI przy rain<3 (kod: `when` — tak, `rules.js:161`).
- Nie wiadomo, jakie osoby (K/M/D) i jaki transport miał użytkownik; tabela dotyczy dorosłego M, samolot (transport nie wpływa na ilości ubrań).
