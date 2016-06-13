#!/bin/bash

set -e

if [ "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/fgpv-vpgf" ] && [ -n "$TRAVIS_TAG" ]; then
    gulp dgeni
    # this section assumes the id_rsa key has already been decrypted
    # devdeploy.sh should run before this script
    echo -e "Host *\n\tStrictHostKeyChecking no\n" > ~/.ssh/config
    eval `ssh-agent -s`
    ssh-add ~/.ssh/id_rsa
    git clone --depth=1 git@github.com:fgpv-vpgf/fgpv-vpgf.github.io.git ghdocs
    mkdir -p ghdocs/fgpv/$TRAVIS_TAG
    rsync -av --delete dist/docs/app/ ghdocs/fgpv/$TRAVIS_TAG/
    cd ghdocs
    git add fgpv/$TRAVIS_TAG
    git config user.email "glitch.chatbot@gmail.com"
    git config user.name "Glitch Bot"
    git commit -m "Docs for fgpv@$TRAVIS_TAG"
    git push
    cd ..
    rm -rf ghdocs
fi
