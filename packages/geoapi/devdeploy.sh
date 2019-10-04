SSHSRV="travis@fgpv.cloudapp.net"
DESTDIR="/home/travis/www/gapi"

if [ -n "$TRAVIS_TAG" -a "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/geoApi" -a "$TRAVIS_PULL_REQUEST" == "false" ]; then
    openssl aes-256-cbc -k "$PW" -out ~/.ssh/id_rsa -in devkey.enc -d
    echo -e "Host *\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
    chmod 600 ~/.ssh/id_rsa
    eval `ssh-agent -s`
    ssh-add ~/.ssh/id_rsa
    ls
    ls dist
    scp dist/geoapi*.tgz "$SSHSRV:$DESTDIR"
fi
