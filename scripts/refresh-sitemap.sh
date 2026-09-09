#!/usr/bin/env bash
set -euo pipefail
# Run from a timer on the VPS. This endpoint renews the snapshot after one hour.
headers=$(mktemp)
trap 'rm -f "$headers"' EXIT
curl --fail --silent --show-error --max-time 120 --dump-header "$headers" \
  --output /dev/null https://boukirdiamond.com/sitemap.xml
if grep -qi '^x-sitemap-cache: stale' "$headers"; then
  echo 'Sitemap: last valid snapshot is being served; regeneration failed.' >&2
  exit 1
fi
if ! grep -qi '^x-sitemap-cache: fresh' "$headers"; then
  echo 'Sitemap: new publication endpoint is not active or cache header is missing.' >&2
  exit 1
fi
