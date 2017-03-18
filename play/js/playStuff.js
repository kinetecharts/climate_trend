"use strict";

var PL = {};
var duration = 1920.042667;
var playing = true;

//var MODEL_PATH = null;
var SP = null;
var VIDEO_TEX = null;
var MB = null;
var loader = null;
var SCENE = null;
var DAE = null;
var SCREEN = null;
var SOBJ = null;
var SK_SCREEN = null;
var ANCHOR = null;
var light1 = null;
var light2 = null;

function loadFBXModel(scene, path, opts, afterFun)
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

function loadColladaModel(scene, path, opts, afterFun)
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

function loadModel(scene, path, opts, afterFun)
{
    if (path.endsWith(".fbx")) {
	loadFBXModel(scene, path, opts, afterFun);
    }
    else if (path.endsWith(".dae")) {
	loadColladaModel(scene, path, opts, afterFun);
    }
    else {
	report("Unknown model type "+path);
    }
}

function addSphereMovie(scene)
{
    report("addMovie "+scene);
    var imageSource = imageSrc;
    var texture = imageSource.createTexture();
    VIDEO_TEX = texture;
    var material = new THREE.MeshBasicMaterial({
	    map: texture,
	    side: THREE.DoubleSide,
    });
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

function addMovie(scene)
{
    var x = 4.7;
    var y = 0.3;
    var z = .2;
    var w = 6.0;
    var h = 4.0;
    report("addMovie "+scene);
    var imageSource = imageSrc;
    var texture = imageSource.createTexture();
    VIDEO_TEX = texture;
    var material = new THREE.MeshBasicMaterial({
	    map: texture,
	    side: THREE.DoubleSide,
    });
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

function findAnchor(obj)
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

function findScreen(obj)
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
function processHooks(obj)
{
    findAnchor(obj);
    findScreen(obj);
}

function loadPlayStuff(three, mathbox)
{
    MB = mathbox;
    var scene = three.scene;
    SCENE = scene;
    addMovie(scene);
    report("***************************** MODEL_PATH: "+MODEL_PATH);
    if (MODEL_PATH) {
	loadModel(scene, MODEL_PATH, MODEL_OPTS, processHooks);
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
    var t = v*duration;
    report("v: "+v+"   t: "+t);
    imageSrc.setPlayTime(t);
}

function timerFun_(e)
{
    //report("*** tick... ");
    var d = imageSrc.video.duration;
    var t = imageSrc.video.currentTime;
    //report("d: "+d+"  t: "+t);
    //report("dur: "+d);
    var str = "t: "+t;
    $("#textLine").html(str);
}

PL.isPlaying = function() { return playing; }

PL.play = function()
{
    playing = true;
    imageSrc.play();
}

PL.pause = function()
{
    playing = false;
    imageSrc.pause();
}

function togglePlayStop(e)
{
    report("togglePlayStop");
    if (PL.isPlaying()) {
	PL.pause();
    }
    else {
	PL.play();
    }
}

function timerFun(e)
{
    try {
	timerFun_(e);
    }
    catch (e) {
	report("error: "+e);
    }
    setTimeout(timerFun, 100);
}

function addClothScreen()
{
      videoTexture = VIDEO_TEX;
      CLOTH.wind = 0.05;
      //cloth = new Cloth( CLOTH.xSegs, CLOTH.ySegs );
      cloth = new Cloth();
      cloth.setupCloth(SCENE);
      cloth.obj.scale.z=.02;
      cloth.obj.scale.x=.025;
      cloth.obj.scale.y=.015;
      cloth.obj.rotation.y=toRadians(90);
      cloth.obj.position.x = 2;
      cloth.obj.position.y = -0;
      cloth.invertTex();
      UPDATE_FUN = CLOTH.update;
}

$(document).ready(function() {
    report("**** setting up slider ****");
    $("#timeLine").slider({
	    slide: tourSliderChanged,
		min: 0, max: 1, step: 0.001
    });
    $("#playStop").click(togglePlayStop);
    timerFun();
});

