#!/bin/bash

if [ "$mProc" == "dev" ]; then
    npm run docs
    mv ./docs "./$TRAVIS_TAG"
    rsync -e 'ssh -i /tmp/docs_rsa' -r --delete-after --quiet "./$TRAVIS_TAG" miles_petrov@fgpv.eastus.cloudapp.azure.com:/home/miles_petrov/www/ramp_docs
    rm -rf ./docs/developer/jsDocs
    rm -rf ./docs/api/developer
fi
