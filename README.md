dyndns
======

A dynamic dns updater for json api based dns servers like cloudflare

Notes
----
- The script is preset to cloudflare dyndns with two domains to update.
- This script is setup for retrieving IPV4. To use IPV6, you will need to
change values in ip.js and change the "A" in update.js to "AAAA".

Requirements
----
You will need [node.js](http://nodejs.org/) installed on your computer as well as npm.

Installation
----
1. Open the directory you wish to install this to. 
2. Copy the .js files as well as the .sh file.
3. Run the following `npm install request node.io; touch oldip`
4. (Optional) Uncomment the cd line and change the path to the full path of the directory you are in.
5. Edit the update.js directory. You may add or remove custom domains to update.
	* First you will need the domains and names of their A records.
	* Second is you need the id of those records. You can get that using cloudflares api.
	The easy way is to use this url with your credentials. `http://www.cloudflare.com/json_api.html?z={DOMAIN}&a=rec_load_all&email={EMAIL}&tkn={TOKEN}`
		- To get your token it is in the account tab in cloudflare.
	* Now add or remove any custom domains to the domains variable.
	* Make sure there aren't any TODO statements you missed. These are required settings.
6. Edit crontab to execute this script at any inteval you like. Keep in mind it will make requests to the url for IP info every time. Ex: "*/30 * * * * /home/usr/dyndns/update.sh" which means check every 30 mins.
	* To edit crontab run `sudo crontab -e`
7. Test the script once using the long path as crontab will be using the long path.


