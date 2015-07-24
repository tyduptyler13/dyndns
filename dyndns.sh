#!/bin/bash

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node dyndns.js | tee dyndns.log

