#!/bin/bash

if ((${mProc} == "dev")) && ((${TRAVIS_BRANCH} == "develop" || ${TRAVIS_BRANCH} == "master" || ${TRAVIS_BRANCH:0:1} == "v")); then
    npm run docs
    mv ./docs "./$TRAVIS_BRANCH"
    rsync -e 'ssh -i /tmp/docs_rsa' -r --delete-after --quiet "./$TRAVIS_BRANCH" "milesap@fgpv.org:/disk/static/docs/$TRAVIS_REPO_SLUG"
    rm -rf ./docs/developer/jsDocs
    rm -rf ./docs/api/developer
fi
