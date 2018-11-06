#!/bin/bash

npm run update
npm run build

if [ "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/plugins" ]; then
    openssl aes-256-cbc -K $encrypted_cda026e527b5_key -iv $encrypted_cda026e527b5_iv -in bin/build/cloud_rsa.enc -out /tmp/cloud_rsa -d
    chmod 600 /tmp/cloud_rsa
else
    bash bin/build/travis/ghpages-build.sh
fi