# Praktyki pakowania ubrań wg długości wyjazdu, temperatury i deszczu (Polska / Europa Środkowa)

Uwaga metodologiczna: w tej sesji WebFetch nie działa dla rei.com, sportano.pl, decathlon.pl, outdoorresearch.com (getaddrinfo ENOTFOUND: hosty poza dozwolonymi domenami; trzeba je dopuścić w ustawieniach sieci sesji, żeby je pobrać). Wszystko poniżej pochodzi ze streszczeń WebSearch oraz z wcześniejszych notatek (/research_notes/Reguły pakowania na wakacje/ubrania_i_pogoda.md). Znaczniki: CYT = ze źródła (streszczenie wyszukiwarki), PROP = moja propozycja do kalibracji. Nie znalazłem żadnego źródła instytucjonalnego z kompletną tabelą "temperatura x liczba sztuk", więc tabela w sekcji 4 jest w większości PROP, osadzona na formułach CYT z wcześniejszych notatek.

## 1. Ile sztuk ubrań w zależności od długości wyjazdu (przegląd i weryfikacja wcześniejszych ustaleń)

### Takeaway
Wcześniejsze formuły pozostają najlepszym, co jest dostępne: bielizna = dni + 1..3, koszulki ~ dni, spodnie ~ dni/2 lub 2-3 sztuki, okno prania ~7 dni. Nowe wyszukiwania nie dały lepszych źródeł dla liczebności, tylko potwierdziły, że z praniem pakuje się około połowę mniej.

### Cited Findings
- Formuły: bielizna = dni + 1, koszulki = dni, spodnie = dni/2, skarpetki = dni − 1, maks. 7 dni przed praniem — [SwissGear](https://www.swissgear.com/blogs/the-swissgear-blog/how-to-pack-for-a-3-5-or-7-day-trip) (wg streszczenia, niezweryfikowane na stronie; z wcześniejszych notatek).
- Bielizna: dni + 3 lub N + 2 (N = dni do pralki) — [we3travel](https://we3travel.com/travel-packing-underwear-formula/) (z wcześniejszych notatek).
- Z dostępem do pralki można nieść mniej więcej o połowę mniej — [Rick Steves community](https://community.ricksteves.com/travel-forum/packing/how-much-clothing-do-you-pack) (forum, z wcześniejszych notatek).
- Polskie poradniki na tydzień: bielizna 7-8 szt. — [Rankomat](https://rankomat.pl/turystyka/jak-spakowac-sie-na-tydzien-poradnik); 6 par bielizny, 5 topów, 2 spodnie/spódnice, sweter lub kurtka — [tanie-loty.com.pl](https://www.tanie-loty.com.pl/czytelnia/poradnik/jak-spakowac-sie-w-maly-bagaz-podreczny-na-tydzien-🎒/).
- Przy ostatnim wyszukiwaniu forum Rick Steves: podróżni zakładają, że przy 3-tygodniowej podróży trafi się deszcz (poza południową Hiszpanią w pełni lata); sugerują sprawdzenie prognozy przed decyzją — [Rick Steves forum: umbrella or raincoat](https://community.ricksteves.com/travel-forum/packing/umbrella-or-raincoat) (anegdotyczne, wg streszczenia).

### Inferences
- Dla kodu: `W = min(D, 7)` przy dostępie do prania (pralka w noclegu lub ręczne), inaczej `W = D` z limitem 14. Reszta formuł jak w sekcji 4.
- Poniżej 10 °C ubrania są noszone dłużej niż w upale (mniej potu), więc liczba koszulek spada, a liczba warstw (długi rękaw, bluza) rośnie, bez zwiększania łącznej liczby sztuk ponad ~W+2.

### Gaps
- Brak pierwotnych źródeł (REI, Decathlon, Skalnik, 8academy) z liczbami; pobieranie zablokowane.
- Brak źródeł z liczbami dla piżam, szortów, bluz (PROP).

## 2. Warstwy według pasm temperatury (dzień i noc)

### Takeaway
Źródła potwierdzają ogólny schemat trzech warstw (baza, środek, powłoka) i że przy ok. 10 °C wystarcza lekka koszulka + opcjonalny cienki polar + softshell. Dokładne pasma 5-stopniowe są moją interpolacją (PROP) oraz kilku słabszych cytatów.

### Cited Findings
- Warunki łagodne (10 °C i więcej) na szlaku: baza = lekka koszulka syntetyczna lub wełniana, warstwa pośrednia = lekki polar lub brak, zewnętrzna = softshell; polar można pominąć przy intensywnym ruchu — [Sportano: Jaka kurtka na jesień w góry](https://sportano.pl/blog/?p=35478) (wg streszczenia wyszukiwarki; sklep internetowy, jedno źródło).
- Na długie przerwy, szczyt lub biwak warto mieć dodatkową warstwę docieplającą — [Sportano](https://sportano.pl/blog/?p=35478) (jw.).
- Około 4 °C: baza + środek + lekka izolacja, rękawiczki, wiatroszczelna i wodoodporna powłoka; około −1 °C: dodatkowo ocieplana kurtka, czapka, szalik; poniżej −7 °C: gruba baza, polar + puch, twarda powłoka — [rcflood.gov mirror](https://rcflood.gov/?p=1252), [hiking-waldo.pages.dev](https://hiking-waldo.pages.dev/articles/layering-temperature-guide.html) (niewiarygodne domeny, z wcześniejszych notatek).
- Powłoka przeciwdeszczowa na polar wystarcza do ok. 16 °C (wynik wyszukiwania w wcześniejszych notatkach, niezweryfikowane).
- Unikać bawełny w chłodzie i wilgoci (wchłania wodę, długo schnie); typowy zestaw na deszcz: koszulka/bielizna termiczna z poliestru lub wełny, lekki polar, spodnie turystyczne syntetyczne, lekka kurtka i spodnie przeciwdeszczowe — [REI: How to dress your kids for the outdoors](https://www.rei.com/learn/expert-advice/how-to-dress-your-kids-for-the-outdoors.html) (wg streszczenia wyszukiwarki, strona niepobrana).

### Inferences
- Pasma 5-stopniowe w sekcji 4 to interpolacja między cytowanymi punktami (4, 10, 16 °C); traktować jako domyślne.
- Noc: do doboru bluzy/polaru/czapki używać Tmin; do doboru koszulek i spodni/szortów używać Tmax (PROP).

### Gaps
- Brak pierwotnego źródła z tabelą pasm 5-10, 10-15, 15-20, 20-25 °C.
- Nie ustalono, czy ocenianej temperaturze odpowiada temperatura odczuwalna (wiatr); wiatr traktować osobno.

## 3. Softshell vs hardshell vs lekka kurtka vs parasol

### Takeaway
Zgodnie ze źródłami: softshell do suchej, aktywnej, łagodnej pogody i krótkich przelotnych opadów; hardshell (membrana, szczelne szwy, kaptur) do długiego deszczu, silnego wiatru, zimna i wilgoci. Dla leisure city-break większość podróżnych wybiera lekką pakowalną kurtkę przeciwdeszczową, opcjonalnie z małym parasolem.

### Cited Findings
- Softshell radzi sobie z lekką mżawką i krótkim deszczem, ale nie jest przeznaczony do długiej ekspozycji; przy ulewach i długim moknięciu zaleca się hardshell — [Alibaba product insights: hardshell vs softshell](https://www.alibaba.com/product-insights/hardshell-jacket-vs-softshell-when-to-wear-which-layer.html) (niska wiarygodność, serwis produktowy; ogólna zgodność z innymi źródłami).
- Softshell blokuje wiatr dobrze, ale nie całkowicie; hardshell daje pełną ochronę, jest mniej oddychający, gorszy przy wysiłku w łagodną pogodę; typowy zestaw: softshell jako warstwa aktywna + pakowalny hardshell w plecaku — [Revolution Race: hardshell vs softshell](https://revolutionrace.com/campsite/hardshell-vs-softshell), [Trekitt](https://www.trekitt.co.uk/blog/softshell-vs-hardshell/) (wg streszczenia wyszukiwarki).
- Wybór zależy od aktywności, czasu trwania i temperatury: ten sam lekki deszcz latem znosi softshell, zimą potrzebny hardshell — [UKHillwalking forum](https://www.ukhillwalking.com/forums/gear/breathability_in_waterproof_jackets-752672) (opinia z forum).
- Softshell chroni przed wiatrem i lekkim deszczem, nie jest całkowicie wodoodporny; na krótką trasę przy dobrej prognozie wystarcza lekka ochrona w plecaku; przy długim marszu w deszczu liczą się membrana, zaklejone szwy, kaptur; na podejściu kurtka przeciwdeszczowa daje wilgoć od środka, pomagają zamki wentylacyjne — [Sportano](https://sportano.pl/blog/?p=35478) (wg streszczenia).
- Softshell hybrydowy (materiał softshell + elementy wodoodporne) jest kompromisem, gdy nie chcemy drugiej kurtki — [Decathlon: softshell](https://www.decathlon.pl/c/htp/softshell-co-to-za-material-jakie-cechy-ma-kurtka-softshell_852f11ab-dee0-420b-a35e-1e448c72c84b) (wg streszczenia).
- Deszcz vs parasol w Europie (forum): większość doświadczonych podróżnych woli pakowalną kurtkę z kapturem (wolne ręce, działa też jako warstwa), część dodaje mały parasol (krótkie przelotne opady, aparat, mniejsze przegrzanie), niektórzy kupują parasol na miejscu lub biorą z hotelu; przy tłoku parasol zajmuje rękę — [Rick Steves forum: umbrella or raincoat](https://community.ricksteves.com/travel-forum/packing/umbrella-or-raincoat), [packing for rain](https://community.ricksteves.com/travel-forum/general-europe/packing-for-rain), [Fodor's](https://www.fodors.com/community/europe/packing-with-rain-in-mind-981746/) (anegdotyczne). [SHED RAIN](https://shedrain.com/blogs/community-stories/your-ultimate-guide-to-travel-umbrellas-packing-for-unpredictable-summer-weather) i [SmarterTravel](https://www.smartertravel.com/pack-light-comfortable-look-cool-europe/) zalecają parę kurtka + parasol (źródło komercyjne/redakcyjne).
- Zdecydowany limit z konkretnymi minutami przemakania softshellu (12-18 min przy umiarkowanym deszczu) pochodzi tylko z serwisu Alibaba i jest niezweryfikowany; nie używać.

### Inferences (PROP, reguły decyzyjne)
- Hardshell/kurtka przeciwdeszczowa z membraną: gdy spodziewany deszcz > ~1 h ciągłego chodzenia na zewnątrz, lub wiatr > ~30 km/h z deszczem, lub Tmin < 10 °C z deszczem, lub góry/trekking (długa ekspozycja).
- Softshell: gdy Tmin 5-15 °C, sucho lub przelotne, wiatr, aktywny dzień; softshell + parasol wystarcza w mieście przy krótkich opadach.
- Lekka kurtka/wiatrówka wodoodporna (pakowalna) + opcjonalnie mały parasol: miasto, Tmin > 12 °C, przelotne opady, prawdopodobieństwo opadów 30-60%.
- Sam parasol (bez kurtki): lato (Tmax > 22 °C), miasto, krótkie burze; przy wietrze > 40 km/h parasol bezużyteczny, wtedy kurtka.
- Poncho/peleryna: opcja tania przy upalnym deszczu i dzieciach w wózku.

### Gaps
- Brak wiarygodnych, liczbowych progów (minuty deszczu, mm/h, km/h wiatru) z autorytatywnych źródeł (REI, Gore-Tex, Decathlon); progi powyżej to PROP.
- Nie pobrano REI Rain Jackets ani Layering Basics.

## 4. Tabela reguł (pasmo temperatury x pozycja -> ilość), do wykorzystania w kodzie

### Takeaway
Poniższa tabela jest PROP, zbudowana na formułach CYT (sekcja 1) i progach CYT/PROP (sekcje 2-3). Zmienne: D = dni, W = min(D, 7) jeśli pranie, inaczej min(D, 14); Tmax = dzienna maksymalna, Tmin = nocna minimalna; ceil = zaokrąglenie w górę.

### Cited Findings
- Podstawy formuł jak w sekcji 1 (SwissGear, we3travel, Rankomat, tanie-loty).
- Progi: 4 °C, 10 °C, 16 °C jak w sekcji 2 (rcflood mirror, Sportano, wcześniejsze notatki).

### Inferences (tabela PROP)

Pasma wg Tmax (dzień). Wiersze "noc" zmieniają tylko bluzę/polar/kurtkę/czapkę wg Tmin.

| Pasmo Tmax | koszulki | długie spodnie | szorty | bluza/polar | kurtka |
|---|---|---|---|---|---|
| < 5 | ceil(W*0.7) z czego 50% długi rękaw; + 1-2 bielizny termiczne | ceil(W/3), min 2, + 1 termiczne | 0 | 2 (1 gdy W<=4) | zimowa/puchowa + czapka, rękawiczki, szalik |
| 5-10 | ceil(W*0.8), 60% długi rękaw | ceil(W/3), min 2 | 0 | 2 | softshell lub przejściowa; hardshell gdy deszcz; czapka, cienkie rękawiczki |
| 10-15 | W, 50% długi rękaw | ceil(W/3), min 2 | 0 | 1-2 | softshell + lekka przeciwdeszczowa (lub hybrydowy softshell) |
| 15-20 | W | ceil(W/3), min 1-2 | ceil(W/4) | 1 | lekka kurtka/wiatrówka przeciwdeszczowa; softshell przy wietrze |
| 20-25 | W | 1 | ceil(W/3) | 1 jeśli Tmin < 15 | pakowalna przeciwdeszczowa lub parasol |
| > 25 | W + 1 (do W+2 gdy > 30) | 1 (lekkie, opcjonalnie) | ceil(W/2) | 0-1 (wieczór, klimatyzacja) | parasol lub poncho; kurtka tylko przy burzy |

Zmiany nocne (Tmin): Tmin < 5: dodaj polar + czapka + piżama ciepła; Tmin 5-10: bluza/polar na noc; Tmin 10-15: lekka bluza; Tmin > 15: piżama krótka.

Stałe: bielizna = W + 1 (W + 2 przy Tmax > 25 lub aktywności), min 3; skarpetki = W (W + 1 przy Tmax < 10 i deszczu), + 1 para ciepłych przy Tmin < 5; piżama = 1 (2 gdy D > 14 bez prania); strój kąpielowy 1-2 wg noclegu/basenu; parasol: prawdopodobieństwo opadu > 40% i Tmax > 15 °C.

Reguła deszczu (niezależna od temperatury), wejście `rain_prob`, `rain_hours`, `wind_kmh`, `activity`:
- if activity == "trekking" or rain_hours > 1 or (rain_prob > 40 and Tmax < 10) -> hardshell (+ spodnie przeciwdeszczowe przy rain_hours > 3).
- elif rain_prob > 30 and (wind_kmh > 25 or Tmin < 15) -> softshell/wiatrówka wodoodporna.
- elif rain_prob > 30 -> parasol lub pakowalna kurtka.
- else -> brak.

Dzieci: dla dzieci 1-6 lat zwiększyć koszulki i bieliznę (wypadki, błoto) o +50% (min W+2, bielizny W+3, spodnie +1); zapasowy komplet w plecaku dziennym; nie ubierać za grubo pod kurtką przeciwdeszczową (3 warstwy pod kurtką przy łagodnym dniu to za dużo); w wózku więcej warstw niż u biegającego dziecka; sprawdzać ręce i stopy (PROP wg REI/Hatley w Cited Findings poniżej).

### Cited Findings (dzieci)
- Wilgoć w środku kurtki dziecka często pochodzi z potu, a nie przecieku; 3 warstwy pod strojem przeciwdeszczowym w łagodny dzień to prawie zawsze za dużo; dziecko biegające potrzebuje mniej warstw niż siedzące w wózku; ocenia się po skórze, dłoniach i stopach — [Hatley: what to wear under rain gear](https://hatley.com/blogs/learn/what-to-wear-under-rain-gear-a-parents-layering-guide), [REI kids](https://www.rei.com/learn/expert-advice/how-to-dress-your-kids-for-the-outdoors.html) (wg streszczenia wyszukiwarki).

### Gaps
- Brak wiarygodnej tabeli temperatura -> ubranie dla dzieci (wyniki PatPat bez liczb).
- Zwiększenia dla dzieci (+50%) to PROP bez źródła.
- Nie ustalono standardowych wartości klimatycznych Polski per miesiąc (IMGW daje normy 1991-2020 jako klasy; w wynikach znalazłem tylko zakres dni z opadem dla Gdańska w październiku 11-17, [IMGW](https://imgw.pl/sites/default/files/2023-11/imgw_1113-charakterystyka-wybranych-elementow-klimatu-w-polsce-w-pazdzierniku-2023-r.pdf)). Dla aplikacji lepiej użyć prognozy API niż klimatologii.

## Co wymaga potwierdzenia
Po dopuszczeniu hostów rei.com, sportano.pl, decathlon.pl, outdoorresearch.com w sieci sesji warto pobrać: REI "Rain Jackets" i "Layering Basics", Sportano jesień w góry, Decathlon softshell, aby zamienić PROP na CYT w sekcjach 2-4.
