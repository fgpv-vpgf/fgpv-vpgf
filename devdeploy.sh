DEST="travis@fgpv.cloudapp.net:/home/travis/www"

if [ -n $TRAVIS_TAG ]; then
    DEST="$DEST/$TRAVIS_TAG/"
else
    DEST="$DEST/$TRAVIS_BRANCH/"
fi

rsync -a --delete "build/" "$DEST"
