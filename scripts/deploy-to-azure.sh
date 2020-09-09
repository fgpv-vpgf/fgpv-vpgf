#!/bin/bash

# login into Azure as a service-principal using encrypted credentials
# following repos are allowed:
# fgpv-vpgf/fgpv-vpgf
# aleksueir/fgpv-vpgf
# alyec/fgpv-vpgf
# an-w/fgpv-vpgf
# avocadoes/fgpv-vpgf
# dane-thomas/fgpv-vpgf
# JahidAhmed/fgpv-vpgf
# james-rae/fgpv-vpgf
# milesap/fgpv-vpgf
# RyanCoulsonCA/fgpv-vpgf
# ShrutiVellanki/fgpv-vpgf
# spencerwahl/fgpv-vpgf
# yileifeng/fgpv-vpgf
az login -u $AZ_LOGIN_NAME -p $AZ_PASSWORD --service-principal --tenant $AZ_TENANT > /dev/null 2>&1

DESTDIR="demo"

if [ "$TRAVIS_REPO_SLUG" == "fgpv-vpgf/fgpv-vpgf" ]; then

    if [ -n "$TRAVIS_TAG" ]; then
        # tags and branches from the upstream repo go into separate folders
        DESTDIR="$DESTDIR/tags/$TRAVIS_TAG"
    else
        DESTDIR="$DESTDIR/branches/$TRAVIS_BRANCH"
    fi

else
    # builds from fork branches go into corresponding user folders
    USER=${TRAVIS_REPO_SLUG/\/fgpv-vpgf/}
    DESTDIR="$DESTDIR/users/$USER/$TRAVIS_BRANCH"
fi

echo "Destintation: $DESTDIR"

# delete the previous build if present
az storage blob delete-batch --account-name $AZ_STORAGE_ACCOUNT -s \$web --pattern "$DESTDIR\*" > /dev/null 2>&1

az storage blob upload-batch --account-name $AZ_STORAGE_ACCOUNT -d "\$web/$DESTDIR/dist" -s "packages/ramp-core/build" > /dev/null 2>&1

#if [ "$mProc" == "prod" ]; then
#    az storage blob upload-batch --account-name $AZ_STORAGE_ACCOUNT -d "\$web/$DESTDIR/prod" -s "build"
#    az storage blob upload-batch --account-name $AZ_STORAGE_ACCOUNT -d "\$web/$DESTDIR/dist" -s "dist"
#else
#    az storage blob upload-batch --account-name $AZ_STORAGE_ACCOUNT -d "\$web/$DESTDIR/dev" -s "build"
#fi