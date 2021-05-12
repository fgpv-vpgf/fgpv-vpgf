#!/bin/bash

az login -u $AZ_LOGIN_NAME -p $AZ_PASSWORD --service-principal --tenant $AZ_TENANT > /dev/null 2>&1
DESTDIR="legacy"

# tags and branches from the upstream repo go into separate folders
if [ "$GITHUB_REPOSITORY" == "fgpv-vpgf/fgpv-vpgf" ]; then
    if [ "$IS_TAG" = true ]; then
        # tags and branches from the upstream repo go into separate folders
        DESTDIR="$DESTDIR/tags/$REF_NAME"
    else
        DESTDIR="$DESTDIR/branches/$REF_NAME"
    fi
else
    # builds from fork branches go into corresponding user folders
    DESTDIR="$DESTDIR/users/$GITHUB_ACTOR/$REF_NAME"
fi

echo "Destintation: $DESTDIR"

# delete the previous build if present
az storage blob delete-batch --source \$web --account-name $AZ_STORAGE_ACCOUNT --pattern "$DESTDIR/*" > /dev/null 2>&1
az storage blob upload-batch --account-name $AZ_STORAGE_ACCOUNT -d "\$web/$DESTDIR" -s "packages/ramp-core/build" > /dev/null 2>&1