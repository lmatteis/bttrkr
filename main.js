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

function bencodeValue(v) {
	return (""+v).length + ":" + v;
}

function bdecodeValue(str) {
	var ret = {};
	var c = str.indexOf(":");
	var len = parseInt(str.substring(0, c));
	var value = str.substring(c+1,c+1+len);
	ret.len = c+len+1;
	ret.value = value;
	return ret;
}

function bdecodeList(str) {
	str = str.substring(1);
	var vals = [];
	while (str.indexOf("e") != 0) {
		if (str.indexOf("d") == 0) {
			var dv = bdecodeDict(str);
			str = str.substring(dv.len);
			vals.push(dv.value);
		} else {
			var v = bdecodeValue(str);
			str = str.substring(v.len);
			vals.push(v.value);
		}
	}
	return vals;
}

function bencodeDict(msg) {
	var bDict = "d";
	for(var k in msg) {
		bDict += bencodeValue(k);
		bDict += bencodeValue(msg[k]);
	}
	return bDict + "e";
}

function bdecodeDict(str) {
	var dv = {"value":{}, "len":2};

	str = str.substring(1);
	while (str.length) {
		if (str.indexOf("e") == 0)
			break;
		var v;
		v = bdecodeValue(str);
		str = str.substring(v.len);
		dv.len += v.len;
		var key = v.value;
		v = bdecodeValue(str);
		str = str.substring(v.len);
		dv.len += v.len;
		dv.value[key] = v.value;
	}

	return dv;
}

var handlers = { // arbitrarilyu needed outside of server....
	"/announce": function(query, res) {
		var info_hash = query.query.info_hash;
		if(!info_hash) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			var errorMsg = {"failure reason": "info hash needed"};
			res.write(bencodeDict(errorMsg));
		} else {
			var peer = findOrCreatePeer(query.query);
			var t = findOrCreateTorrent(query.query);
			t.peers.push(peer);
			// check if t has peer, if not add it
			var resp = {};
			resp["tracker id"] = peer.id;
			var peerList = "l";
			for (var idx in t.peers) {
				var p = t.peers[idx];
				// skip "itself"
				if (p.id === peer.id)
					continue;
				var p2 = {};
				p2["peer id"] = p.selfId;
				p2["ip"] = p.id;
				p2["port"] = p.port;
				peerList += bencodeDict(p2);
			}
			peerList += "e";
			resp["peers"] = peerList;
			res.write(bencodeDict(resp));
		}
	},
	"/scrape": function(query, res) {
		console.log("Scraping");
	}
};

exports.peers = peers;
exports.torrents = torrents;
exports.bencodeDict = bencodeDict;
exports.bdecodeDict = bdecodeDict;
exports.bdecodeList = bdecodeList;
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
