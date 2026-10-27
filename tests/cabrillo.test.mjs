// QSO 2.1 — Cabrillo v3: câmpuri suplimentare de antet, import Cabrillo (euristic), tur-retur.
import {createRequire} from "module";
import path from "path"; import {fileURLToPath} from "url"; import fs from "fs";
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require("playwright");
const __dir = path.dirname(fileURLToPath(import.meta.url));
const URL_ = "file://" + path.resolve(__dir, "..", "index.html");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL:", m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + " (obținut " + JSON.stringify(a) + ", așteptat " + JSON.stringify(b) + ")");
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
const ctx = await browser.newContext({acceptDownloads: true});
await ctx.route(/^https?:/, r => r.abort());
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(URL_); await p.waitForFunction(() => window.__qso);

console.log("## toCabrillo — antet extins");
const out = await p.evaluate(() => window.__qso.Fmt.toCabrillo(
  [{CALL: "DL1ABC", QSO_DATE: "20261010", TIME_ON: "120130", BAND: "20m", FREQ: "14.2", MODE: "SSB", RST_SENT: "59", RST_RCVD: "57", STX: "1", SRX: "23", STATION_CALLSIGN: "YO3XYZ"}],
  {callsign: "YO3XYZ", contest: "TEST", catAssisted: "NON-ASSISTED", catStation: "FIXED", catTime: "24-HOURS", catTx: "ONE", club: "Radio Club", email: "a@b.ro", operators: "YO3XYZ", address: "Str. X 1\nBucuresti", soapbox: "Test\nal doilea rând\r\nTAG: injectat", name: "Ion", location: "RO", version: "9.9.9"}));
const L = out.split("\r\n");
eq(L[0], "START-OF-LOG: 3.0", "prima linie");
ok(L.includes("CATEGORY-ASSISTED: NON-ASSISTED") && L.includes("CATEGORY-STATION: FIXED") && L.includes("CATEGORY-TIME: 24-HOURS") && L.includes("CATEGORY-TRANSMITTER: ONE"), "categorii noi");
ok(L.includes("LOCATION: RO") && L.includes("CLUB: Radio Club") && L.includes("EMAIL: a@b.ro") && L.includes("OPERATORS: YO3XYZ"), "câmpuri opționale");
eq(L.filter(l => l.startsWith("ADDRESS:")), ["ADDRESS: Str. X 1", "ADDRESS: Bucuresti"], "ADDRESS pe linii separate");
eq(L.filter(l => l.startsWith("SOAPBOX:")).length, 3, "SOAPBOX pe linii separate");
ok(!L.some(l => l.startsWith("TAG:")), "o linie de SOAPBOX nu poate injecta o etichetă");
ok(L.includes("CREATED-BY: QSO 9.9.9 (fără frontiere)"), "CREATED-BY cu versiunea");
const out2 = await p.evaluate(() => window.__qso.Fmt.toCabrillo([], {callsign: "YO3XYZ", contest: "X"}));
ok(!/CATEGORY-ASSISTED|CATEGORY-STATION|CLUB:|EMAIL:|SOAPBOX:/.test(out2), "câmpurile goale nu apar");
ok(/^END-OF-LOG:/m.test(out) && L[L.length - 2] === "END-OF-LOG:", "END-OF-LOG");

console.log("## parseCabrillo");
const sample = [
  "START-OF-LOG: 3.0", "CALLSIGN: YO3XYZ", "CONTEST: CQ-WW-CW", "CREATED-BY: altul", "ADDRESS: L1", "ADDRESS: L2",
  "QSO: 14025 CW 2026-10-10 1201 YO3XYZ         599 05 001    DL1ABC        599 14 023",
  "QSO:  7010 CW 2026-10-10 1230 YO3XYZ         599 05 002    OK1XYZ        579 15 044",
  "QSO: 14250 PH 2026-10-10 1301 YO3XYZ         59  05        W1AW          57  05",
  "QSO:   144 PH 2026-10-10 1302 YO3XYZ         59  05        I2ABC         57  15",
  "QSO: 14070 DG 2026-10-10 1303 YO3XYZ         599 05        JA1AAA        599 25",
  "QSO: 14025 CW 2026-10-10 1304 YO3XYZ         599 05 003    FĂRĂ-APEL     599", "XYZ nu e etichetă validă",
  "END-OF-LOG:"].join("\r\n");
const r = await p.evaluate(s => window.__qso.Fmt.parseCabrillo(s), sample);
eq(r.header.CONTEST, "CQ-WW-CW", "antet CONTEST");
eq(r.header.ADDRESS, "L1\nL2", "ADDRESS multiplu");
eq(r.records.length, 5, "5 QSO recunoscute, 1 omis");
const a = r.records[0];
eq([a.CALL, a.FREQ, a.MODE, a.QSO_DATE, a.TIME_ON, a.RST_SENT, a.RST_RCVD, a.STATION_CALLSIGN, a.CONTEST_ID], ["DL1ABC", "14.025", "CW", "20261010", "120100", "599", "599", "YO3XYZ", "CQ-WW-CW"], "câmpuri de bază");
eq([a.STX, a.STX_STRING, a.SRX, a.SRX_STRING], ["5", "001", "14", "023"], "schimb separat (euristic)");
eq(r.records[2].MODE, "SSB", "PH → SSB");
eq(r.records[3].BAND, "2m", "144 = MHz → 2m");
ok(r.records[4].MODE === undefined, "DG fără mod ADIF inventat");
ok(r.warnings.some(w => /PH/.test(w)) && r.warnings.some(w => /DG/.test(w)) && r.warnings.some(w => /omise/.test(w)), "avertismente: " + r.warnings.join(" | "));

console.log("## import prin interfață (tur-retur)");
await p.click("#tb-io");
await p.fill("#cb_contest", "RT");
fs.writeFileSync("/tmp/__qso_rt.log", sample);
await p.setInputFiles("#impFile", "/tmp/__qso_rt.log");
await p.waitForFunction(() => /5/.test(document.getElementById("impMsg").textContent));
const cnt = await p.evaluate(() => document.getElementById("impReport").textContent);
ok(/euristic|heuristically|heurist/i.test(cnt), "raportul de import conține avertismentul euristic");
fs.unlinkSync("/tmp/__qso_rt.log");
ok(errs.length === 0, "fără erori JS: " + errs.join(";"));
await browser.close();
console.log(`\n==== ${pass} verificări reușite, ${fail} eșuate ====`);
process.exit(fail ? 1 : 0);
