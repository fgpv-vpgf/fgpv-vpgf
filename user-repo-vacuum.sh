#!/bin/sh
SSHSRV="barry@fgpv.cloudapp.net"
DESTDIR="../travis/www/users/barryytm/test/test.sh"

ssh "$SSHSRV" "$DESTDIR"
echo "End of the file"