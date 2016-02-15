#!/bin/bash

set -e

VER=$1

if [ -z $VER ]; then
    echo 'Must supply a version number to use for tagging'
    exit 1
fi

git fetch fgp
git co master
git reset --hard fgp/master
git mff fgp/develop
git push fgp
git tag v$VER
git push fgp v$VER

