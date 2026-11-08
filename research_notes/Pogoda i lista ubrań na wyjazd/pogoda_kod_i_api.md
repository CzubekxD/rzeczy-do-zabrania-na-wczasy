# Pogoda w aplikacji "Na wczasy": jak działa dziś, jakie dane Open-Meteo pozwolą pokazać termin i intensywność deszczu

UWAGA METODOLOGICZNA: w tej sesji hosty open-meteo.com (WebFetch: błąd DNS ENOTFOUND) oraz api.open-meteo.com (curl, kod 000) są poza allowlistą sieci. Oficjalnej dokumentacji nie udało się przeczytać. Fakty o API pochodzą z podsumowań WebSearch (wtórne lustra/biblioteki) albo są oznaczone "WIEDZA WŁASNA - NIEZWERYFIKOWANE". Część (a) o kodzie repo jest w 100% zweryfikowana (przeczytane pliki). Przed wdrożeniem: dodać open-meteo.com do allowlisty i sprawdzić parametry na żywo. Dziś: 2026-11-08.

## (a) Jak pogoda jest pobierana i liczona w repo dzisiaj?

### Takeaway
Aplikacja używa wyłącznie danych DZIENNYCH Open-Meteo (`temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, opcjonalnie `uv_index_max`), bez danych godzinowych. "Dzień z deszczem" = dzień z `precipitation_sum >= 1` mm; dla dalekich terminów jest to średnia z 3 lat archiwum. Zapisywane są tylko 4 liczby + `source`; brak informacji o godzinie, intensywności i prawdopodobieństwie.

### Cited Findings (kod repo, pliki przeczytane w całości)
- Moduł `js/weather.js` to UMD (czyste funkcje + fetch z wstrzykiwalnym `fetchFn`), wiersze 4-8; komentarz (1-3) przyznaje, że endpointy nie były sprawdzane na żywo w sesji deweloperskiej (sieć zablokowana), więc każdy błąd kończy się komunikatem i ręcznym wpisem. — `js/weather.js:1-8`
- Trzy endpointy: geokodowanie `https://geocoding-api.open-meteo.com/v1/search`, prognoza `https://api.open-meteo.com/v1/forecast`, archiwum `https://archive-api.open-meteo.com/v1/archive`; `FORECAST_DAYS = 15` ("dziś + 15 dni"); `DAY = 864e5`. — `js/weather.js:10-14`
- Geokodowanie: parametry `name`, `countryCode`, `count=10`, `language=pl`, `format=json`. Próbuje kolejno: całą nazwę, człony po przecinku (`cityQueries`, 66-70), a na końcu sam kod pocztowy; wyniki filtrowane po `country_code`, wynik z trafionym `postcodes` idzie na początek. — `js/weather.js:80-120`
- URL dzienny budowany w `dailyUrl`: `?latitude&longitude&start_date&end_date&daily=temperature_2m_max,temperature_2m_min,precipitation_sum[,uv_index_max]&timezone=auto`. UV dodawany tylko dla prognozy (`withUv=true`), archiwum go nie dostaje. — `js/weather.js:122-127`, wywołania 140, 144, 150
- Logika wyboru źródła w `fetchWeather({lat,lon,from,to,today})`: (1) `to < today` -> archiwum, `source:'dane historyczne'` (139-142); (2) `to <= today+15 dni` -> forecast z `from` obciętym do `today`, `source:'prognoza'` (143-146); (3) dalej -> średnia z 3 lat: `k0 = firstArchiveShift(to, today)` (najmniejsze k, dla którego `addYears(to,-k) <= today-6 dni`, 54-60), lata `[k0,k0+1,k0+2]`, `Promise.allSettled`, uśrednienie udanych, `source:'średnia z lat YYYY–YYYY'` (147-155). Jeśli wszystkie 3 padną -> rzuca pierwszy błąd (153).
- `summarize(daily)` (30-42): `tmax = round(mean(temperature_2m_max))`, `tmin = round(mean(temperature_2m_min))`, `rainDays = count(precipitation_sum >= 1)` (mm, próg 1 mm/dobę), `uv = round(max(uv_index_max))` lub `null`. Rzuca 'brak danych temperatury' gdy puste tablice. Ignoruje wartości `null` (`nums`, 27).
- `average(summaries)` (44-52): średnia z lat osobno dla tmax, tmin, uv i `rainDays` (zaokrąglone). Uwaga: UV dla trybu multi-year jest zawsze `null`, bo archiwum jest pobierane bez UV (`withUv=false`, 150).
- Tekst "Średnio 20° w dzień, 12° w nocy, 1 dzień z deszczem (prognoza)" składa `weatherText()` w `js/app.js:57-62`: `'Średnio ' + tmax + '° w dzień, ' + tmin + '° w nocy, ' + rain + ' (' + source + ').'`, gdzie `rain = rainDays===1 ? '1 dzień z deszczem' : rainDays + ' dni z deszczem'` (forma "N dni z deszczem" jest poprawna dla N różnego od 1; dla 0 daje "0 dni z deszczem"). Gdy `weather==null`: "Brak pogody – używam wartości domyślnych (ciepło, ok. 26°/18°)..." (59).
- Ręczny override "Popraw pogodę ręcznie": `<details id="wmanual">` z `<summary>` w `js/app.js:126-127`; 4 pola number (`tmax` "Dzień (°C)", `tmin` "Noc (°C)", `rainDays` "Dni z deszczem", `uv` "Indeks UV (opcjonalnie)") — `app.js:129-132`; `oninput` -> `manualWeather(key, raw)` (70-77): bierze `S.trip.weather` lub `PackRules.DEFAULT_WEATHER`, ustawia `[key]: v` (pusty = null) i `source:'ręcznie'`, `persist()`, przerysowuje `#wsummary` i listę. Przy błędzie pobrania `details.open = true` i komunikat "Nie udało się pobrać pogody (...). Wpisz wartości ręcznie poniżej." — `app.js:156-161`.
- Przepływ UI: przycisk `#fetch-weather` "Sprawdź pogodę" (`app.js:118`) -> `doWeather` (137-162): walidacja kraju/miejscowości/dat, geokodowanie (jeśli `t.place.query !== placeKey()`), `Weather.fetchWeather(... today: todayISO())`, zapis `t.weather = w`. `todayISO()` używa czasu lokalnego przeglądarki (`app.js:40-44`). Wybór miejsca z listy `#places` (121-123) wywołuje `doWeather(true)`.
- Stan: `store.js:20` inicjalizuje `weather: null`; `S.trip.weather` trafia do `PackRules.buildList` (`app.js:298`).
- Zużycie w regułach (`js/rules.js`): `DEFAULT_WEATHER = { tmax:26, tmin:18, rainDays:1, uv:null, source:'domyślnie' }` (34); `makeCtx` czyta `rainDays` (50, 60); progi `THRESHOLDS.rainJacket = 2`, `umbrella = 3` (30-31); pozycje: `cl-rain` "Lekka kurtka przeciwdeszczowa" gdy `rainDays >= 2` (145), `sun-umbrella` "Parasol przeciwdeszczowy" (`low: true`) gdy `rainDays >= 3` (161). Brak innych użyć deszczu (np. wiatru, mm).
- Testy `test/rules.test.js`: `summarize` (103-110: `precipitation_sum [0,2.5,1]` -> `rainDays:2`, UV max 9), `firstArchiveShift` (112-116), `fetchWeather` z `fakeFetch` — prognoza (168-176), 3 lata archiwum "średnia z lat 2023–2025" (178-186), błąd API `{error:true, reason:'limit'}` -> wyjątek (188-194). Uruchamianie: `npm test` = `node --test test/*.test.js` (`package.json`).
- README: "prognoza do ok. 15 dni naprzód, dalej średnia z trzech poprzednich lat dla tych samych dat. Wartości można poprawić ręcznie" — `README.md:13-14`; atrybucja Open-Meteo CC BY 4.0 w stopce `index.html:28`.

### Inferences
- `FORECAST_DAYS = 15` (dziś + 15 = 16 dni łącznie) jest spójne z limitem ok. 16 dni prognozy Open-Meteo (patrz sekcja b), więc zmiana na dane godzinowe nie wymaga zmiany logiki wyboru źródła, tylko dodania `hourly=` do zapytania prognozy.
- Rozszerzenie najmniej inwazyjne: dodać nowe pole (np. `rain`) obok istniejących i zostawić `rainDays` bez zmian, aby reguły i testy działały bez migracji; stare zapisy w localStorage nie będą go miały (trzeba obsłużyć `undefined`).
- Dla trybu "średnia z lat" i trybu `ręcznie` dane godzinowe nie mają sensu per dzień; tam należy pokazywać tylko statystykę ("w tym okresie zwykle X dni z deszczem").
- W tej sesji nie uruchamiano `npm test` (nie wymagane do celu badania).

### Gaps
- Nie zweryfikowano na żywo, czy `forecast_days`/`start_date`+`end_date` do dziś+15 faktycznie nie zwraca błędu "out of range" (horyzont 16 dni liczony od dziś włącznie).
- Rzeczywista odpowiedź API nie została obejrzana (sieć zablokowana); testy używają atrap.

## (b) Co oferuje Open-Meteo: dane godzinowe opadów, prawdopodobieństwo, weather_code, wiatr, limity i horyzonty

### Takeaway
Open-Meteo Forecast API daje do ok. 16 dni prognozy godzinowej z m.in. `precipitation`, `rain`, `showers`, `precipitation_probability`, `weather_code`, `wind_speed_10m`, `wind_gusts_10m` (wartości opadów to sumy z poprzedniej godziny, czyli mm/h; weather_code chwilowy). Poza horyzontem: archiwum ERA5 (od 1940, opóźnienie ok. 5 dni) lub Climate API (CMIP6, 1950-2050). Archiwum NIE ma `precipitation_probability`.

### Cited Findings
- Strona główna Open-Meteo deklaruje godzinową prognozę "do 16 dni" — [Open-Meteo (raw README, GitHub)](https://raw.githubusercontent.com/open-meteo/open-meteo/main/README.md) (wg streszczenia WebFetch; tylko to zdanie potwierdzone, listy zmiennych brak)
- Zmienne opadowe `rain` (opad dużoskalowy), `showers` (opad konwekcyjny), `snowfall` to "Preceding hour sum" (suma z poprzedniej godziny; kod pogody wartość chwilowa) — wg lustra starszej dokumentacji cytowanego w [WebSearch: Hugging Face mirror open_meteo_docs.py](https://huggingface.co/spaces/zhangyi617/webui/blame/main/langchain/chains/api/open_meteo_docs.py) (wtórne, starsza wersja docs; nazwa `weathercode` później zmieniona na `weather_code`, zob. [OpenAPI spec mirror](https://glama.ai/mcp/servers/@cmer81/open-meteo-mcp/blob/02fbd67dd8f200dc1ecb9ac51aad33d7d81c2483/openapi.yml))
- `precipitation_probability` (%) opisane jako "Preceding hour probability" w pakiecie opakowującym API — [packalyst: chimilevschi/laravel-weather](https://www.packalyst.com/packages/package/chimilevschi/laravel-weather) (wtórne)
- Kody WMO w Open-Meteo: 51/53/55 mżawka (lekka/umiarkowana/gęsta), 61/63/65 deszcz (słaby/umiarkowany/silny), 80/81/82 przelotne opady deszczu (słabe/umiarkowane/gwałtowne), 95 burza — [docs.rs openmeteo-rs WmoCode](https://docs.rs/openmeteo-rs/1.0.0/openmeteo_rs/weather_code/enum.WmoCode.html), [DEV Community](https://dev.to/0012303/open-meteo-has-a-free-weather-api-no-key-no-signup-real-forecast-data-2nna) (wtórne; oficjalnej tabeli nie otwarto)
- Raport użytkownika, że `weather_code` bywał niezgodny z faktycznym deszczem z poprzedniej godziny — [GitHub open-meteo issue #851](https://github.com/open-meteo/open-meteo/issues/851) (pojedyncze zgłoszenie; wniosek: nie opierać klasyfikacji wyłącznie na weather_code)
- Archiwum historyczne: ERA5 0,25° (ok. 25 km), godzinowe, od 1940, aktualizacja codzienna z opóźnieniem 5 dni; dla pojedynczego punktu automatycznie ERA5-Land (ok. 10 km, od 1950); endpoint `/v1/archive`; `rain` jest wybieralną zmienną godzinową — [Open-Meteo docs: historical weather API (przez WebSearch)](https://open-meteo.com/en/docs/historical-weather-api), [Open-Meteo Substack](https://openmeteo.substack.com/p/historical-weather-data-from-1940)
- Climate API: CMIP6 (HighResMIP), 1950-2050, kilka modeli do ok. 20 km, agregaty dzienne, domyślnie korekta błędu — [Open-Meteo climate docs](https://open-meteo.com/en/docs/climate-api), [Open-Meteo Substack](https://openmeteo.substack.com/p/climate-change-api) (wg wcześniejszych notatek i wyszukiwarki; stronę docs zablokowano)
- Limity darmowe: <10 000 wywołań/dzień, 5 000/godz., 600/min, tylko użytek niekomercyjny, atrybucja CC BY 4.0 — [Open-Meteo Terms](https://open-meteo.com/en/terms) (przez wcześniejsze notatki repo `research_notes/Reguły pakowania na wakacje/plyny_i_api_pogody.md`; strony nie otwarto)

### WIEDZA WŁASNA - NIEZWERYFIKOWANE w tej sesji (sprawdzić w docs)
- Przykładowe zapytanie godzinowe: `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=precipitation,rain,showers,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m&daily=precipitation_sum,precipitation_hours,precipitation_probability_max,wind_gusts_10m_max&start_date=..&end_date=..&timezone=auto&wind_speed_unit=kmh` (jednostki domyślnie: mm, km/h dla wiatru).
- `forecast_days` max 16; `past_days` do 92; `minutely_15` dostępne tylko dla części regionów (Europa Środkowa/Ameryka Płn.), z `precipitation`; `precipitation` = rain + showers + snowfall (water equivalent).
- Dzienne: `precipitation_hours` (liczba godzin z opadem > 0), `precipitation_probability_max`, `wind_gusts_10m_max`, `weather_code` (najgorszy kod dnia).
- Przy `timezone=auto` czasy godzinowe są lokalne dla miejsca docelowego (ISO bez strefy), co upraszcza okno 7-22; bez `timezone` są w GMT.
- Prawdopodobieństwo opadu w prognozie dłuższej niż kilka dni jest mało precyzyjne (modele, rozdzielczość globalna dla 8-16 dnia); archiwum nie ma `precipitation_probability`.
- Brak `precipitation_probability` w trybie archiwum/climate trzeba obsłużyć jako `null`.

### Inferences
- Dane dla dni 0-16: hourly `precipitation`, `rain`, `showers`, `precipitation_probability`, `weather_code`, `wind_gusts_10m`. Dla "kiedy i jak mocno" wystarczą `precipitation` (mm w godzinie = mm/h), `showers` vs `rain` (rozróżnienie przelotny/ciągły), `precipitation_probability` i `weather_code`.
- Dla wyjazdów dłuższych niż 16 dni: godzinowych prognoz nie ma. Opcje: (1) tryb "klimatologia": z archiwum 3 lat godzinowe `precipitation` i policzyć średnią liczbę godzin/dni z opadem w oknie 7-22 i typowy rozkład pory dnia (np. "popołudniowe przelotne zdarzają się zwykle ok. 14-18"); (2) Climate API (dzienne sumy, brak godzin). Bieżąca implementacja (3 lata archiwum) pasuje do opcji 1 po dodaniu `hourly=precipitation` (3 zapytania x 24 h x dni; rozmiar odpowiedzi rośnie, ale mieści się w limitach).
- Mieszane wyjazdy (część dni w horyzoncie, część poza): wyświetlać szczegóły godzinowe dla dni <= dziś+15, a resztę oznaczyć jako "typowo" (statystyka).
- Ze względu na przedział ufności i zgłoszenia o niezgodności weather_code, klasyfikację najlepiej opierać na mm/h + `showers/rain` + `precipitation_probability`, a weather_code używać pomocniczo (burza: 95-99; kody 80-82 jako sygnał "przelotny").

### Gaps
- Nie przeczytano oficjalnych docs (host zablokowany): dokładne nazwy/jednostki, maksimum `forecast_days`, dostępność `minutely_15`, definicja `precipitation_probability` (okno, próg) wymagają weryfikacji.
- Nie sprawdzono, czy `precipitation_probability` jest dostępne dla każdego modelu/regionu (np. Turcja, Egipt - miejsca typowych wyjazdów).
- Brak liczb o dokładności prognozy opadów w 8-16 dniu.

## (c) Progi klasyfikacji deszczu i reguła rekomendacji kurtki/softshella/parasola

### Takeaway
Nie znaleziono oficjalnego dokumentu WMO ani IMGW z progami mm/h: WMO podaje tylko kategorie słowne w tabelach kodów, a IMGW w ostrzeżeniach używa sum mm za okres. Poniższe progi to PROPOZYCJA (inżynierska), oparta o spójne źródła wtórne: słaby <2,5 mm/h, umiarkowany 2,5-7,6 mm/h, silny >7,6 mm/h (AMS i poradniki), a ulewa 10-20 i nawalny >20 mm/h (antyweb, nie IMGW).

### Cited Findings
- WMO udostępnia tylko rejestry kodów charakteru/intensywności opadów (bez liczbowych progów mm/h w wynikach wyszukiwania) — [WMO Codes Registry 0-13-056](https://codes.wmo.int/bufr4/codeflag/0-13-056) (wg WebSearch; strony nie otwarto)
- AMS Glossary: deszcz umiarkowany 0,26-0,76 cm/h (ok. 2,6-7,6 mm/h), silny > 0,76 cm/h (>7,6 mm/h) lub >0,076 cm w 6 min — [AMS Glossary: Rain](https://glossary.ametsoc.org/wiki/Rain) (wg podsumowania wyszukiwarki)
- Poradnik pomiarów deszczu: lekki <2,5 mm/h, umiarkowany 2,6-7,5 mm/h, silny >7,6 do 50 mm/h — [Barani Design: rain rate classification](https://barani.squarespace.com/faq-articles/2020/1/19/rain-rate-intensity-classification?format=amp) (wtórne)
- Skala Tempest (drobniejsza): lekki 0,25-<1,0, umiarkowany 1,0-<4,0, silny 4,0-<16,0 mm/h — [Tempest community](https://community.tempest.earth/t/rain-intensity-values/806) (forum producenta; inne progi, pokazuje rozrzut definicji)
- Polska terminologia "ulewa" 10,1-20,0 mm/h i "deszcz nawalny" >=20,1 mm/h — [antyweb.pl](https://antyweb.pl/deszcz-nawalny-co-to-jest) (portal popularny, NIE IMGW; do potwierdzenia na stronie IMGW)
- Ostrzeżenia IMGW opisują opady sumami w mm za okres (np. I stopień 30-45 mm, II stopień 60-90 mm, lokalnie do 130 mm; jednorazowo wzmianka o natężeniu 5-10 mm/h) i słowami "umiarkowane, okresami silne" — [Radio Kraków (cytaty ostrzeżeń IMGW)](https://www.radiokrakow.pl/aktualnosci/imgw-burze-z-intensywnymi-opadami-deszczu-na-poludniu-polski/), [RMF24](https://www.rmf24.pl/fakty/pogoda/news-intensywny-deszcz-i-burze-imgw-ostrzega,nId,8015950) (wg streszczenia wyszukiwarki; surowe teksty nieotwarte)

### Propozycja (inferencje autora, nie fakty ze źródeł)

#### 1. Klasy godzinowe (mm/h = `precipitation` z godziny)
| Klasa (PL) | `intensity` | mm/h | Uwagi |
|---|---|---|---|
| mżawka | `drizzle` | 0,1-<0,5 | lub `weather_code` 51/53/55 |
| słaby deszcz | `light` | 0,5-<2,5 | zgodne z "light <2,5" |
| umiarkowany | `moderate` | 2,5-<7,6 | zgodne z AMS |
| silny | `heavy` | 7,6-<20 | "ulewa" |
| nawalny | `violent` | >=20 | "deszcz nawalny"; burza (95-99) podbija o klasę |
Godzina bez opadu: `precipitation < 0,1` mm.

#### 2. Typ epizodu (łączymy sąsiednie godziny z opadem >=0,1 mm; przerwa 1 h dzieli epizody)
- `przelotny`: epizod trwa <= 2 h LUB udział `showers` w sumie >= 50% LUB `weather_code` 80-82 w >=1 godz.
- `ciągły`: epizod >= 3 h i `rain` dominuje (showers < 50%).
- `ulewny`: dowolna godzina >= 7,6 mm/h albo epizod z sumą >= 15 mm (próg autorski).
- `mżawka`: maks. godzinowa < 0,5 mm/h (albo kody 51-55).
Kolejność rozstrzygania: ulewny > przelotny > ciągły > mżawka.

#### 3. Okno dnia i filtr istotności
- Okno "aktywności": 7:00-22:00 czasu lokalnego (godziny `time` 07..21).
- Godzinę liczymy jako deszczową, gdy `precipitation >= 0,1` mm ORAZ `precipitation_probability >= 30%` (gdy dostępne; gdy `null` - tylko mm). Epizody < 0,5 mm sumy łącznie ignorować.

#### 4. Reguły rekomendacji (na dzień; potem agregacja na wyjazd)
Zmienne dnia (okno 7-22): `hours` (godz. deszczowe), `sum` (mm), `maxHour` (mm/h), `pMax` (%), `gustMax` (km/h).
- Parasol (`umbrella`): `hours >= 1` i `maxHour >= 0,5` i `pMax >= 40`, oraz `gustMax < 40` km/h (przy silnym wietrze parasol bezużyteczny - wtedy kurtka). Zostaje dotychczasowa reguła "≥ 3 dni z deszczem" jako fallback dla trybu statystycznego.
- Lekka kurtka przeciwdeszczowa (`rainJacket`): `hours >= 2` lub `sum >= 2` mm lub `gustMax >= 40` przy jakimkolwiek opadzie.
- Softshell / cieplejsza warstwa (`softshell`): dzień z klasą >= `moderate` lub `hours >= 4` lub (deszcz i `tmax < 18`) lub (deszcz i `gustMax >= 40`).
- Wypełnianie listy: pozycja pojawia się, gdy >= 2 dni spełniają regułę (dotychczasowy próg `rainJacket = 2` dni) lub gdy dowolny dzień ma klasę `heavy`/`violent` (wtedy 1 dzień wystarcza). Wartości progowe do wystawienia w `THRESHOLDS` w `js/rules.js`.
- Statystyka dla dalekich terminów (3 lata archiwum): `rainDays` jak dziś + `typicalRainHours` (średnia liczba godz. 7-22 z `precipitation >= 0,1`) i `typicalPeak` (godzina o największym łącznym opadzie).

#### 5. Proponowana struktura danych (rozszerzenie `S.trip.weather`)
```js
weather = {
  tmax, tmin, rainDays, uv, source,         // jak dziś (kompatybilne z rules.js)
  rain: {                                    // NOWE, opcjonalne
    mode: 'hourly' | 'typical' | 'none',     // hourly: prognoza <= dziś+15; typical: średnia z lat
    days: [{                                 // tylko dla mode:'hourly'
      date: '2026-11-12',
      hours: 3, sumMm: 4.2, maxMmH: 2.1, pMax: 60, gustMax: 38,
      episodes: [{
        from: '14:00', to: '16:00',          // godziny lokalne, [from, to) w oknie 7-22
        type: 'showers' | 'continuous' | 'drizzle',
        intensity: 'light' | 'moderate' | 'heavy' | 'violent',
        maxMmH: 2.1, sumMm: 3.8, p: 60       // p = max precipitation_probability w epizodzie lub null
      }],
      advice: ['umbrella', 'rainJacket']     // wynik reguł
    }],
    typical: { years: [2023, 2024, 2025], rainDaysAvg: 2, hoursPerDay: 1.4, peakHour: 15, maxMmH: 6.0 }, // mode:'typical'
    advice: { rainJacket: true, umbrella: true, softshell: false }   // zagregowane na wyjazd
  }
}
```
Pole `rain` jest opcjonalne, `rules.js` i testy czytają dalej `rainDays`; ręczny override pozostaje (override `rainDays` nie kasuje `rain`, ale warto dopisać `source:'ręcznie'` i ukryć szczegóły godzinowe, gdy użytkownik zmieni `rainDays`).

#### 6. Format tekstu w UI (polski)
- Epizod: `'{Dzień skrócony} {od}-{do} {typ} {intensywność w mm/h}, {p}%'`, np. `Śr. 14:00-16:00 przelotny deszcz, do 2 mm/h, 60%`.
  - Typy: `przelotny deszcz`, `ciągły deszcz`, `mżawka`, `ulewa` (heavy/violent: `ulewny deszcz, do 12 mm/h`), przy burzy `burza z deszczem`.
  - `do X mm/h` = `maxMmH` zaokrąglone do 0,5 lub do całości (np. `do 0,5 mm/h`, `do 2 mm/h`).
  - Jeśli `p` null: pominąć `, 60%`.
  - Wiele epizodów w dniu: oddzielone ` · `; dni bez opadu: pominąć lub `bez deszczu`.
- Podsumowanie wyjazdu (dziś: `weatherText()`): zachować istniejące zdanie, dopisać linię np. `Najbardziej mokry dzień: Czw. 16:00-19:00 ulewny deszcz, do 12 mm/h, 70%.` oraz `Zabierz: kurtkę przeciwdeszczową i parasol.`
- Tryb typowy: `Zwykle ok. 2 dni z deszczem; opady najczęściej po południu (ok. 15:00), zwykle przelotne, do ok. 6 mm/h (średnia z lat 2023–2025).`
- Skróty dni: Pn., Wt., Śr., Czw., Pt., Sob., Niedz.; godziny 24-h `HH:MM`.

### Inferences
- Wszystkie progi z tabeli i reguł rekomendacji (parasol 40 km/h, 7-22, `p >= 30%`, ulewny epizod >= 15 mm) to autorskie propozycje bez źródeł; część (słaby/umiarkowany/silny) opiera się na AMS/poradniku (2,5/7,6 mm/h), a "ulewa 10-20" z antyweb koliduje z AMS ("silny" od 7,6) - proponuję `heavy` od 7,6 jako "ulewny" dla prostoty i ostrożności (lepiej zabrać za dużo).
- Skale różnią się między źródłami (Tempest: "silny" od 4 mm/h), więc przed wdrożeniem warto dostroić progi do UX (ryzyko zbyt częstych rekomendacji lekkiej kurtki w klimacie wilgotnym).
- Wiatr: próg 40 km/h dla podmuchu (`wind_gusts_10m`) to wartość orientacyjna (wiedza własna; ok. 5-6 w skali Beauforta), niezweryfikowana źródłem.

### Gaps
- Brak oficjalnych progów mm/h z IMGW/WMO (strony instytucji nie były otwarte; wyszukiwarka zwróciła tylko źródła wtórne).
- Brak źródła na skuteczność parasola przy konkretnym wietrze oraz na rekomendacje odzieżowe (softshell) zależne od mm/h i temperatury.
- Nie sprawdzono definicji "przelotny" w IMGW (zwykle: opad o nagłym początku i końcu, z chmur konwekcyjnych, zmiennym natężeniu) - użyto definicji roboczej.
