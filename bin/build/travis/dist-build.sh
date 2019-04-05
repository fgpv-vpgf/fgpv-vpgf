#!/bin/bash

echo "$TRAVIS_BRANCH and ${TRAVIS_BRANCH:0:1}"

if [ "$TRAVIS_BRANCH" == "develop" ] || "$TRAVIS_BRANCH" == "master" || [ ${TRAVIS_BRANCH:0:1} == "v" ]; then
    echo "Building distribution for latest push to develop or tag."
    npm run build

    # Copy build files into a "plugins" folder which is included with npm publish
    mkdir plugins
    for file in {dist/**/*.js,dist/**/*.css}; do cp "$file" plugins/$(basename "${file}");done

    mv ./dist "./$TRAVIS_BRANCH"
    rsync -e 'ssh -i /tmp/cloud_rsa' -r --delete-after --quiet "./$TRAVIS_BRANCH" "milesap@fgpv.org:/disk/static/builds/$TRAVIS_REPO_SLUG"
    rm -rf "./$TRAVIS_BRANCH"

    mv ./docs "./$TRAVIS_BRANCH"
    rsync -e 'ssh -i /tmp/cloud_rsa' -r --delete-after --quiet "./$TRAVIS_BRANCH" "milesap@fgpv.org:/disk/static/docs/$TRAVIS_REPO_SLUG"
fi