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
			testFinished();
		});
   	},
	handlerThatDoesntExist: function() {
		makeRequest("/foo", function(data, res) {
			assert.equal(res.statusCode, 404, "should be 404 on nonexistent url");
			testFinished();
		});
	},
	testBencodeDict: function() {
		var testData = { "cow" : "moo", "spam" : "eggs" };
		var expected = "d3:cow3:moo4:spam4:eggse";
		assert.equal(expected, main.bencodeDict(testData));
		var errorMsg = {"failure reason": "info hash needed"};
		var expected = "d14:failure reason16:info hash needede";
		assert.equal(expected, main.bencodeDict(errorMsg));
		testFinished();
	},
	testEmptyInfoHash: function() {
		makeRequest("/announce", function(data, res) {
			assert.equal(res.statusCode, 200);
			assert.equal(data, "d14:failure reason16:info hash needede");
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

