
VD = {};
VD.viewGraphicDist = 2.0;
VD.viewGraphicSize = 0.5;

function ViewDecorations(pano, viewStat)
{
    var inst = this;
    this.graphics = {};
    this.pano = pano;
    this.viewStat = viewStat;
    this.prevPanoSurface = null;
    viewStat.addStatusHandler(function(msg) {
	//report("viewDecorations status Handler "+msg);
	inst.handleStatus(msg);
    })
}

ViewDecorations.prototype.pruneZombies = function()
{
    var t = VS.getClockTime();
    var deletedKeys = [];
    for (key in this.graphics) {
	//report("key: "+key);
	var obj = this.graphics[key];
	var dt = t - obj.lastStatusTime;
	if (dt > 2) {
	    report("*** old object");
	    //this.pano.scene.remove( obj );
	    deletedKeys.push(key);
	}
    }
    for (var i=0; i<deletedKeys.length; i++) {
	this.removeGraphic(deletedKeys[i]);
    }
}

ViewDecorations.prototype.reset = function()
{
    var deletedKeys = Object.keys(this.graphics);
    for (var i=0; i<deletedKeys.length; i++) {
	this.removeGraphic(deletedKeys[i]);
    }
}

ViewDecorations.prototype.getGraphic = function(gr)
{
    var graphic = this.graphics[graphicOrName];
    if (graphic)
	return graphic;
    return gr;
}

ViewDecorations.prototype.removeGraphic = function(name)
{
    report("removing "+name);
    var graphic = this.graphics[name];
    this.pano.scene.remove( graphic );
    delete this.graphics[name];
}


// This handles incoming status messages about
// other users' views.
ViewDecorations.prototype.handleStatus = function(msg)
{
    if (this.prevPanoSurface && this.prevPanoSurface != pano.surface)
	this.reset();
    this.prevPanoSurface = pano.surface;
    this.pruneZombies();
    var userId = msg.userId;
    if (userId == this.viewStat.userId) {
	//report("*** ignore self ***");
	return;
    }
    if (!msg.panoView)
	return;
    var yaw = msg.panoView[0];
    var pitch = msg.panoView[1];
    //report("decorations "+userId+" "+yaw+"  "+pitch);
    this.setViewGraphic(userId, yaw, pitch);
}


ViewDecorations.prototype.ypr_to_xyz = function(yawRad, pitchRad, r)
{
    var rho = r * Math.cos(pitchRad);
    var x = rho * Math.sin(yawRad);
    var z = rho * Math.cos(yawRad);
    var y = r * Math.sin(pitchRad);
    return {x: x, y: y, z: z};
}

ViewDecorations.prototype.setProps = function(name, vals)
{
    var obj = this.graphics[name];
    if (obj == null) {
	report("no such object as "+name);
	return;
    }
    obj.setView(obj, vals);
/*
    //report("name yaw: "+vals.yaw+"   pitch: "+vals.pitch);
    var ryaw = toRadians(vals.yaw - 180);
    var rpitch = toRadians(vals.pitch);
    xyz = this.ypr_to_xyz(ryaw, rpitch, VD.viewGraphicDist);
    obj.position.x = xyz.x; 
    obj.position.y = xyz.y;
    obj.position.z = xyz.z;
*/
}

ViewDecorations.prototype.setViewGraphic = function(name, yaw, pitch)
{
    var pano = this.pano;
    var obj = this.graphics[name];
    if (obj == null) {
	if (pano.surface == pano.sphere)
	    obj = this.createPerspGraphic(name, yaw, pitch);
	else
	    obj = this.createConeGraphic(name, yaw, pitch);
	this.graphics[name] = obj;
	this.pano.scene.add( obj );
    }
    obj.lastStatusTime = VS.getClockTime();
    this.setProps(name, {yaw: yaw, pitch: pitch});
}

ViewDecorations.prototype.createPerspGraphic = function(name, yaw, pitch)
{
    report("createPerspGraphic");
    var material = new THREE.MeshBasicMaterial({
        color: 0xff0000 , transparent: true, opacity: 0.2
    });
    var s = VD.viewGraphicSize;
    var geo = new THREE.SphereGeometry(VD.viewGraphicSize, 20, 20);
    obj = new THREE.Mesh( geo, material );
    report("pos: "+obj.position);
    obj.scale.x = -1;
    var inst = this;
    obj.setView = function(obj, vals) {
	var ryaw = toRadians(vals.yaw - 180);
	var rpitch = toRadians(vals.pitch);
	xyz = inst.ypr_to_xyz(ryaw, rpitch, VD.viewGraphicDist);
	obj.position.x = xyz.x; 
	obj.position.y = xyz.y;
	obj.position.z = xyz.z;
    }
    return obj;
}

ViewDecorations.prototype.createConeGraphic = function(name, yaw, pitch)
{
    report("createConeGraphic");
    //var imageURL = "monacat.jpg";
    var imageURL = "userpic.jpg";
    var texture = THREE.ImageUtils.loadTexture(imageURL);
    texture.minFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial({
	map: texture,
	side: THREE.DoubleSide
        //color: 0xff6600 ,
	//transparent: true, opacity: 0.8
    });
    var s = 140;
    //var geo1 = new THREE.BoxGeometry( s, s, s );
    var geo = new THREE.BoxGeometry( 1.2*s, 1.0, s );
    var box1 = new THREE.Mesh( geo, material );
    var box2 = new THREE.Mesh( geo, material );
    var obj = new THREE.Object3D();
    box1.position.y = -15;
    box2.position.y = 15;
    obj.add(box1);
    obj.add(box2);
    report("pos: "+obj.position);
    obj.scale.x = -1;
    var inst = this;
    obj.setView = function(obj, vals) {
	var ryaw = toRadians(vals.yaw+180);
	var s = (vals.pitch + 90)/180.0;  // 0 <= s <= 1
	var r = 600.0*(0.2 + (1-s));
	//report("pitch: "+vals.pitch+"   s:" +s+"   r: "+r);
	obj.position.x = r*Math.cos(ryaw);
	obj.position.z = r*Math.sin(ryaw);
	obj.position.y = 2;
	obj.rotation.y = (Math.PI/2 - ryaw);
    }
    return obj;
}

