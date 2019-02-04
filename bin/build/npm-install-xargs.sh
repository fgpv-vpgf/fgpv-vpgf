#!/bin/bash
set -o errexit
set -o nounset

function handleError() {
  local LINE="$1"
  local MESSAGE="${2:-}"
  echo "Error on or near line ${LINE}${2:+: }${MESSAGE:-}."
  # To make xargs halt immediately, exit with a code of 255.
  exit 255
}
 
trap 'handleError ${LINENO}' ERR

if [ "$#" -ne "1" ]; then
  handleError "Usage: $0 <directory>"
fi
 
cd "${1}"
rm -Rf "${1}/node_modules"
npm install --ignore-scripts