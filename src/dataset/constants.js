// Time periods available in the dataset
export const PERIODS_5YR  = ["1960", "1965", "1970", "1975", "1980", "1985", "1990", "1995", "2000", "2005"];
export const PERIODS_10YR = ["1960", "1970", "1980", "1990", "2000"];
export const PERIODS = PERIODS_5YR; // default

// Historical country codes mapped to their modern successor state on the map
// SCG (Serbia & Montenegro) -> SRB (Serbia)
// SUD (old Sudan code) -> SDN (modern Sudan)
export const HISTORICAL_TO_MODERN = {
  "SCG": "SRB",
  "SUD": "SDN"
};

// Reverse: modern map code -> historical data code(s) to check as fallback
export const MODERN_TO_HISTORICAL = {
  "SRB": "SCG",
  "SDN": "SUD"
};

// ISO3 country codes to display names
export const CODE_TO_NAME = {
  "ALB": "Albania", "AND": "Andorra", "AUT": "Austria", "BEL": "Belgium",
  "BIH": "Bosnia and Herzegovina", "BGR": "Bulgaria", "HRV": "Croatia",
  "CYP": "Cyprus", "CZE": "Czech Republic", "DNK": "Denmark", "EST": "Estonia",
  "FIN": "Finland", "FRA": "France", "DEU": "Germany", "GRC": "Greece",
  "HUN": "Hungary", "ISL": "Iceland", "IRL": "Ireland", "ITA": "Italy",
  "XKX": "Kosovo", "KOS": "Kosovo", "LVA": "Latvia", "LIE": "Liechtenstein",
  "LTU": "Lithuania", "LUX": "Luxembourg", "MLT": "Malta", "MCO": "Monaco",
  "MNE": "Montenegro", "NLD": "Netherlands", "MKD": "North Macedonia",
  "NOR": "Norway", "POL": "Poland", "PRT": "Portugal", "ROU": "Romania",
  "SMR": "San Marino", "SRB": "Serbia", "SVK": "Slovakia", "SVN": "Slovenia",
  "ESP": "Spain", "SWE": "Sweden", "CHE": "Switzerland", "GBR": "United Kingdom",
  "SCG": "Serbia & Montenegro",
  "ABW": "Aruba", "AFG": "Afghanistan", "AGO": "Angola", "AIA": "Anguilla",
  "ARE": "UAE", "ARG": "Argentina", "ARM": "Armenia", "ASM": "American Samoa",
  "ATG": "Antigua and Barbuda", "AUS": "Australia", "AZE": "Azerbaijan",
  "BDI": "Burundi", "BEN": "Benin", "BFA": "Burkina Faso", "BGD": "Bangladesh",
  "BHR": "Bahrain", "BHS": "Bahamas", "BLR": "Belarus", "BLZ": "Belize",
  "BMU": "Bermuda", "BOL": "Bolivia", "BRA": "Brazil", "BRB": "Barbados",
  "BRN": "Brunei", "BTN": "Bhutan", "BWA": "Botswana",
  "CAF": "Central African Republic", "CAN": "Canada", "CHN": "China",
  "CIV": "Ivory Coast", "CMR": "Cameroon", "COD": "DR Congo", "COG": "Congo",
  "COK": "Cook Islands", "COL": "Colombia", "COM": "Comoros", "CPV": "Cape Verde",
  "CRI": "Costa Rica", "CUB": "Cuba", "CUW": "Curacao", "DJI": "Djibouti",
  "DMA": "Dominica", "DOM": "Dominican Republic", "DZA": "Algeria",
  "ECU": "Ecuador", "EGY": "Egypt", "ERI": "Eritrea", "ETH": "Ethiopia",
  "FJI": "Fiji", "FLK": "Falkland Islands", "FSM": "Micronesia", "GAB": "Gabon",
  "GEO": "Georgia", "GHA": "Ghana", "GIB": "Gibraltar", "GIN": "Guinea",
  "GLP": "Guadeloupe", "GMB": "Gambia", "GNB": "Guinea-Bissau",
  "GNQ": "Equatorial Guinea", "GRD": "Grenada", "GRL": "Greenland",
  "GTM": "Guatemala", "GUF": "French Guiana", "GUM": "Guam", "GUY": "Guyana",
  "HKG": "Hong Kong", "HND": "Honduras", "HTI": "Haiti", "IDN": "Indonesia",
  "IND": "India", "IRN": "Iran", "IRQ": "Iraq", "ISR": "Israel", "JAM": "Jamaica",
  "JOR": "Jordan", "JPN": "Japan", "KAZ": "Kazakhstan", "KEN": "Kenya",
  "KGZ": "Kyrgyzstan", "KHM": "Cambodia", "KIR": "Kiribati",
  "KNA": "Saint Kitts and Nevis", "KOR": "South Korea", "KWT": "Kuwait",
  "LAO": "Laos", "LBN": "Lebanon", "LBR": "Liberia", "LBY": "Libya",
  "LCA": "Saint Lucia", "LKA": "Sri Lanka", "LSO": "Lesotho", "MAC": "Macao",
  "MAR": "Morocco", "MDA": "Moldova", "MDG": "Madagascar", "MDV": "Maldives",
  "MEX": "Mexico", "MHL": "Marshall Islands", "MMR": "Myanmar", "MNG": "Mongolia",
  "MNP": "Northern Mariana Islands", "MOZ": "Mozambique", "MRT": "Mauritania",
  "MSR": "Montserrat", "MTQ": "Martinique", "MUS": "Mauritius", "MWI": "Malawi",
  "MYS": "Malaysia", "MYT": "Mayotte", "NAM": "Namibia", "NCL": "New Caledonia",
  "NER": "Niger", "NGA": "Nigeria", "NIC": "Nicaragua", "NIU": "Niue",
  "NPL": "Nepal", "NRU": "Nauru", "NZL": "New Zealand", "OMN": "Oman",
  "PAK": "Pakistan", "PAN": "Panama", "PER": "Peru", "PHL": "Philippines",
  "PLW": "Palau", "PNG": "Papua New Guinea", "PRI": "Puerto Rico",
  "PRK": "North Korea", "PRY": "Paraguay", "PSE": "Palestine",
  "PYF": "French Polynesia", "QAT": "Qatar", "REU": "Reunion", "RUS": "Russia",
  "RWA": "Rwanda", "SAU": "Saudi Arabia", "SDN": "Sudan", "SEN": "Senegal",
  "SGP": "Singapore", "SHN": "Saint Helena", "SLB": "Solomon Islands",
  "SLE": "Sierra Leone", "SLV": "El Salvador", "SOM": "Somalia",
  "SPM": "Saint Pierre and Miquelon", "SSD": "South Sudan",
  "STP": "Sao Tome and Principe", "SUR": "Suriname", "SWZ": "Eswatini",
  "SXM": "Sint Maarten", "SYC": "Seychelles", "SYR": "Syria",
  "TCA": "Turks and Caicos", "TCD": "Chad", "TGO": "Togo", "THA": "Thailand",
  "TJK": "Tajikistan", "TKL": "Tokelau", "TKM": "Turkmenistan",
  "TLS": "East Timor", "TON": "Tonga", "TTO": "Trinidad and Tobago",
  "TUN": "Tunisia", "TUR": "Turkey", "TUV": "Tuvalu", "TWN": "Taiwan",
  "TZA": "Tanzania", "UGA": "Uganda", "UKR": "Ukraine", "URY": "Uruguay",
  "USA": "United States", "UZB": "Uzbekistan", "VCT": "Saint Vincent",
  "VEN": "Venezuela", "VGB": "British Virgin Islands", "VIR": "US Virgin Islands",
  "VNM": "Vietnam", "VUT": "Vanuatu", "WLF": "Wallis and Futuna", "WSM": "Samoa",
  "YEM": "Yemen", "ZAF": "South Africa", "ZMB": "Zambia", "ZWE": "Zimbabwe",
  "ANT": "Netherlands Antilles", "ALA": "Aland Islands", "ESH": "Western Sahara",
  "MAF": "Saint Martin", "PCN": "Pitcairn Islands", "SUD": "Sudan",
  "CHL": "Chile", "MLI": "Mali", "CHI": "Channel Islands",
  "FRO": "Faroe Islands", "CYM": "Cayman Islands", "IOT": "British Indian Ocean Territory",
  "SGS": "South Georgia and the South Sandwich Islands",
  "ATF": "French Southern Territories", "HMD": "Heard and McDonald Islands", "BLM": "St. Barthélemy"
  
};

// TopoJSON numeric IDs to ISO3 codes
export const NUM_TO_ISO3 = {
  "4": "AFG", "8": "ALB", "12": "DZA", "16": "ASM", "20": "AND", "24": "AGO",
  "28": "ATG", "31": "AZE", "32": "ARG", "36": "AUS", "40": "AUT", "44": "BHS",
  "48": "BHR", "50": "BGD", "51": "ARM", "52": "BRB", "56": "BEL", "60": "BMU",
  "64": "BTN", "68": "BOL", "70": "BIH", "72": "BWA", "76": "BRA", "84": "BLZ",
  "90": "SLB", "96": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR",
  "116": "KHM", "120": "CMR", "124": "CAN", "132": "CPV", "140": "CAF",
  "144": "LKA", "148": "TCD", "152": "CHL", "156": "CHN", "158": "TWN",
  "170": "COL", "174": "COM", "178": "COG", "180": "COD", "184": "COK",
  "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE",
  "204": "BEN", "208": "DNK", "212": "DMA", "214": "DOM", "218": "ECU",
  "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST",
  "234": "FRO", "238": "FLK", "242": "FJI", "246": "FIN", "250": "FRA",
  "254": "GUF", "258": "PYF", "262": "DJI", "266": "GAB", "268": "GEO",
  "270": "GMB", "275": "PSE", "276": "DEU", "288": "GHA", "292": "GIB",
  "296": "KIR", "300": "GRC", "304": "GRL", "308": "GRD", "312": "GLP",
  "316": "GUM", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI",
  "336": "VAT", "340": "HND", "344": "HKG", "348": "HUN", "352": "ISL",
  "356": "IND", "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL",
  "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN",
  "398": "KAZ", "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR",
  "414": "KWT", "417": "KGZ", "418": "LAO", "422": "LBN", "426": "LSO",
  "428": "LVA", "430": "LBR", "434": "LBY", "438": "LIE", "440": "LTU",
  "442": "LUX", "446": "MAC", "450": "MDG", "454": "MWI", "458": "MYS",
  "462": "MDV", "466": "MLI", "470": "MLT", "474": "MTQ", "478": "MRT",
  "480": "MUS", "484": "MEX", "492": "MCO", "496": "MNG", "498": "MDA",
  "499": "MNE", "500": "MSR", "504": "MAR", "508": "MOZ", "512": "OMN",
  "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "540": "NCL",
  "548": "VUT", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA",
  "570": "NIU", "574": "NFK", "578": "NOR", "580": "MNP", "583": "FSM",
  "584": "MHL", "585": "PLW", "586": "PAK", "591": "PAN", "598": "PNG",
  "600": "PRY", "604": "PER", "608": "PHL", "612": "PCN", "616": "POL",
  "620": "PRT", "624": "GNB", "626": "TLS", "630": "PRI", "634": "QAT",
  "638": "REU", "642": "ROU", "643": "RUS", "646": "RWA", "654": "SHN",
  "659": "KNA", "660": "AIA", "662": "LCA", "666": "SPM", "670": "VCT",
  "674": "SMR", "678": "STP", "682": "SAU", "686": "SEN", "688": "SRB",
  "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM",
  "705": "SVN", "706": "SOM", "710": "ZAF", "716": "ZWE", "720": "YEM",
  "724": "ESP", "728": "SSD", "729": "SDN", "732": "ESH", "736": "SDN",
  "740": "SUR", "744": "SJM", "748": "SWZ", "752": "SWE", "756": "CHE",
  "760": "SYR", "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL",
  "776": "TON", "780": "TTO", "784": "ARE", "788": "TUN", "792": "TUR",
  "795": "TKM", "796": "TCA", "798": "TUV", "800": "UGA", "804": "UKR",
  "807": "MKD", "818": "EGY", "826": "GBR", "831": "GGY", "832": "JEY",
  "833": "IMN", "834": "TZA", "840": "USA", "850": "VIR", "854": "BFA",
  "858": "URY", "860": "UZB", "862": "VEN", "876": "WLF", "882": "WSM",
  "887": "YEM", "894": "ZMB", "-99": "CYN", "10": "ATA","86": "IOT", "92": "VGB", "136": "CYM", "234": "FRO",
"239": "SGS", "248": "ALA", "260": "ATF", "334": "HMD",
"531": "CUW", "533": "ABW", "534": "SXM", "652": "BLM",
"663": "MAF",
};

// ISO3 codes to continent
export const CODE_TO_CONTINENT = {
  // Africa
  ...Object.fromEntries([
    "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CMR", "CPV", "CAF", "TCD",
    "COM", "COG", "COD", "CIV", "DJI", "EGY", "GNQ", "ERI", "ETH", "GAB",
    "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG", "MWI",
    "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA", "STP",
    "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "SUD", "SWZ", "TZA",
    "TGO", "TUN", "UGA", "ZMB", "ZWE", "MYT", "REU", "ESH", "SHN"
  ].map(c => [c, "Africa"])),
  // Asia
  ...Object.fromEntries([
    "AFG", "ARM", "AZE", "BHR", "BGD", "BTN", "BRN", "KHM", "CHN", "CYP",
    "GEO", "HKG", "IND", "IDN", "IRN", "IRQ", "ISR", "JPN", "JOR", "KAZ",
    "KWT", "KGZ", "LAO", "LBN", "MAC", "MYS", "MDV", "MNG", "MMR", "NPL",
    "OMN", "PAK", "PSE", "PHL", "QAT", "SAU", "SGP", "KOR", "PRK", "LKA",
    "SYR", "TWN", "TJK", "THA", "TLS", "TUR", "TKM", "ARE", "UZB", "VNM", "YEM"
  ].map(c => [c, "Asia"])),
  // Europe
  ...Object.fromEntries([
    "ALB", "AND", "AUT", "BEL", "BIH", "BGR", "BLR", "HRV", "CZE", "DNK",
    "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "XKX",
    "KOS", "LVA", "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD",
    "MKD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SCG", "SVK",
    "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "GIB", "CHI"
  ].map(c => [c, "Europe"])),
  // North America
  ...Object.fromEntries([
    "ATG", "BHS", "BRB", "BLZ", "CAN", "CRI", "CUB", "DMA", "DOM", "SLV",
    "GRD", "GTM", "HTI", "HND", "JAM", "MEX", "NIC", "PAN", "PRI", "KNA",
    "LCA", "VCT", "TTO", "USA", "ABW", "AIA", "ANT", "BMU", "CUW", "GLP",
    "GRL", "GUF", "GUM", "MTQ", "MNP", "SPM", "SXM", "MAF", "TCA", "VGB", "VIR"
  ].map(c => [c, "North America"])),
  // South America
  ...Object.fromEntries([
    "ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PRY", "PER", "SUR",
    "URY", "VEN", "FLK"
  ].map(c => [c, "South America"])),
  // Oceania
  ...Object.fromEntries([
    "AUS", "NZL", "FJI", "PNG", "SLB", "VUT", "WSM", "TON", "KIR", "FSM",
    "MHL", "PLW", "NRU", "TUV", "NIU", "COK", "PYF", "NCL", "TKL", "WLF"
  ].map(c => [c, "Oceania"]))
};

// List of continents for filtering
export const CONTINENTS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

// TopoJSON URL for world map
export const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
