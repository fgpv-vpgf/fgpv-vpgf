#!/bin/bash

echo "$TRAVIS_BRANCH and ${TRAVIS_BRANCH:0:1}"

if [ "$TRAVIS_BRANCH" == "develop" ] || [ ${TRAVIS_BRANCH:0:1} == "v" ]; then
    echo "Building distribution for latest push to develop or tag."
    mv ./dist "./$TRAVIS_BRANCH"
    rsync -e 'ssh -i /tmp/cloud_rsa' -r --delete-after --quiet "./$TRAVIS_BRANCH" milesap@fgpv-vpgf.com:/home/milesap/rootwww/plugins/files
fi