#!/bin/bash 
set -o nounset
set -o errexit

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd)" 
find "${1}" -mindepth 2 -not -path "./node_modules/*" -name "node_modules" -print0 | xargs -0 --max-procs=`nproc` rm -Rf
find "${1}" -mindepth 2 -not -path "./node_modules/*" -name "package.json" -print0 | sed s,/package.json,,g | xargs -0 --max-procs=`nproc` -I % bash -c "${SCRIPT_DIR}/npm-install-xargs.sh %"