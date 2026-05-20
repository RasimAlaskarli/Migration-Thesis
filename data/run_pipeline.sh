#!/usr/bin/env bash
# Regenerates all derived data for the Migration Atlas project.
# Run from the data/ folder: ./run_pipeline.sh

set -e

cd "$(dirname "$0")"

PYTHON="${PYTHON:-python3}"

# The two large Abel CSVs are not committed; check they exist before running.
for f in raw/gf_imr.csv raw/bilat_mig.csv; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: $f is missing. See data/README.md for download instructions." >&2
    exit 1
  fi
done

run_step() {
  local label="$1"
  shift
  echo -n "[$label] "
  if "$@" > /tmp/pipeline_out.log 2>&1; then
    echo "OK"
    grep -E '^\[OK\]' /tmp/pipeline_out.log | sed 's/^/      /'
  else
    echo "FAILED"
    tail -10 /tmp/pipeline_out.log | sed 's/^/      /'
    exit 1
  fi
}

run_step "1/5 build_chart_data" $PYTHON pipeline/build_chart_data.py \
    --input-dir raw \
    --out-annual ../src/dataset/chartData.json \
    --out-5yr    intermediate/chartData_5yr.json

run_step "2/5 merge_source_estimates" $PYTHON pipeline/merge_source_estimates.py \
    --gf-imr     raw/gf_imr.csv \
    --bilat-mig  raw/bilat_mig.csv \
    --output     intermediate/combined_flows.json

run_step "3/5 compute_flow_reliability" $PYTHON pipeline/compute_flow_reliability.py \
    --input  intermediate/combined_flows.json \
    --output intermediate/definitive_flows.json

run_step "4/5 export_app_data" $PYTHON pipeline/export_app_data.py \
    --input    intermediate/definitive_flows.json \
    --out-5yr  ../src/dataset/migrationData_5yr.json \
    --out-10yr ../src/dataset/migrationData_10yr.json

run_step "5/5 analyze_chapter4" $PYTHON analysis/analyze_chapter4.py \
    --input        ../src/dataset/chartData.json \
    --out-dataset  intermediate/country_dataset.csv \
    --out-figures  analysis/figures

echo
echo "Pipeline complete."