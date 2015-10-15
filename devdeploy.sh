DEST="travis@fgpv.cloudapp.net:/home/travis/www"

if [ "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/fgpv-vpgf" -a "$TRAVIS_PULL_REQUEST" == "false" ]; then
    openssl aes-256-cbc -k "$PW" -out ~/.ssh/id_rsa -in devkey.enc -d
    echo -e "Host *\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
    chmod 600 ~/.ssh/id_rsa
    eval `ssh-agent -s`
    ssh-add ~/.ssh/id_rsa

    if [ -n $TRAVIS_TAG ]; then
        DEST="$DEST/$TRAVIS_TAG/"
    else
        DEST="$DEST/$TRAVIS_BRANCH/"
    fi

    rsync -av --delete "build/" "$DEST"
fi
