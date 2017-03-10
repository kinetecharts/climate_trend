/*
This module is for sending view information, and getting view
information from other clients.

It currently uses socketio to talk to a WorldViews server,
but future versions might use the WebRTC data channel.
*/
function report(str)
{
  console.log(str);
}

var VS = {};
VS.heartbeatTime = 1.0;

VS.getClockTime = function()
{
    return new Date() / 1000.0;
}

//VS.setup = function(url, handler)
ViewStat = function(pano, url, handler)
{
    this.sioUrl = "http://platonia";
    this.sock = null;
    this.msgNum = 0;
    this.userId = null;
    this.name = "joe";
    this.prevPitch = null;
    this.prevYaw = null;
    this.prevFOV = null;
    this.origin = [37.38, -122.18];
    this.curPos = [37.8, -122.0];
    this.handlers = [];
    this.pano = pano;
    this.lastSendTime = 0;
    if (url)
	this.sioUrl = url;
    if (handler)
	this.addStatusHandler(handler);
    report("ViewStat "+this.sioUrl);
    this.userId = "user"+Math.floor(1000000*Math.random());
    report("getting socket to "+this.sioUrl);
    this.sock = io(this.sioUrl);
    report("got sock = "+this.sock);
    if (this.sock == null) {
	report("*** failed to get socket ***");
	return;
    }
    //this.sock.on('viewInfo', this.watchViewInfo);
    var inst = this;
    this.sock.on('people', function(msg) { inst.watchViewInfo(msg); });
}

ViewStat.prototype.addStatusHandler = function(handler)
{
    this.handlers.push(handler);
}

ViewStat.prototype.removeStatusHandler = function(handler)
{
    var index = this.handlers.indexOf(handler);
    if (index >= 0)
	this.handlers.splice(index,1);
    else
	report("handler was not registered");
}


ViewStat.prototype.start = function()
{
    var inst = this;
    if (this.pano)
	setInterval(function() { inst.camWatcher()}, 100);
}

ViewStat.prototype.sendStatus = function(panoLon, panoLat)
{
    if (this.sock == null) {
	report("no socket - can't send status");
    }
    var msg = {'name': 'joe', 'type': 'people'};
    var t = VS.getClockTime();
    this.lastSendTime = t;
    msg.userId = this.userId;
    msg.name = this.name;
    msg.origin = this.origin;
    msg.curPos = this.curPos;
    msg.num = this.msgNum++;
    msg.t = t;
    if (panoLon != null && panoLat != null) {
	msg.panoView = [panoLon, panoLat];
    }
    LAST_MSG = msg;
    var str = JSON.stringify(msg);
    //report("sending "+str);
    //this.sock.emit('viewInfo', str);
    this.sock.emit('people', str);
    $("#status").html("sending "+JSON.stringify(msg));
}

ViewStat.prototype.watchViewInfo = function(msgStr)
{
    //report("got msg: "+JSON.stringify(msg));
    msg = JSON.parse(msgStr);
    LAST_IMSG = msg;
    var userId = msg.userId;
    //report("userId: "+userId +"  "+this.userId);
    if (msg.userId != this.userId) {
	if (msg.panoView) {
	    var yaw = msg.panoView[0];
	    var pitch = msg.panoView[1];
	    //report(userId+"  yaw: "+yaw+"  pitch: "+pitch);
	}
	else {
	    //report(userId+"  no view status");
	}
    }
    for (var i=0; i<this.handlers.length; i++) {
	this.handlers[i](msg)
    }
}

ViewStat.prototype.camWatcher = function()
{
    //console.log("tick...");
    //if (!VS)
    //  return;
    var view = pano.getView();
    var fov = view.fov;
    var yaw = view.yaw;
    var pitch = view.pitch;
    //report("viewStat lat: "+lat+"  lon: "+lon);
    var t = VS.getClockTime();
    var dt = t - this.lastSendTime;
    if (yaw != this.prevYaw || pitch != this.prevPitch || fov != this.prevFOV || dt > VS.heartbeatTime) {
        viewStat.sendStatus(yaw, pitch, fov);
    }
    this.prevPitch = pitch;
    this.prevYaw = yaw;
    this.prevFOV = fov;
}
