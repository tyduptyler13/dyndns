#!/bin/bash
cd #{SET THIS TO THIS DIRECTORY}
oldip=$(<oldip)
ip=$(node.io -s ip.js)
echo "$ip">ip
cp ip oldip

echo "(old:$oldip|current:$ip)"

if [ "$ip" == "$oldip" ] || [ -z "$oldip" ]
then
	echo "IP has not changed! Will not update"
	echo "Did not update ($ip)" >> update.log
else
	echo "IP address has changed ($ip). Updating..."
	node update.js $ip >> update.log
fi


