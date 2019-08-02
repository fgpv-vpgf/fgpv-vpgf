#!/bin/bash

npm run docs

if git ls-remote --heads --exit-code https://github.com/fgpv-vpgf/fgpv-vpgf.git gh-pages &> /dev/null; then
    echo "gh-pages exists - cloning ..."
    git clone --depth=50 --branch=gh-pages https://github.com/fgpv-vpgf/fgpv-vpgf.git ./gh-page-files

else
    echo "gh-pages does not exist!"
    mkdir gh-page-files
fi

# remove existing folder if present
if [ -d "gh-page-files/$TRAVIS_BRANCH" ]; then
    rm -rf "gh-page-files/$TRAVIS_BRANCH"
fi

# move generated docs into deployment folder
mv docs "gh-page-files/$TRAVIS_BRANCH"

# generate the index page with all the branches and tags
. scripts/travis/make_doc_index.sh gh-page-files > "gh-page-files/index.html"
touch gh-page-files/.nojekyll