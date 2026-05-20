# World Migration Atlas 1960–2010

Interactive web application for visualizing global bilateral migration patterns from 1960 to 2010. Developed as part of a bachelor's thesis at Czech Technical University in Prague.

**Live demo:** [migrationatlas.netlify.app](https://migrationatlas.netlify.app)

## Features

- Interactive world map with zoom, pan, and country selection
- Map shading by net migration, population, unemployment, urbanization, or median age
- Side panel with country-level statistics and demographic line charts
- Bilateral migration flow lookup between any two countries
- Time period selection across 5-year and 10-year intervals (1960–2010)
- Continent-based filtering of migration partners
- Top 10 immigration sources and emigration destinations per country
- Reliability labels on bilateral flows to indicate confidence in modelled estimates
- Graph Builder for comparing any two indicators on a dual-axis chart
- Guided tour for first-time users and a preferences menu for display toggles

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm (comes with Node.js)

## Getting Started

1. **Clone the repository**

```
git clone https://github.com/RasimAlaskarli/Thesis.git
cd Thesis
```

2. **Install dependencies**

```
npm install
```

3. **Start the development server**

```
npm run dev
```

4. **Open in browser**

Navigate to `http://localhost:5173` (or the URL shown in the terminal).

## Building for Production

```
npm run build
```

The output will be in the `dist/` folder, ready to be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).

To preview the production build locally:

```
npm run preview
```

## Tech Stack

- **Frontend:** React 19, D3.js 7
- **Build Tool:** Vite 7
- **Data Processing:** Python 3

## Project Structure

```
Thesis/
├── scripts/                       # Python data processing scripts
│   ├── build_chart_data.py        # Builds demographic indicators JSON from World Bank CSVs
│   ├── merge_source_estimates.py  # Combines Abel 2018 and Abel & Cohen 2019 flow estimates
│   ├── compute_flow_reliability.py # Computes median flow value and reliability labels
│   ├── export_app_data.py         # Produces the final JSON files used by the app
│   ├── analyze_chapter4.py        # Reproduces thesis Chapter 4 statistical analysis
│   ├── validate_migration_data.py # Cross-source validation against World Bank net migration
│   └── run_pipeline.sh            # Runs the full pipeline end-to-end
├── src/
│   ├── components/
│   │   ├── WorldMap.jsx           # Main map component (D3 rendering, zoom, state management)
│   │   ├── CountryPanel.jsx       # Side panel with statistics, charts, and migration lists
│   │   ├── LineChart.jsx          # Time series chart for demographic indicators
│   │   ├── MapControls.jsx        # Zoom buttons, period selector, shading dropdown
│   │   ├── MigrationList.jsx      # Ranked list of migration partners with reliability badges
│   │   ├── CountrySearch.jsx      # Bilateral flow search with country picker
│   │   ├── CountrySearchBar.jsx   # Top-of-map country search bar
│   │   ├── FlowArcs.jsx           # Curved arrows showing migration corridors on the map
│   │   ├── GraphBuilder.jsx       # Dual-axis chart panel for comparing two indicators
│   │   ├── PreferencesMenu.jsx    # Display toggles for arcs and labels
│   │   └── Tour.jsx               # Guided tour overlay for first-time users
│   ├── data/
│   │   ├── chartData.json         # Annual demographic indicators by country (1960–2010)
│   │   ├── migrationData_5yr.json # Bilateral flows aggregated in 5-year intervals
│   │   ├── migrationData_10yr.json # Bilateral flows aggregated in 10-year intervals
│   │   └── constants.js           # Country codes, continent mappings, periods, TopoJSON URL
│   ├── hooks/
│   │   ├── useMapData.js          # Loads and merges JSON data sources
│   │   └── useMapColors.js        # Computes shading color scales
│   ├── utils/
│   │   └── formatters.js          # Number formatting and country name lookup
│   ├── styles/
│   │   └── index.css              # Global styles
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Data Sources

- **Demographic indicators** (net migration, urbanization, median age, unemployment, population) are taken from the [World Bank World Development Indicators](https://data.worldbank.org/).
- **Bilateral migration flow estimates** are taken from [Abel (2018)](https://doi.org/10.1177/0197918318781842) and [Abel & Cohen (2019)](https://doi.org/10.1038/s41597-019-0089-3). The two raw CSV files (~440 MB combined) are not committed to the repository; download them from the authors' Figshare pages and place them in `scripts/` to regenerate the pipeline output.
