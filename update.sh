#!/bin/sh

OLDDIR=$(pwd)
cd $(dirname $0)

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

npm start

cd $OLDDIR

