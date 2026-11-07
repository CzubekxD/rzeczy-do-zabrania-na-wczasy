# Limity płynów i bagażu podręcznego (A) oraz darmowe API pogody dla aplikacji w przeglądarce (B)

UWAGA METODOLOGICZNA: w tej sesji WebFetch nie miał dostępu do hostów open-meteo.com, operations.osmfoundation.org ani pasazer.com (błąd DNS - hosty poza allowlistą sesji). Nie udało się więc przeczytać oficjalnej dokumentacji ani polityki Nominatim. Wszystko poniżej pochodzi z podsumowań WebSearch (wtórne) albo, tam gdzie jawnie zaznaczono "WIEDZA WŁASNA - NIEZWERYFIKOWANE", z mojej wiedzy o API, której w tej sesji nie potwierdziłem. Przed wdrożeniem warto sprawdzić dokumentację na żywo (lub dodać te hosty do allowlisty i powtórzyć research). Dziś: 2026-11-07.

## Jakie dokładnie są obecne zasady płynów w UE/Polsce w 2026 i czy cokolwiek się zmieniło względem 100 ml?

### Takeaway
Podstawowa reguła UE (100 ml na opakowanie, przezroczysta torebka 1 l) nadal obowiązuje jako standard. Wyjątek: lotniska/pasy z certyfikowanymi skanerami CT, gdzie lokalnie dopuszcza się większe pojemniki (do 2 l) - w Polsce potwierdzane m.in. dla Krakowa; stan na innych lotniskach jest niespójny w źródłach, więc aplikacja powinna domyślnie zakładać 100 ml i odsyłać do strony lotniska.

### Cited Findings
- Kwiecień 2026 (poradnik): reguła 100 ml pozostaje standardem UE; na wybranych pasach ze skanerami CT we Frankfurcie i Monachium można wnosić płyny do 2 l, na pozostałych kontrolach i lotniskach nadal 100 ml — [wyniki WebSearch, m.in. markenkoffer.de / vienna.at](https://www.markenkoffer.de/en/blogs/news/liquids-in-hand-luggage) (podsumowanie wyszukiwarki; nie otwarto pełnego tekstu)
- W 2025 r. po zatwierdzeniu skanerów przez UE kilka lotnisk luzowało limit, ale doniesienia mówią, że lotniska ze skanerami CT miały na razie przywrócić limit 100 ml (ACI Europe / unijne przepisy ochrony lotnictwa) — [Oman Observer](https://www.omanobserver.om/article/1157978/world/europe/eu-airports-to-bring-back-tighter-liquid-rules-for-carry-on-baggage), [Agerpres, 2025-08-06](https://agerpres.ro/english/2025/08/06/the-end-of-liquid-restrictions-at-eu-airports-and-extra-luggage-fees-not-so-fast-enr--1474127) (tylko tytuły/snippety; treści nie zweryfikowano)
- Wiedeń: wdrażanie CT w terminalach stopniowo w 2026, a "UE nadal reguluje dopuszczalne ilości płynów" — [vienna.at](https://www.vienna.at/eu-approves-scanners-will-the-rule-for-liquids-in-hand-luggage-now-be-dropped/9586019)
- Bruksela: skanery CT od 2028, płyny do 2 l — [Belga News Agency](https://www.belganewsagency.eu/brussels-airport-to-allow-larger-liquids-in-hand-luggage)
- Polska: Kraków-Balice jako pierwszy zniósł limit (8 września 2025, opakowania do 2 l); Poznań i Rzeszów-Jasionka podobno również; Lublin uruchomił dwie linie ze skanerami CT — [Radio Kraków](https://www.radiokrakow.pl/aktualnosci/krakow/pierwsi-w-polsce-lotnisko-krakow-airport-znioslo-limit-plynow-w-bagazu-podrecznym), [pasazer.com](https://www.pasazer.com/news/470103/kolejne,polskie,lotnisko,znosi,limit,plynow,w,bagazu,podrecznym.html) (daty z nagłówków wyszukiwarki, strony nie otwarto)
- Warszawa-Chopin: zapowiedź zniesienia limitu/montażu CT przed sezonem letnim 2026 (czy faktycznie wdrożono - niepotwierdzone) — [Forsal](https://forsal.pl/kraj/aktualnosci/artykuly/9854792,wazna-zmiana-dla-lecacych-z-lotniska-chopina-od-kiedy-nowe-limity-plynow-polskie-linie-lotnicze-potwierdzaja.html), [money.pl](https://www.money.pl/gospodarka/rewolucja-na-lotnisku-chopina-koniec-z-limitem-plynow-7239072419060704a.html)
- Wrocław: montaż pierwszych skanerów CT zapowiedziany na luty 2027, więc do tego czasu obowiązuje 100 ml — [tanie-loty.com.pl](https://www.tanie-loty.com.pl/czytelnia/aktualnosci/lotnisko-we-wroclawiu-zamowilo-nowe-skanery-montaz-ruszy-w-lutym-2027-roku/)
- Rzeszów: źródła sprzeczne co do terminu zniesienia limitu (plan na jesień vs. już zniesiony) — [pasazer.com 469427](https://www.pasazer.com/news/469427/rzeszow,szykuje,sie,do,zniesienia,limitu,plynow); [pasazer.com 470103](https://www.pasazer.com/news/470103/kolejne,polskie,lotnisko,znosi,limit,plynow,w,bagazu,podrecznym.html)

### Inferences
- Bezpieczna reguła dla aplikacji: planuj z 100 ml/opakowanie + torebka 1 l (przezroczysta, zamykana); dodaj adnotację "na niektórych lotniskach z CT (np. Kraków) limit zniesiony - sprawdź stronę lotniska wylotu ORAZ powrotu".
- Ponieważ lotnisko docelowe/przesiadkowe może mieć 100 ml, najostrożniejsza reguła obejmuje wszystkie lotniska na trasie.

### Gaps
- Nie znaleziono/nie otwarto oficjalnego tekstu Komisji Europejskiej, ULC ani stron lotnisk; wszystko z mediów. Dokładnego stanu na 2026-11 dla Warszawy, Gdańska, Poznania, Rzeszowa nie da się potwierdzić z posiadanych źródeł.
- Sprzeczność: niektóre źródła mówią o "przywróceniu" 100 ml w całej UE (2025), inne o lokalnych zniesieniach w 2026 - najpewniej dotyczą różnych okresów; nie rozstrzygnięto.

## Rzeczy zakazane/ograniczone w bagażu (powerbanki, baterie litowe, noże, aerozole) i typowe limity wagi

### Takeaway
Powerbanki i zapasowe baterie litowe tylko w bagażu podręcznym (nigdy rejestrowanym); w 2026 coraz więcej przewoźników zakazuje ich używania/ładowania w locie. Limity wagi bagażu podręcznego: LOT 8 kg (55x40x23), tanie linie zwykle mały darmowy bagaż osobisty + płatny większy; wartości różnią się między źródłami - weryfikować u przewoźnika.

### Cited Findings
- Powerbanki wolno wozić tylko w bagażu podręcznym, do 100 Wh bez zgody, 100-160 Wh za zgodą linii (relacja o stanowisku ULC); w rejestrowanym zabronione — [instalki.pl](https://www.instalki.pl/news/internet/linie-lotnicze-zaostrzaja-przepisy-dotyczace-powerbankow-jedna-rzecz-calkowicie-zakazana/), [telepolis.pl](https://www.telepolis.pl/artykuly/powerbank-w-samolocie-ograniczenia)
- Doniesienia o decyzji ICAO/EASA/IATA o zakazie ładowania powerbanku i ładowania urządzeń z powerbanku podczas lotu — [pasazer.com 469737](https://www.pasazer.com/news/469737/wazna,decyzja,icao,chodzi,o,powerbanki.html) (media; oficjalnego komunikatu nie znaleziono)
- Lufthansa: zakaz używania powerbanków w locie od 15 stycznia 2026; część linii (Emirates, Singapore Airlines) ma własne zakazy; jeden przewoźnik limituje do 2 sztuk na osobę — [Anker blog](https://www.anker.com/eu-pl/blogs/power-banks/lufthansa-power-bank), [instalki.pl](https://www.instalki.pl/news/internet/linie-lotnicze-zaostrzaja-przepisy-dotyczace-powerbankow-jedna-rzecz-calkowicie-zakazana/)
- LOT: bagaż podręczny 55x40x23 cm do 8 kg + przedmiot osobisty 40x35x12 cm do 2 kg — [tanie-loty.com.pl](https://www.tanie-loty.com.pl/czytelnia/poradnik/bagaz-podreczny-2026-aktualne-wymiary-ryanair-wizz-air-lot/) (wg podsumowania wyszukiwarki; źródła zgodne)
- Wizz Air: darmowy mały bagaż ok. 40x30x20 cm (wg jednego źródła do 10 kg), płatny 55x40x23; kółka/uchwyty mogą się liczyć do wymiarów (źródła sprzeczne co do liczb) — [tanie-loty.com.pl](https://www.tanie-loty.com.pl/czytelnia/poradnik/bagaz-podreczny-2026-aktualne-wymiary-ryanair-wizz-air-lot/), [loudavymkrokem.cz](https://loudavymkrokem.cz/pl/wizz-air-bagaz-lotniczy/)
- Ryanair: darmowy bagaż osobisty pod fotel (ok. 40x20x25 cm wg jednego źródła), większy płatny (55x40x20, 10 kg wg innego) — [tanie-loty.com.pl](https://www.tanie-loty.com.pl/czytelnia/poradnik/bagaz-podreczny-2026-aktualne-wymiary-ryanair-wizz-air-lot/) (niepewne, źródła niezgodne)

### Inferences
- Do reguł pakowania: powerbank/baterie/e-papierosy/zapalniczki - zawsze do podręcznego; nie zakładać możliwości ładowania w locie.
- Noże, ostre narzędzia, aerozole >100 ml: nie do podręcznego (aerozole osobiste w limicie 100 ml w torebce); noże i narzędzia do rejestrowanego. To ogólna wiedza o zasadach ochrony lotnictwa, w tej sesji nie potwierdzona źródłem.

### Gaps
- Brak oficjalnych źródeł (UE 2015/1998, ULC, strony linii) w tej sesji; brak potwierdzenia szczegółów dot. noży i aerozoli oraz bagażu rejestrowanego (typowo 20-23 kg - niepotwierdzone).
- Wymiary Ryanair/Wizz Air sprzeczne między serwisami; wymagają sprawdzenia na stronach przewoźników.

## Open-Meteo: endpointy, limity, CORS, warunki darmowego użycia

### Takeaway
Open-Meteo oferuje bez klucza i z CORS: forecast, historical (archive), climate (CMIP6 1950-2050), geocoding. Darmowe tylko do użytku niekomercyjnego, limity 600/min, 5000/h, 10 000/dzień, wymagana atrybucja (CC BY 4.0).

### Cited Findings
- Limity darmowego API: poniżej 10 000 wywołań/dzień, 5 000/godz., 600/min; tylko użytek niekomercyjny; użycie = akceptacja CC BY 4.0; warunki mogą się zmienić w każdej chwili — [Open-Meteo Terms](https://open-meteo.com/en/terms) (przez podsumowanie WebSearch; strony nie otwarto)
- Brak klucza API, CORS wspierany (opis projektu); atrybucja: link do Open-Meteo przy wyświetlanych danych — [github.com/schicho/open-meteo](https://github.com/schicho/open-meteo), [ost.ecosyste.ms](https://ost.ecosyste.ms/projects/845); sprzeczny post dev.to twierdzący, że komercyjne użycie jest OK — [DEV Community](https://dev.to/scriptmasterlabs01/free-weather-api-without-key-tested-endpoints-1ifb) (odrzucony wobec warunków oficjalnych)
- Climate API: ścieżka /v1/climate, dane CMIP6 (HighResMIP) 1950-2050, kilka modeli do 20 km, agregaty dzienne, domyślnie korekta błędów (bias correction), parametr `daily` jako lista po przecinku — [Open-Meteo climate docs](https://open-meteo.com/en/docs/climate-api), [Open-Meteo Substack](https://openmeteo.substack.com/p/climate-change-api) (wg wyszukiwarki; hosta nie potwierdzono tym źródłem)

### WIEDZA WŁASNA - NIEZWERYFIKOWANE w tej sesji (sprawdzić w docs)
Przykładowe URL-e (z pamięci, jednakowo wymagają weryfikacji):
- Geokodowanie: `https://geocoding-api.open-meteo.com/v1/search?name=Krak%C3%B3w&count=5&language=pl&format=json` - odpowiedź: `{"results":[{"id":..,"name":"Kraków","latitude":50.06,"longitude":19.94,"country":"Polska","country_code":"PL","admin1":"Małopolskie","timezone":"Europe/Warsaw","population":..}]}`; opcjonalnie `countryCode=PL`.
- Prognoza: `https://api.open-meteo.com/v1/forecast?latitude=50.06&longitude=19.94&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=auto&start_date=2026-12-01&end_date=2026-12-10` - odpowiedź: `{"daily":{"time":[...],"temperature_2m_max":[...],...},"daily_units":{...}}`; zasięg ok. 16 dni (domyślnie 7, `forecast_days` do 16).
- Historia: `https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=2025-07-01&end_date=2025-07-10&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto` - dane od 1940, opóźnienie kilka dni.
- Klimat: `https://climate-api.open-meteo.com/v1/climate?latitude=..&longitude=..&start_date=2030-07-01&end_date=2030-07-10&models=EC_Earth3P_HR&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` (modele m.in. CMCC_CM2_VHR4, FGOALS_f3_H, HiRAM_SIT_HR, MRI_AGCM3_2_S, EC_Earth3P_HR, MPI_ESM1_2_XR, NICAM16_8S).

### Inferences
- Strategia dla zakresu dat: jeśli data ≤ ~16 dni od dziś → forecast; jeśli dalej → archive-api dla tych samych dat z 3-5 poprzednich lat i uśrednienie (alternatywnie climate-api). Uśrednianie wielu lat daje „typowe" min/max, opady (suma i liczba dni z opadem > 1 mm), wiatr max.
- Wskaźniki do reguł pakowania: min z min temp, max z max temp, liczba dni deszczowych (precip ≥ 1 mm), maksymalny podmuch/wiatr, ewentualnie weather_code (śnieg/burza).
- Użycie osobiste/niekomercyjne mieści się w limitach (kilka zapytań na użytkownika); dodać stopkę „Weather data by Open-Meteo.com" z linkiem.

### Gaps
- Nie przeczytano oficjalnych docs (host zablokowany); dokładne nazwy parametrów, zasięg forecast (16 dni) i zakres archive/climate wymagają weryfikacji.
- Brak weryfikacji CORS bezpośrednio na odpowiedzi API.

## Geokodowanie adresów: Open-Meteo vs Nominatim oraz alternatywy

### Takeaway
Open-Meteo geocoding szuka po nazwie miejscowości (nie po pełnym adresie - wniosek z wiedzy własnej, niezweryfikowany); do pełnych adresów lepszy Nominatim, ale publiczna instancja ma restrykcyjną politykę (1 zapytanie/s łącznie dla aplikacji, brak autouzupełniania, identyfikacja przez User-Agent/Referer, cache).

### Cited Findings
- Nominatim: limit 1 zapytanie/s jako suma dla wszystkich użytkowników aplikacji — [GitHub discussion osm-search/Nominatim #3801](https://github.com/osm-search/Nominatim/discussions/3801)
- Wymagany identyfikujący User-Agent lub Referer; autouzupełnianie (search-as-you-type) i masowe geokodowanie niedozwolone; wyniki należy cache'ować; przekroczenie limitu → blokada IP / 403 — [DEV Community](https://dev.to/daniel_pertu/one-request-a-second-for-the-whole-app-so-our-place-search-has-no-search-as-you-type-2lc3), [Drupal issue](https://www.drupal.org/i/3081749), [OSM diary pnorman](https://www.openstreetmap.org/user/pnorman/diary/398773) (źródła wtórne; oficjalnej polityki nie otwarto)

### Inferences
- WIEDZA WŁASNA (niezweryfikowana): przykład `https://nominatim.openstreetmap.org/search?q=Floria%C5%84ska+3+Krak%C3%B3w&format=jsonv2&limit=1&accept-language=pl` zwraca tablicę z `lat`, `lon` (jako stringi), `display_name`; CORS wspierany; atrybucja „© OpenStreetMap contributors" (ODbL).
- Przeglądarka nie pozwala ustawić User-Agent, więc identyfikacja idzie przez Referer; rozwiązanie: geokodowanie dopiero po kliknięciu „Szukaj" (nie przy pisaniu), cache w localStorage, domyślnie Open-Meteo dla nazw miejscowości, Nominatim jako opcja dla pełnych adresów.

### Gaps
- Nie sprawdzono Meteostat (w praktyce wymaga klucza RapidAPI) ani NASA POWER (API bez klucza, dane klimatologiczne; CORS niezweryfikowany) - brak źródeł w tej sesji.
- Nie zweryfikowano, jak Open-Meteo geocoding radzi sobie z pełnym adresem.
