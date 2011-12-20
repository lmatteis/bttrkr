var http = require("http");
var assert = require("assert");
var main = require("./main.js");

var host = "localhost";
var TEST_PORT = 3001;
var options = {
	host: host,
	port: TEST_PORT,
	method: 'GET'
};
function makeRequest(path, callback) {
	options.path = path;
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		var data = "";
		res.on("data", function(d) {
		  data += d;
		});
		res.on("end", function() {
			callback(data, res);
		});
	});
	req.end();
}
function params(args) {
	var str = "";
	var c = 1;
	for(var i in args) {
		if (c == 1)
			c = 0;
		else
			str += "&";
		str += i + "=" + args[i];
	}
	return str;
}
var tests = {
	params: function(){
		var args = { foo: "bar", "cock":"vagina"};	
		var query = params(args);
		var expected = "foo=bar&cock=vagina";
		assert.equal(query, expected, query + " should be " + expected);
		testFinished();
	},
	googleRequest: function() {
		testFinished();
  	},
	testBencodeDict: function() {
		var testData = {"tracker id":23};
		var expected = "d10:tracker id2:23e";
		assert.equal(expected, main.bencodeDict(testData));

		var testData = { "cow" : "moo", "spam" : "eggs" };
		var expected = "d3:cow3:moo4:spam4:eggse";
		assert.equal(expected, main.bencodeDict(testData));
		var errorMsg = {"failure reason": "info hash needed"};
		var expected = "d14:failure reason16:info hash needede";
		assert.equal(expected, main.bencodeDict(errorMsg));
		testFinished();
	},
	testBuncodeDict: function() {
		var testData = "d10:tracker id2:23e";
		var expected = {"tracker id":23};
		var result = main.bdecodeDict(testData);
		assert.deepEqual(expected, result.value);
		var testData = "d3:cow3:moo4:spam4:eggse";
		var expected = { "cow" : "moo", "spam" : "eggs" };
		result = main.bdecodeDict(testData);
		assert.deepEqual(expected, result.value);
		var errorMsg = "d14:failure reason16:info hash needede";
		var expected = {"failure reason": "info hash needed"};
		result = main.bdecodeDict(errorMsg);
		assert.deepEqual(expected, result.value);
		testFinished();
	},
	testBuncodeList: function() {
		var list = [{a:"apple",b:"butternut"}, {c:"candy",d:"drunk"}];
		var testData = "l" + main.bencodeDict(list[0]) +
			main.bencodeDict(list[1]) + "e";
		assert.deepEqual(list, main.bdecodeList(testData));
		testFinished();
	},
	testEmptyInfoHash: function() {
		makeRequest("/announce", function(data, res) {
			assert.equal(res.statusCode, 200);
			assert.equal(data, "d14:failure reason16:info hash needede");
			testFinished();
		});
	},
	testSuccessfulAnnounce: function() {
		var args = {
			info_hash: 23,
			peer_id: 12,
			port: 80,
			uploaded: 23,
			downloaded: 132,
			left:12,
			compact:32,
			no_peer_id: 3,
			event:23,
			ip:23,
			numwant:1,
			key:23,
			trackerid: "HELLO"
		};
		makeRequest("/announce?"+params(args), function(data, res){  
			assert.equal(res.statusCode, 200);
			assert.equal(args.ip, main.bdecodeDict(data).value["tracker id"]);
			assert.equal(args.ip, main.peers[args.ip].id);

			args.ip = 24;
			args.peer_id = 13;
			makeRequest("/announce?"+params(args), function(data, res) {
				//console.log(main.bdecodeDict(data).value);
				//console.log((main.bdecodeDict(data).value["peers"]));

				// check that we get the first peer in the list
				var peerList = main.bdecodeList(main.bdecodeDict(data).value["peers"]);
				assert.equal(23, peerList[0]["ip"]);
				testFinished();
			});
		});
   	},
	handlerThatDoesntExist: function() {
		makeRequest("/foo", function(data, res) {
			assert.equal(res.statusCode, 404, "should be 404 on nonexistent url");
			testFinished();
		});
	}
}

var server = http.createServer(main.server);

// keep track of test counts until all are complete
// before shutting down the server
var testCount = 0;
for (var i in tests) {
	testCount ++;
}
function testFinished() {
	testCount --;
	if (testCount == 0) {
		console.log("tests complete, closing server");
		server.close();
	}
};

server.listen(TEST_PORT, "localhost", function() {
	for(var i in tests) {
		tests[i]();
	}
});

