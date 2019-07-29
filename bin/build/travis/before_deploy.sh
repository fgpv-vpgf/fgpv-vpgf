#!/bin/bash

if [ "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/plugins" ]; then
    bash bin/build/travis/dist-build.sh
else
    bash bin/build/travis/ghpages-build.sh
fi