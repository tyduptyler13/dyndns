#!/bin/bash
# uncoment the following and change it to a directory of your choice
# should you want it to save settings to a specific place. Otherwise
# it will save in the location you run this script from.
#cd /some/directory
oldip=$(<oldip)
node.io -s ip.js > ip
ip=$(<ip)
cp ip oldip

echo "(old:$oldip|current:$ip)"

if [  $ip==$oldip ]
then
	echo "IP has not changed! Will not update"
	echo "Did not update (Not needed)" >> update.log
else
	echo "IP address has changed. Updating..."
	node update.js $ip >> update.log
fi


