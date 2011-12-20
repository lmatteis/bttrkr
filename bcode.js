// b-code

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

exports.bencodeValue = bencodeValue;
exports.bdecodeValue = bdecodeValue;
exports.bencodeDict = bencodeDict;
exports.bdecodeDict = bdecodeDict;
exports.bdecodeList = bdecodeList;
