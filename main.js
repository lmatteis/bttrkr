var http = require('http');
var url = require("url");
exports.handlers = { // arbitrarilyu needed outside of server....
	"/announce": function(query, res) {
		console.log("This is an announcement");
	},
	"/scrape": function(query, res) {
		console.log("Scraping");
	}
};
exports.server = function (req, res) {
	var query = url.parse(req.url, true);
	res.writeHead(200, {'Content-Type': 'text/plain'});
	var hnd = exports.handlers[query.pathname];
	if (hnd) {
		hnd(query, res);
	} else {
		res.writeHead(404);
	}
	res.end('Hello World\n');
};

if (process.argv[1].indexOf("main.js") != -1 &&
		process.argv.length > 2 &&
		process.argv[2] === "runServer") {
	http.createServer(exports.server).listen(3000, "localhost");
	console.log('Server running');
}
