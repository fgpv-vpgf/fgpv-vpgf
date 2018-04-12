#!/bin/sh

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis"
}

pr() {
    echo "PR routine started"
}

tag() {
    echo "Tag routine started"
    dist ${TRAVIS_TAG}
}

push() {
    echo "Push routine started"
    dist ${TRAVIS_BRANCH}
}

dist() {
    git checkout ${1}
    npm run build
    git add --all
    git commit -am "TRAVIS-CI(dist): added distribution files"
    git push --quiet
}

setup_git

if [ "$TRAVIS_EVENT_TYPE" == "push" ]; then
    push
elif [ "$TRAVIS_EVENT_TYPE" == "pull_request" ]; then
    pr
else
    tag
fi