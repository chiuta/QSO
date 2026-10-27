# Jurnal de modificări — QSO

## 2.1.0 — 2026-10-27 (anterior: 2.0.1)

- Cabrillo: antet extins conform specificației v3 (CATEGORY-ASSISTED / STATION / TIME / TRANSMITTER, LOCATION, CLUB, EMAIL, OPERATORS, ADDRESS, SOAPBOX); câmpurile goale nu se scriu; liniile multiple nu pot injecta etichete; CREATED-BY conține versiunea reală.
- Import Cabrillo (`.log`, `.cbr`): antet + linii QSO; schimbul se separă euristic și importul avertizează (PH -> SSB, DG fără mod, linii fără indicativ omise).
- Teste noi: `tests/cabrillo.test.mjs`; corectat testul de concurs care compara CREATED-BY cu o versiune fixă.
- Nu implementat: tabel DXCC din `cty.dat` — `country-files.com` inaccesibil (proxy 403), nu se reconstituie din memorie; încărcare LoTW/eQSL/Club Log — cere conturi și semnare TQSL, aplicația rămâne offline. Rămân „planificate”.

## 2.0.1 — 2026-10-27 (anterior: 2.0.0)

Doar texte, fără funcții noi.

- Notă în fila Import/Export (8 limbi): încărcarea către LoTW / eQSL / Club Log se face manual din ADIF, aplicația rămâne offline; cerințele se verifică pe site-urile lor.
- README: „Stare: stabil”, „Offline: complet”; secțiune despre ce nu este implementat.
- Nu implementat: tabel DXCC complet din `cty.dat` (descărcare imposibilă în mediul de lucru, licență neverificată) — planificat.
