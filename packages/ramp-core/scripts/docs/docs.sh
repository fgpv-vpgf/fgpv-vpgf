#!/bin/bash

# Replace the {$REF_NAME} placeholder in docs/index.html with the branch/tag name
sed -i 's,{$REF_NAME},'"$REF_NAME"',' docs/index.html

npm run docs

if git ls-remote --heads --exit-code https://github.com/fgpv-vpgf/fgpv-vpgf.git gh-pages &> /dev/null; then
    echo "gh-pages exists - cloning ..."
    git clone --depth=50 --branch=gh-pages https://github.com/fgpv-vpgf/fgpv-vpgf.git ./gh-page-files

else
    echo "gh-pages does not exist!"
    mkdir gh-page-files
fi

# remove existing folder if present
if [ -d "gh-page-files/$REF_NAME" ]; then
    rm -rf "gh-page-files/$REF_NAME"
fi

# move generated docs into deployment folder
mv docs "gh-page-files/$REF_NAME"

# generate the index page with all the branches and tags
. scripts/docs/make_doc_index.sh gh-page-files > "gh-page-files/index.html"
touch gh-page-files/.nojekyll