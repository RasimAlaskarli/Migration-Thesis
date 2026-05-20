import { CODE_TO_NAME } from '../data/constants';

const ISO3_TO_ISO2 = {
  ABW: "AW", AFG: "AF", AGO: "AO", AIA: "AI", ALA: "AX", ALB: "AL", AND: "AD",
  ARE: "AE", ARG: "AR", ARM: "AM", ASM: "AS", ATF: "TF", ATG: "AG", AUS: "AU",
  AUT: "AT", AZE: "AZ", BDI: "BI", BEL: "BE", BEN: "BJ", BFA: "BF", BGD: "BD",
  BGR: "BG", BHR: "BH", BHS: "BS", BIH: "BA", BLM: "BL", BLR: "BY", BLZ: "BZ",
  BMU: "BM", BOL: "BO", BRA: "BR", BRB: "BB", BRN: "BN", BTN: "BT", BWA: "BW",
  CAF: "CF", CAN: "CA", CHE: "CH", CHL: "CL", CHN: "CN", CIV: "CI", CMR: "CM",
  COD: "CD", COG: "CG", COK: "CK", COL: "CO", COM: "KM", CPV: "CV", CRI: "CR",
  CUB: "CU", CUW: "CW", CYM: "KY", CYP: "CY", CZE: "CZ", DEU: "DE", DJI: "DJ",
  DMA: "DM", DNK: "DK", DOM: "DO", DZA: "DZ", ECU: "EC", EGY: "EG", ERI: "ER",
  ESH: "EH", ESP: "ES", EST: "EE", ETH: "ET", FIN: "FI", FJI: "FJ", FLK: "FK",
  FRA: "FR", FRO: "FO", FSM: "FM", GAB: "GA", GBR: "GB", GEO: "GE", GGY: "GG",
  GHA: "GH", GIB: "GI", GIN: "GN", GLP: "GP", GMB: "GM", GNB: "GW", GNQ: "GQ",
  GRC: "GR", GRD: "GD", GRL: "GL", GTM: "GT", GUF: "GF", GUM: "GU", GUY: "GY",
  HKG: "HK", HMD: "HM", HND: "HN", HRV: "HR", HTI: "HT", HUN: "HU", IDN: "ID",
  IMN: "IM", IND: "IN", IOT: "IO", IRL: "IE", IRN: "IR", IRQ: "IQ", ISL: "IS",
  ISR: "IL", ITA: "IT", JAM: "JM", JEY: "JE", JOR: "JO", JPN: "JP", KAZ: "KZ",
  KEN: "KE", KGZ: "KG", KHM: "KH", KIR: "KI", KNA: "KN", KOR: "KR", KOS: "XK",
  KWT: "KW", LAO: "LA", LBN: "LB", LBR: "LR", LBY: "LY", LCA: "LC", LIE: "LI",
  LKA: "LK", LSO: "LS", LTU: "LT", LUX: "LU", LVA: "LV", MAC: "MO", MAF: "MF",
  MAR: "MA", MCO: "MC", MDA: "MD", MDG: "MG", MDV: "MV", MEX: "MX", MHL: "MH",
  MKD: "MK", MLI: "ML", MLT: "MT", MMR: "MM", MNE: "ME", MNG: "MN", MNP: "MP",
  MOZ: "MZ", MRT: "MR", MSR: "MS", MTQ: "MQ", MUS: "MU", MWI: "MW", MYS: "MY",
  MYT: "YT", NAM: "NA", NCL: "NC", NER: "NE", NGA: "NG", NIC: "NI", NIU: "NU",
  NLD: "NL", NOR: "NO", NPL: "NP", NRU: "NR", NZL: "NZ", OMN: "OM", PAK: "PK",
  PAN: "PA", PCN: "PN", PER: "PE", PHL: "PH", PLW: "PW", PNG: "PG", POL: "PL",
  PRI: "PR", PRK: "KP", PRT: "PT", PRY: "PY", PSE: "PS", PYF: "PF", QAT: "QA",
  REU: "RE", ROU: "RO", RUS: "RU", RWA: "RW", SAU: "SA", SCG: "RS", SDN: "SD",
  SEN: "SN", SGP: "SG", SGS: "GS", SHN: "SH", SJM: "SJ", SLB: "SB", SLE: "SL",
  SLV: "SV", SMR: "SM", SOM: "SO", SPM: "PM", SRB: "RS", SSD: "SS", STP: "ST",
  SUR: "SR", SVK: "SK", SVN: "SI", SWE: "SE", SWZ: "SZ", SXM: "SX", SYC: "SC",
  SYR: "SY", TCA: "TC", TCD: "TD", TGO: "TG", THA: "TH", TJK: "TJ", TKL: "TK",
  TKM: "TM", TLS: "TL", TON: "TO", TTO: "TT", TUN: "TN", TUR: "TR", TUV: "TV",
  TWN: "TW", TZA: "TZ", UGA: "UG", UKR: "UA", URY: "UY", USA: "US", UZB: "UZ",
  VAT: "VA", VCT: "VC", VEN: "VE", VGB: "VG", VIR: "VI", VNM: "VN", VUT: "VU",
  WLF: "WF", WSM: "WS", XKX: "XK", YEM: "YE", ZAF: "ZA", ZMB: "ZM", ZWE: "ZW"
};

/**
 * Format a number for display (e.g., 1500000 -> "1.5M")
 */
export function formatNum(n) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000000000) return sign + (abs / 1000000000).toFixed(1) + "B";
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

/**
 * Get country name from ISO3 code.
 *
 * Special case: Antarctica is not a country in the same sense as the
 * others (no permanent population, governed by the Antarctic Treaty),
 * but it does appear as a polygon in the world atlas TopoJSON. Showing
 * "Antarctica" reads better than the raw ISO code if the constants
 * file doesn't already have a name registered.
 */
export function getName(code) {
  if (code === "ATA") return CODE_TO_NAME[code] || "Antarctica";
  return CODE_TO_NAME[code] || code;
}

/**
 * Get the regional indicator emoji (flag) for a country.
 *
 * Special case: Antarctica has no flag (it's a treaty territory, not a
 * sovereign nation). We render a penguin instead so the panel header,
 * search dropdown, and graph builder header don't end up with an empty
 * space where the flag would be.
 */
export function getFlagEmoji(code) {
  if (code === "ATA") return "🐧";
  const iso2 = ISO3_TO_ISO2[code];
  if (!iso2 || iso2.length !== 2) return "";
  const chars = iso2.toUpperCase().split("");
  return String.fromCodePoint(...chars.map(c => 127397 + c.charCodeAt(0)));
}