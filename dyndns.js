var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var os = require('os');

/**
 * This will call the callback when completed.
 *
 * Note that this function will return before setup is complete.
 */
function DynDNS(callback){
	this.cache = {};
	this.settings = {};
	this.ips = {};
	this.ipv4Domains = [];
    this.ipv6Domains = [];

	if (!fs.existsSync('settings.json')){
		console.warn("You are missing your settings.json file. You need to copy the example and configure it.");
		throw "Misconfigured";
	}

    var scope = this;

    //Wait for both calls to complete.
    async.parallel([function(callback){
        fs.readFile('settings.json', 'utf8', function(err, data){

            if (err){
                callback(err, "Failed.");
            } else {

                scope.settings = JSON.parse(data);

                
                async.each(scope.settings.domains, function(domain, callback){
                    if (domain.content.indexOf("{ipv4}")!=-1)
                        scope.ipv4Domains.push(domain);
                    if (domain.content.indexOf("{ipv6}")!=-1)
                        scope.ipv6Domains.push(domain);
                    if (domain.id == "?"){
                        scope.getId(domain, callback);
                        return;
                    }
                    callback();
                }, function(err){
                    if (err) {
                        console.error("An error occured:", err);
                        callback(err);
                    } else {
                        callback();
                    }
                });

            }

        });
    }, function(callback){
        fs.readFile('ips.json', 'utf8', function(err, data){

            if (err){
                scope.ips = {ipv4:"", ipv6:""};
            } else {
                scope.ips = JSON.parse(data);
            }

            callback(); 

        });
    }],
    function(err, results){
        if (!err){
            console.log("Finished setting up.");
        } else {
            console.error(err);
            throw err;
        }
        try {
            callback();
        }catch(e){}
    });

};
DynDNS.prototype.save = function(domain){

	try{
		this.cache[domain.name.replace('.','_')].response.recs.objs.forEach(function(record){
			if (record.name == domain.name && record.type == domain.type){
				domain.id = record.rec_id;
			}
		});


		fs.writeFile("settings.json", JSON.stringify(this.settings, null, "\t"), function(err){
			if (err){
				console.warn(err);
			} else {
				console.log("Updated settings with domain id for " + domain.name + ".");
			}
		});
	} catch (e) {
		console.log("Failed to access the cache. Something has gone wrong, try again.", e);
		throw "Failure.";
	}

};
DynDNS.prototype.getId = function(domain, callback) {

	var settings = this.settings;
    var scope = this;

	if (this.cache[domain.name.replace('.','_')]==undefined){
		request({
			url: settings.global.url,
			timeout: settings.global.timeout,
			strictSSL: settings.global.strictSSL,
			qs: {
				email : settings.global.includes.email,
				tkn : settings.global.includes.tkn,
				z : domain.z,
				a : "rec_load_all"
			}
		}, function(err, response, body){
			if (err){
				console.warn("Could not get id for domain!", err);
			} else {
				var response = JSON.parse(body);
				if (response.msg != null){
					console.log("Failed to get id: ", response.msg);
				} else {
					scope.cache[domain.name.replace('.','_')] = response;
					scope.save(domain);
                    console.log("Filled in id for domain: " + domain.name);
				}
			}
            callback();
		});
	} else {
		this.save(domain);
	}
};
DynDNS.prototype.saveip = function(type, ip){
    this.ips[type] = ip;
	fs.writeFile('ips.json', JSON.stringify(this.ips), function(err){
		if (err){
			console.warn("Failed to save ips.", err);
		} else {
			console.log("Saved ips to ips.json");
		}
	});
};
DynDNS.prototype.run = function(){

    var scope = this;

	if (this.settings.global.checkipv4===true){
		console.log("Getting your IP address.");
        this.getIpv4(function(ip){
			console.log("Your ip is: " + ip); 
            if (scope.ips.ipv4 != ip){
				console.log("Ipv4 changed!");
				scope.update(scope.ipv4Domains, 'ipv4', ip);
			} else {
                console.log("Your ip has not changed, nothing to be done.");
            }
		});
	} else {
		console.log("Skipping ipv4 check.");
	}

    if (this.settings.global.checkipv6===true){
        console.log("Getting ipv6 address.");
        var ipv6 = DynDNS.getIpv6(this.settings.global.netInt);
        console.log("Your ipv6 is: " + ipv6);
        if (this.ips.ipv6 != ipv6){
            console.log("Ipv6 changed!");
            this.update(this.ipv6Domains, 'ipv6', ipv6);
        } else {
            console.log("Your ipv6 has not changed, nothing to be done.");
        }
    } else {
        console.log("Skipping ipv6 check.");
    }

};
DynDNS.prototype.update = function(list, rep, ip){
	var qss = [];
	var settings = this.settings;
    var scope = this;

    console.log("Updating:", list);

	async.each(list, function(i, callback){
		var copy = clone(i);
		copy.content = copy.content.replace('{'+rep+'}', ip);

		for (var attr in settings.global.includes){
			copy[attr] = settings.global.includes[attr];
		}

		qss.push(copy);

        callback();

	}, function(err){

        if (err){
            throw err;
        }

        async.each(qss, function(qs, callback){

            var req = {
                    url: settings.global.url,
                    qs: qs,
                    timeout: settings.global.timeout,
                    strictSSL: settings.global.strictSSL
            };

            request(req, function(err, res, body){
                if (err){
                    console.warn(err);
                    return;
                }
                if (res.statusCode == 200){
                    var res = JSON.parse(body);
                    if (res['result']=="success"){
                        console.log("Operation was a success for " + qs.z + ".");
                        callback();
                    } else {
                        console.warn("Something went wrong! Try again.");
                        callback(res['msg']);
                    }
                }
            });
        }, function(err){ // This will be reached if everything was successful.
            
            if (err){
                console.error(err);
                throw err;
            }
            
            console.log("Everything was a success!");
            scope.saveip(rep, ip);
        });

    });

};
DynDNS.getIp = function(url, query, callback){

	request(url, function(err, resp, body){

		if (err){
			console.warn("Failed to get ip.", resp);
			return;
		}

		var $ = cheerio.load(body);

		callback($(query).text());

	});

};
DynDNS.prototype.getIpv4 = function(callback){
	DynDNS.getIp(this.settings.global.ipv4Site, this.settings.global.ipv4Query, callback);
}
DynDNS.getIpv6 = function(name){

    var ips = os.networkInterfaces()[name];

    for (var i=0; i < ips.length; ++i){
        if (ips[i].family == 'IPv6'){
            return ips[i].address; //Return first result. Usually the right one.
        }
    }

    console.warn("You do not have an ipv6 address!");

    return null;

}

/**
 * Deep clone function.
 * @param obj
 * @returns A deep copy of the orginal object.
 */
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


(function(){
	if (require.main === module){
		console.log("Creating DynDNS instance.");
        var dyn = new DynDNS(function(){
           console.log("Executing DynDNS");
           dyn.run();
        });
	} else {
		exports = DynDNS;
	}
})();

