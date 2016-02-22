#!/bin/bash

set -e

if [ -z $UPSTREAM ]; then
    UPSTREAM=fgp
fi
VER=`cat package.json | grep version | sed "s/\s*\"version\"\s*:\s*\"\(.*\)\"\s*,/\1/"`

read -p "Using v$VER to tag $UPSTREAM/master, continue? [y/N] " RESP

if [[ $RESP != "y" && $RESP != "Y" ]]; then
    echo Cancelled
    exit 1
fi

git fetch $UPSTREAM
git co master
git reset --hard $UPSTREAM/master
git mff $UPSTREAM/develop
git push $UPSTREAM master
git tag v$VER
git push $UPSTREAM v$VER
