#!/usr/bin/env bash
# Đóng gói plugin thành file zip để tải lên claude.ai (Plugins) hoặc gửi cho người khác.
#   bash plugins/build_zip.sh            -> dist/aitrends-3d-studio-<version>.zip
set -euo pipefail
cd "$(dirname "$0")"
name=aitrends-3d-studio
ver=$(python3 -c "import json;print(json.load(open('$name/.claude-plugin/plugin.json'))['version'])")
mkdir -p ../dist
out="../dist/$name-$ver.zip"
rm -f "$out"
zip -qr "$out" "$name" -x "*/node_modules/*" "*/build/*" "*/__pycache__/*" "*.pyc" "*/.DS_Store"
echo "wrote $(cd .. && pwd)/dist/$name-$ver.zip"
