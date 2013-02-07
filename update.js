#!/usr/bin/env node

if (process.argv.length<3){
	console.warn("Missing ip! Use: node update.js {ip}");
	process.exit(1);
}

var request = require('request');
var ip=process.argv[2];

//Domain independend settings.
var args = {
	a : "rec_edit",
	type : "A",//IPV4 Only. You will need to change the url in ip.js for IPV6
	content : ip,
	ttl : 1,
	service_mode : 1,
	tkn : "NEED TO FILL THIS IN",//TODO
	email : "NEED TO FILL THIS IN"//TODO
};
//MyUPlay Specific settings.
var d1 = {
	z : "DOMAIN 1",//TODO
	id : 1,//TODO
	name : "DOMAIN 1"//TODO
};
//hgtti specific settings.
var d2 = {
	z : "DOMAIN 2",//TODO
	id : 1,//TODO
	name : "DOMAIN 2"//TODO
};

/*
 * Add any custom domain settings to the setup above.
*/
domains = [d1,d2];

//Add domain independent data.
domains.forEach(function(domain){
	for (arg in args){
		domain[arg]=args[arg];
	}
});

//Request options.
var options = {
	url : "https://www.cloudflare.com/api_json.html",
	timeout : 5000,
	strictSSL : true
};

var qs = new Array(2);

for (var x=0;x<domains.length;++x){
	qs[x] = clone(options);
	qs[x]["qs"] = domains[x];
}

qs.forEach(function(domain){
	request(domain, function(err, res, body){
		if (err){
			console.warn(err);
			return;
		}
		if (res.statusCode == 200){
			var responce = JSON.parse(body);
			if (responce['result']=="success"){
				console.log("Operation was a success for "+domain.qs.z+".");
			} else {
				console.warn("Something went wrong!");
			}
		}
	});
});

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

