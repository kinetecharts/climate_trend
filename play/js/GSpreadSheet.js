"use strict";

/*
This module is for reading a Google Docs spreadsheet.  Currently it is somewhat specialized
for the ClimateMusicProject spreadsheet for an upcoming performance.  It should be refactored
so the generic things stay in the GSS.SpreadSheet, and specific things are in another class.
*/
var GSS = {};

GSS.SSURL = "https://spreadsheets.google.com/feeds/list/1Vj4wbW0-VlVV4sG4MzqvDvhc-V7rTNI7ZbfNZKEFU1c/default/public/values?alt=json";


function getFloat(f, defval)
{
    if (typeof f == "number")
	return f;
    if (typeof f == "string") {
	try {
	    return JSON.parse(f);
	}
	catch (e) {
	    //report("err parsing float for str: "+f);
	}
    }
    return defval;
}

function timeToYear(t)
{
    var t1 = 10*60;
    var y1 = 1800;
    var t2 = 30*60;
    var y2 = 2300;
    if (t < t1) {
	return null;
    }
    if (t < t2) {
	var f = (t-t1)/(t2-t1);
	var y = y1 + f*(y2-y1);
	return y;
    }
    return null;
}


GSS.SpreadSheet = function()
{
    report("**** GSS.SpreadSheet() ****");
    this.data = null;
    this.load();
}

GSS.SpreadSheet.getJSON = function(url, handler)
{
    report(">>>>> getJSON: "+url);
    $.ajax({
        url: url,
	dataType: 'text',
	success: function(str) {
		var data = JSON.parse(str);
		handler(data);
	    }
	});
}

GSS.SpreadSheet.prototype.load = function()
{
    var inst = this;
    report("GSS.SpreadSheet.load "+SSURL);
    //GSS.SpreadSheet.getJSON(SSURL, function(data) {
    $.getJSON(SSURL, function(data) {
        //report("GOT JSON: "+data);
	inst.handleData(data);
	//inst.dump();
    }).fail(function() {
	report("************ SpreadSheet error ***************");
    });
}

GSS.SpreadSheet.prototype.handleData = function(data)
{
    this.data = data;
    var entries = data.feed.entry;
    var rows = [];
    for (var i=0; i<entries.length; i++) {
        var e = entries[i];
	//report("e "+i+" "+JSON.stringify(e));
	var row = {};
        for (var key in e) {
	    if (!key.startsWith("gsx$")) {
		continue;
	    }
	    var id = key.slice(4);
	    //report("key: "+key+" "+" "+id+" "+e[key]);
	    var val = e[key]["$t"];
	    if (val == "\"")
                val = rows[i-1][id];
	    row[id] = val;
	}
	var ys = row["years"];
	if (ys) {
	    ys = ys.replace("approx","");
	    var parts = ys.split("-").map(function(s) { return s.trim(); });
	    //report("parts: "+parts);
	    var years = parts.map(JSON.parse);
	    row["year"] = years[0];
	}
	else {
	    row["year"]=null;
	}
	rows.push(row);
    }
    this.rows = rows;
}

GSS.SpreadSheet.prototype.dump = function()
{
    report("GSS.SpreadSheet.dump");
    var rows = this.rows;
    for (var i=0; i<rows.length; i++) {
	report("row "+i);
	var row = rows[i];
	for (var id in row) {
	    var val = row[id];
	    report(" "+id+" "+val);
	}
    }
}

GSS.SpreadSheet.prototype.getFieldByYear = function(y, field)
{
//    report("GSS.SpreadSheet.getFieldByYear "+y+" "+field);
    if (!y)
	return null;
    var str = "";
    var rows = this.rows;
    for (var i=0; i<rows.length; i++) {
	var row = rows[i];
	//report("gfby i: "+i+" y: "+y+"  row.year: "+row.year);
	if ( row.year && y > row.year) {
	    str = row[field];
	}
    }
    return str;
}

/*
// moved to CMPVR

function getVideoOpacity(t)
{
    var y = timeToYear(t);
    var va = getFieldByYear(y, "videofade");
    va = getFloat(va, 1.0);
    return va;
}

function getNarrative(t)
{
    var y = timeToYear(t);
    return getFieldByYear(y, "narrative");
}
*/


