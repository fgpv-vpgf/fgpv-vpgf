#!/bin/bash

if git ls-remote --heads --exit-code https://github.com/$TRAVIS_REPO_SLUG.git gh-pages &> /dev/null; then
    echo "gh-pages exists - cloning ..."
    git clone --depth=50 --branch=gh-pages https://github.com/$TRAVIS_REPO_SLUG.git ./page_files

else
    echo "gh-pages does not exist!"
fi

mkdir -p page_files/$TRAVIS_COMMIT
npm run build
# Replace all /rv-main.js and /rv-styles.css with: /plugins/rv-main.js|rv-styles.css
find . -path ./node_modules -prune -o -name '*.html' | while read line; do
    sed -i -e "s+/rv-main.js+/plugins/$TRAVIS_COMMIT/rv-main.js+g" "$line"
    sed -i -e "s+/rv-styles.css+/plugins/$TRAVIS_COMMIT/rv-styles.css+g" "$line"
done
mv dist/* page_files/$TRAVIS_COMMIT
echo "" > page_files/index.html