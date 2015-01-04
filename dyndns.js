var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');

var DynDNS = function(){
	this.cache = {};
	this.settings = {};
	this.ips = {};
}
DynDNS.init = function() {
	fs.readFile('settings.json', 'utf8', function(err, data){

		if (err){
			console.log(err);
		} else {

			settings = JSON.parse(data);

			settings.domains.forEach(function(domain){
				if (domain.id == "?")
					getId(domain);
				if (domain.content.indexOf("{ipv4}")!=-1)
					ipv4Domains.push(domain);
			});

			fs.readFile('ips.json', 'utf8', function(err, data){

				if (err){
					ips = {ipv4:""};
				} else {
					ips = JSON.parse(data);
				}

				run();

			});
		}

	});
}

function getId(domain){
	var save = function(){

		try{
			cache[domain.name.replace('.','_')].response.recs.objs.forEach(function(record){
				if (record.name == domain.name && record.type == domain.type){
					domain.id = record.rec_id;
				}
			});


			fs.writeFile("settings.json", JSON.stringify(settings, null, "\t"), function(err){
				if (err){
					console.warn(err);
				} else {
					console.log("Updated settings with domain id for " + domain.name + ".");
				}
			});
		} catch (e) {
			console.log("Failed to access the cache. It is likely that a previous request failed. Cache does not persist between runs so it will reset.");
		}
	};

	if (cache[domain.name.replace('.','_')]==undefined){
		request({
			url: settings.global.url,
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
				if (response.err){
					console.log("Failed to get id: ", response.msg);
					return;
				} else {
					cache[domain.name.replace('.','_')] = response;
					save();
				}
			}
		});
	} else {
		save();
	}
}

function saveips(){
	fs.writeFile('ips.json', JSON.stringify(ips), function(err){
		if (err){
			console.warn("Failed to save ips.", err);
		} else {
			console.log("Saved ips to ips.json");
		}
	});
}

function run(){

	try{

		if (settings.global.checkipv4!==false){
			getIpv4(function(ip){
				if (ips.ipv4 != ip){
					ips.ipv4 = ip;
					console.log("Ipv4 changed!", ip);
					update(ipv4Domains);
				}
			});
		} else {
			console.log("Skipping ipv4 check.");
		}

	} catch (e) {
		console.warn("Something has gone wrong in the main loop! ", e);
	}

}

function update(list){
	saveips(); //Save for next run.

	var qss = [];

	list.forEach(function(i){
		var copy = clone(i);
		copy.content = copy.content.replace('{ipv4}', ips.ipv4);

		for (var attr in settings.global.includes){
			copy[attr] = settings.global.includes[attr];
		}

		qss.push(copy);
	});

	qss.forEach(function(qs){

		var req = {
				url: settings.global.url,
				qs: qs,
				timeout: global.timeout,
				strictSSL: global.strictSSL
		};

		request(req, function(err, res, body){
			if (err){
				console.warn(err);
				return;
			}
			if (res.statusCode == 200){
				var responce = JSON.parse(body);
				if (responce['result']=="success"){
					console.log("Operation was a success for " + qs.z + ".");
				} else {
					console.warn("Something went wrong!");
				}
			}
		});
	});
}

function getIp(url, query, callback){

	request(url, function(err, resp, body){

		if (err){
			console.warn("Failed to get ip.", resp);
			return;
		}

		var $ = cheerio.load(body);

		callback($(query).text());

	});

}

function getIpv4(callback){
	getIp(settings.global.ipv4Site, settings.global.ipv4Query, callback);
}

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

init();

