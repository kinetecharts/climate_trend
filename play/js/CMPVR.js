"use strict";

var CMPVR = {};
CMPVR.updateFuns = [];
CMPVR.duration = 1920.042667;
CMPVR.playing = true;
CMPVR.cloth = null;
CMPVR.MODELS = [];
CMPVR.OBJSPECS = {};
CMPVR.OBJS = {};
CMPVR.MODEL_OPTS = {
   'scale': [.03,.03,.03],
   'position': [5,-2.5,4],
   'rotation': [0,90,0]
};
CMPVR.AVATAR_PATH = null;

//var MODEL_PATH = null;
var SP = null;
var VIDEO_TEX = null;
var VIDEO_MAT = null;
var MB = null;
var loader = null;
var SCENE = null;
var DAE = null;
var SCREEN = null;
var SOBJ = null;
var SK_SCREEN = null;
var ANCHOR = null;
var AVATAR = null;
var light1 = null;
var light2 = null;

CMPVR.SHOW_MOVIE = true;
CMPVR.SHOW_CLOTH_SCREEN = false;

CMPVR.timeStr = function(t)
{
    var m = Math.floor(Math.floor(t)/60);
    var s = t - m*60;
    var si = Math.floor(s);
    var sf = s-si;
    return m+":"+si+"."+Math.floor(10*sf);
}

CMPVR.getClockTime = function() { return new Date()/1000.0; }

CMPVR.loadJSONModel = function(scene, path, opts, afterFun)
{
    report("loadJSONModel "+scene+" "+path);
    var manager = new THREE.LoadingManager();
    manager.onProgress = function( item, loaded, total ) {
	console.log( item, loaded, total );
    };
    var loader = new THREE.JSONLoader( manager );
    //var loader = new THREE.SceneLoader( manager );
    loader.load( path,
        function( object ) {
           /*
	     object.mixer = new THREE.AnimationMixer( object );
	     mixers.push( object.mixer );
	     var action = object.mixer.clipAction( object.animations[ 0 ] );
	     action.play();
	   */
	    scene.add( object );
	    if (afterFun) {
		afterFun(object);
	    }
	},
        function() {
	},
	function (e) {
	    report("Error loading JSON file "+path+"\n"+e);
	}
	);
}

CMPVR.loadFBXModel = function(scene, path, opts, afterFun)
{
    report("loadFBXModel "+scene+" "+path);
    //var path = './DomeSpace.fbx';
    var manager = new THREE.LoadingManager();
    manager.onProgress = function( item, loaded, total ) {
	console.log( item, loaded, total );
    };
    var loader = new THREE.FBXLoader( manager );
    loader.load( path,
        function( object ) {
           /*
	     object.mixer = new THREE.AnimationMixer( object );
	     mixers.push( object.mixer );
	     var action = object.mixer.clipAction( object.animations[ 0 ] );
	     action.play();
	   */
	    scene.add( object );
	    if (afterFun) {
		afterFun(object);
	    }
	},
        function() {
	},
	function (e) {
	    report("Error loading FBX file "+path+"\n"+e);
	}
	);
}

CMPVR.loadColladaModel = function(scene, path, opts, afterFun)
{
    report("loadColladaModel "+scene+" "+path);
    var imageSource = imageSrc;
    opts = opts || {};
    loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    //loader.load( './DomeSpace.dae', function ( collada ) {
    loader.load( path, function ( collada ) {
	report("***** Got Collada *****");
	var dae = collada.scene;
	DAE = dae;
	if (opts.name) {
	    CMPVR.OBJSPECS[opts.name] = opts;
	    CMPVR.OBJS[opts.name] = dae;
	}
	dae.traverse( function ( child ) {
	    if ( child instanceof THREE.SkinnedMesh ) {
		var animation = new THREE.Animation( child, child.geometry.animation );
		animation.play();
	    }
	} );
	var s = 0.002 * 2.5;
	if (opts.scale) {
	    dae.scale.x = opts.scale[0];
	    dae.scale.y = opts.scale[1];
	    dae.scale.z = opts.scale[2];
	}
	dae.position.x = 2;
	dae.position.z = -5.5;
	dae.position.y = -2;
	if (opts.position) {
	    dae.position.x = opts.position[0];
	    dae.position.y = opts.position[1];
	    dae.position.z = opts.position[2];
	}
	if (opts.rotation) {
	    dae.rotation.x = toRadians(opts.rotation[0]);
	    dae.rotation.y = toRadians(opts.rotation[1]);
	    dae.rotation.z = toRadians(opts.rotation[2]);
	}
	dae.updateMatrix();
	scene.add(dae);
	if (afterFun) {
	    afterFun(dae);
	}
//	init();
//	animate();
    } );
}

CMPVR.loadModel = function(scene, path, opts, afterFun)
{
    if (path.endsWith(".fbx")) {
	CMPVR.loadFBXModel(scene, path, opts, afterFun);
    }
    else if (path.endsWith(".dae")) {
	CMPVR.loadColladaModel(scene, path, opts, afterFun);
    }
    else {
	report("Unknown model type "+path);
    }
}

CMPVR.addSphereMovie = function(scene)
{
    report("addMovie "+scene);
    var imageSource = imageSrc;
    if (!VIDEO_TEX) {
	VIDEO_TEX = imageSource.createTexture();
    }
    var texture = VIDEO_TEX;
    if (!VIDEO_MAT) {
	VIDEO_MAT = new THREE.MeshBasicMaterial({
	    map: texture,
	    transparent: true,
	    side: THREE.DoubleSide,
	});
    }
    var material = VIDEO_MAT;
    var r = 1.0;
    var thLen = toRadians(60);
    var phLen = toRadians(40);
    var thMin = toRadians(90)-thLen/2;
    var phMin = toRadians(90)-phLen/2;
    var sphere = new THREE.Mesh(
	new THREE.SphereGeometry(r, 40, 40,
				 thMin, thLen, phMin, phLen),
	    material
	);
    sphere.scale.x = -1;
    var f = 5.0;
    sphere.scale.x *= f;
    sphere.scale.y *= f;
    sphere.scale.z *= f;
    //sphere.position.y = -2.5;
    sphere.position.y = 0;
    sphere.name = "sphere";
    SP = sphere;
    SP.rotation.y = toRadians(90);
    SP.position.x = -2;
    SP.position.y = -1.0;
    var obj = new THREE.Object3D();
    obj.add(SP);
    //obj.rotation.z = toRadians(25);
    obj.rotation.z = toRadians(0);
    //scene.add(sphere);
    scene.add(obj);
}

CMPVR.addMovie = function(scene)
{
    var x = 4.7;
    var y = 0.3;
    var z = .2;
    var w = 6.0;
    var h = 4.0;
    report("addMovie "+scene);
    var imageSource = imageSrc;
    if (!VIDEO_TEX) {
	VIDEO_TEX = imageSource.createTexture();
    }
    var texture = VIDEO_TEX;
    VIDEO_TEX = texture;
    if (!VIDEO_MAT) {
	VIDEO_MAT = new THREE.MeshBasicMaterial({
	    map: texture,
	    transparent: true,
	    side: THREE.DoubleSide,
	});
    }
    var material = VIDEO_MAT;
    var pts = [new THREE.Vector2(0, 0),
	       new THREE.Vector2(0, 1),
	       new THREE.Vector2(1, 1),
	       new THREE.Vector2(1, 0)]
    var shape = new THREE.Shape(pts);
    var screen = new THREE.Mesh(
	new THREE.ShapeGeometry(shape),
	    material
	);
    SCREEN = screen;
    screen.name = "screen";
    screen.scale.x *= -w;
    screen.scale.y *= h;
    screen.scale.z *= 1;
    screen.position.z = z - w/2.0;
    screen.position.y = y - h/2.0;
    screen.rotation.y = toRadians(90);
    screen.position.x = x;
//    screen.position.y = -1.0;
    var obj = new THREE.Object3D();
    SOBJ = obj;
    obj.add(screen);
    //obj.rotation.z = toRadians(25);
    obj.rotation.z = toRadians(0);
    scene.add(obj);
}

CMPVR.loadAvatar = function(scene, path, opts)
{
    report("**** loadAvatar ****");
    //loadFBXModel(scene, path, opts, function(obj) {
    CMPVR.loadJSONModel(scene, path, opts, function(obj) {
        report("**** got avatar ****");
	AVATAR = obj;
    });
}

CMPVR.findAnchor = function(obj)
{
    var anchor = obj.getObjectByName("VizAnchor");
    if (!anchor)
	return;
    ANCHOR = anchor;
    var mesh = anchor.children[0];
    var geo = mesh.geometry;
    geo.mergeVertices();
    anchor.visible = false;
}

CMPVR.findScreen = function(obj)
{
    var screen = obj.getObjectByName("Screen");
    return;
    SK_SCREEN = screen;
    report("SCREEN: "+SCREEN);
    if (!screen)
	return;
    var mesh = screen.children[0];
    mesh.geometry.mergeVertices();
    var mat = new THREE.MeshBasicMaterial({
	    map: VIDEO_TEX,
	    side: THREE.DoubleSide,
    });
    mesh.material = mat;
}

/*
This goes through the loaded model and finds objects that were put there
to help us locate positions or assign some behaviors.
*/
CMPVR.processHooks = function(obj)
{
    CMPVR.findAnchor(obj);
    CMPVR.findScreen(obj);
}

// Gets called from in playapp.js
//
CMPVR.load = function(three, mathbox)
{
    MB = mathbox;
    var scene = three.scene;
    SCENE = scene;
    if (CMPVR.SHOW_MOVIE) {
        CMPVR.addMovie(scene);
    }
    //report("***************************** MODEL_PATH: "+MODEL_PATH);
    CMPVR.MODELS.forEach(m => {
	if (typeof m == "string") {
	    CMPVR.loadModel(scene, m, CMPVR.MODEL_OPTS, CMPVR.processHooks);
	}
	else {
	    CMPVR.loadModel(scene, m.path, m, CMPVR.processHooks);
	}
    });
//    if (MODEL_PATH) {
//	CMPVR.loadModel(scene, MODEL_PATH, MODEL_OPTS, CMPVR.processHooks);
//    }
    //var AVATAR_PATH = "./models/avatar.fbx";
    if (CMPVR.AVATAR_PATH) {
	CMPVR.loadAvatar(scene, CMPVR.AVATAR_PATH, CMPVR.MODEL_OPTS);
    }
    if (CMPVR.SHOW_CLOTH_SCREEN) {
	setTimeout(function() {
	    CMPVR.addClothScreen();
	}, 500);
    }
    var sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

    var color1 = 0xffaaaa;
    light1 = new THREE.PointLight( color1, 2, 50 );
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: color1 } ) ) );
    light1.position.y = 30;
    light1.position.x = -10;
    scene.add( light1 );
		
    var color2 = 0xaaffaa;
    light2 = new THREE.PointLight( color2, 2, 50 );
    light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: color2 } ) ) );
    light2.position.y = 30;
    light2.position.x = -10;
    light2.position.z = 5;
    scene.add( light2 );
}

function tourSliderChanged(e, ui)
{
    report("**** tourSliderChanged ****");
    var v = ui.value;
    var t = v*CMPVR.duration;
    report("v: "+v+"   t: "+t);
    imageSrc.setPlayTime(t);
}

CMPVR.timerFun_ = function(e)
{
    //report("*** tick... ");
    var d = imageSrc.video.duration;
    var t = imageSrc.video.currentTime;
    //report("d: "+d+"  t: "+t);
    //report("dur: "+d);
    var str = "t: "+CMPVR.timeStr(t);
    $("#textLine").html(str);
    //
    // Handle year
    //
    var y = timeToYear(t);
    var yStr = "";
    if (y != null)
	yStr = ""+Math.floor(y+0.5);
    $("#yearText").html(yStr);
    //
    // Handle Narrative
    var nar = getNarrative(t) || "";
    $("#narrativeText").html(nar);
    if (VIDEO_MAT) {
	var opacity = getVideoOpacity(t);
	if (typeof opacity == "number") {
	    VIDEO_MAT.opacity = opacity;
	}
    }
}

CMPVR.isPlaying = function() { return CMPVR.playing; }

CMPVR.play = function()
{
    CMPVR.playing = true;
    imageSrc.play();
}

CMPVR.pause = function()
{
    CMPVR.playing = false;
    imageSrc.pause();
}

function togglePlayStop(e)
{
    report("togglePlayStop");
    if (CMPVR.isPlaying()) {
	CMPVR.pause();
    }
    else {
	CMPVR.play();
    }
}

CMPVR.timerFun = function(e)
{
    try {
	CMPVR.timerFun_(e);
    }
    catch (e) {
	report("error: "+e);
    }
    setTimeout(CMPVR.timerFun, 100);
}

CMPVR.addClothScreen = function()
{
      CLOTH.wind = 0.05;
      var cloth = new Cloth();
      CMPVR.cloth = cloth;
      cloth.setupCloth(SCENE, VIDEO_TEX, VIDEO_MAT);
      cloth.obj.scale.z=.02;
      cloth.obj.scale.x=.025;
      cloth.obj.scale.y=.015;
      cloth.obj.rotation.y=toRadians(90);
      cloth.obj.position.x = 2;
      cloth.obj.position.y = -0;
      cloth.invertTex();
      //UPDATE_FUN = CLOTH.update;
}

CMPVR.update = function()
{
    var t = CMPVR.getClockTime();
    if (CLOTH)
	CLOTH.update();
    Object.keys(CMPVR.OBJS).forEach(name => {
	var spec = CMPVR.OBJSPECS[name];
	var obj = CMPVR.OBJS[name];
	//report("update "+name+" "+obj+" "+spec.update);
	if (spec.update) {
	    spec.update(obj, t, spec.name);
	}
    });
}

function getVideoOpacity(t)
{
    if (!CMPVR.gss)
	return 0;
    var y = timeToYear(t);
    var va = CMPVR.gss.getFieldByYear(y, "videofade");
    va = getFloat(va, 1.0);
    return va;
}

function getNarrative(t)
{
    if (!CMPVR.gss)
	return "";
    var y = timeToYear(t);
    return CMPVR.gss.getFieldByYear(y, "narrative");
}



//var SSURL = "https://spreadsheets.google.com/feeds/list/1aJP9n8cVBF1PvqfVd_f6szuR1ZS8iX_3y0cJnCFwQeA/default/public/values?alt=json";
var SSURL = "https://spreadsheets.google.com/feeds/list/1Vj4wbW0-VlVV4sG4MzqvDvhc-V7rTNI7ZbfNZKEFU1c/default/public/values?alt=json";


$(document).ready(function() {
    report("**** setting up slider ****");
    $("#timeLine").slider({
	    slide: tourSliderChanged,
		min: 0, max: 1, step: 0.001
    });
    $("#playStop").click(togglePlayStop);
    CMPVR.timerFun();
    //TODO: How to do this if *strict* is being used...
    if (GSS) {
	CMPVR.gss = new GSS.SpreadSheet();
    }
    else {
	report("***** No GSpreadSheet included ****");
    }
});

