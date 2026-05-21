# Data & Processing Pipeline

Python pipeline that turns the raw source files into the JSON used by the web app and the Chapter 4 figures.

## Folder Structure

```
data/
├── raw/              # Source CSVs (World Bank + Abel) — large Abel files not committed
├── intermediate/     # Generated intermediate files
├── pipeline/         # Data-processing scripts
├── analysis/         # Chapter 4 analysis script and figures
└── run_pipeline.sh   # Runs the full pipeline
```

## Running the Pipeline

From this folder:

```
./run_pipeline.sh
```

This runs five steps in order:

1. `build_chart_data.py` — World Bank CSVs into annual demographic JSON
2. `merge_source_estimates.py` — combines the two Abel datasets
3. `compute_flow_reliability.py` — median flow value + reliability label
4. `export_app_data.py` — final 5-year and 10-year JSON for the app
5. `analyze_chapter4.py` — Chapter 4 aggregates, correlations, and figures

## Data Sources

- **Demographic indicators** (net migration, urbanization, median age, unemployment, population) from the [World Bank World Development Indicators](https://data.worldbank.org/).
- **Bilateral migration flow estimates** from [Abel (2018)](https://doi.org/10.1177/0197918318781842) and [Abel & Cohen (2019)](https://doi.org/10.1038/s41597-019-0089-3). The two raw CSV files (~440 MB combined) are not committed; download them from the authors' Figshare pages and place them in `raw/` before running the pipeline.