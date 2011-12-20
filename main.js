var http = require('http');
var url = require("url");

// List of torrents:
// by: infohash
// contains:
//    - list of peers
// i.e. {"infohash":"289103089312089231089",
//       peers:[{"ip":"123.123.123.123", "w/e-else":"x"}]
var torrents = [];

function addTorrent(tToAdd) {
	// search through torrents to see if tToAdd exists
	torrents.forEach(function(t, idx) {
		if(tToAdd.infohash === t.infohash) {
			// update T if necessary
			// // TODO make sure t.peers doesnt contian uplicated peer ips
			t.peers.push(tToAdd.peers[0]);
		} else {
			torrents.push(tToAdd);
		}
	});
}

function getTorrent(infoHash) {
	torrents.forEach(function(t, idx) {
		if (infoHash === t.infohash) {
			return t;
		}
	});
	return false;
}

function bencodeDict(msg) {
	var bDict = "d";
	for(var k in msg) {
		bDict += k.length + ":" + k;
		bDict += msg[k].length + ":" + msg[k];
	}
	return bDict + "e";
}
exports.bencodeDict = bencodeDict;

var handlers = { // arbitrarilyu needed outside of server....
	"/announce": function(query, res) {
		var info_hash = query.query.info_hash;
		if(!info_hash) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			var errorMsg = {"failure reason": "info hash needed"};
			res.write(bencodeDict(errorMsg));
		} else {
		}
	},
	"/scrape": function(query, res) {
		console.log("Scraping");
	}
};
exports.server = function (req, res) {
	var query = url.parse(req.url, true);
	var hnd = handlers[query.pathname];
	if (hnd) {
		hnd(query, res);
		res.end();
	} else {
		res.writeHead(404);
		res.end('go fuck yourself\n');
	}
};

if (process.argv[1].indexOf("main.js") != -1 &&
		process.argv.length > 2 &&
		process.argv[2] === "runServer") {
	http.createServer(exports.server).listen(3000, "localhost");
	console.log('Server running');
}
