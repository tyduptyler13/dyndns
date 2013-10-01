var nodeio = require('node.io');

var ip = {
	input: false,
	run  : function() {
		this.getHtml("http://www.whatismyip.com/" , function(err, $){
			if (err) this.exit(err);

			this.emit($('.ip').fulltext);
		});
	}
}

exports.job = new nodeio.Job({timeout:10}, ip);

