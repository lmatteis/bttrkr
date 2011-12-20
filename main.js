var bcode = require("./bcode.js");
var http = require('http');
var url = require("url");

// List of torrents:
// by: infohash
// contains:
//    - list of peers
// i.e. {"infohash":"289103089312089231089",
//       peers:[{"ip":"123.123.123.123", "w/e-else":"x"}]
var torrents = [];

var peers = {};

function findOrCreatePeer(query) {
	if (peers[query.ip])
		return peers[query.ip];
	var peer = {};
	peer.id = query.ip;
	peer.port = query.port;
	peer.selfId = query.peer_id;
	peers[peer.id] = peer;
	return peer;
}

function findOrCreateTorrent(query) {
	var findT = getTorrent(query.info_hash);
	if (findT)
		return findT;
	var t = {};
	t.infoHash = query.info_hash;
	t.peers = [];
	torrents.push(t);
	return t;
}

function getTorrent(infoHash) {
	var findT = false;
	torrents.forEach(function(t, idx) {
		if ((""+infoHash) === t.infoHash) {
			findT = t;
			return;
		}
	});
	return findT;
}

var handlers = { // arbitrarilyu needed outside of server....
	"/announce": function(query, res) {
		var info_hash = query.query.info_hash;
		if(!info_hash) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			var errorMsg = {"failure reason": "info hash needed"};
			res.write(bcode.bencodeDict(errorMsg));
		} else {
			var peer = findOrCreatePeer(query.query);
			var t = findOrCreateTorrent(query.query);

			// TODO check if t has peer, if not add it
			t.peers.push(peer);

			var resp = {};
			resp["tracker id"] = peer.id;

			// create "peers" field in response
			var peerList = "l";
			for (var idx in t.peers) {
				var p = t.peers[idx];
				// skip  "itself"
				if (p.id === peer.id)
					continue;
				var p2 = {};
				p2["peer id"] = p.selfId;
				p2["ip"] = p.id;
				p2["port"] = p.port;
				peerList += bcode.bencodeDict(p2);
			}
			peerList += "e";
			resp["peers"] = peerList;

			res.write(bcode.bencodeDict(resp));
		}
	},
	"/scrape": function(query, res) {
		console.log("Scraping");
	}
};

exports.peers = peers;
exports.torrents = torrents;
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
