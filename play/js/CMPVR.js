"use strict";

function report(str) { console.log(str); }

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var toDegrees = function(r) {
    return r*180/Math.PI;
};

var toRadians = function(d) {
    return Math.PI * d / 180.0;
};

var CMPVR_UPDATE_FUNS = [];
var CMPVR_RESIZE_FUNS = [];

//
// This is for starting the scene without mathbox running first...
// (Then mathbox could be used via mathbox.Context
//

var CMPVR = {
    loadedModels: {},
    useFPC: false,
    camera: new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 30000 ),
    renderer: new THREE.WebGLRenderer( {
        depth: true,
        stencil: true,
        preserveDrawingBuffer: true,
        antialias: true
     } ),
    scene: new THREE.Scene(),
    controls: null,
    init: function()
    {
        this.prevTime = getClockTime();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000020 ); //NOFOG

	if (this.useFPC) {
	    this.controls = new THREE.CMP_Controls( this.camera , this.renderer.domElement )
	}
        else {
            this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement )
	    this.controls.addEventListener('change', this.render.bind(this));
	}
        if (false) {
            var imageUrl = 'models/textures/patterns/fabric1.jpg';
            //var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
            var texture = new THREE.TextureLoader().load( imageUrl );
            var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
            var material = new THREE.MeshBasicMaterial( { map: texture } );
            var mesh = new THREE.Mesh( geometry, material );
            this.scene.add( mesh );
        }

        this.camera.position.z = 400;
        this.setupScene(this.scene, this.camera);
        
        var container = document.createElement( 'div' );
        container.appendChild( this.renderer.domElement );
        document.body.appendChild( container );
        
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
	if (this.controls.handleResize) {
	    this.controls.handleResize();
	}
        this.animate();
    },

    animate: function() {
        //report("animate");
        requestAnimationFrame( this.animate.bind(this) );
        this.render();
        if (this.context)
            this.context.frame();
        var t = getClockTime();
	var deltaTime = (t - this.prevTime);
	this.prevTime = t;
        this.controls.update(deltaTime);
        this.update();
        var duration = this.getClockTime();
	    CMPVR_UPDATE_FUNS.forEach( (f) => f(duration) );
        //stats.update();
    },

    render: function() {
        this.renderer.render(this.scene, this.camera);
    },

    onWindowResize: function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        if (this.controls.handleResize) {
            this.controls.handleResize();
        }
        CMPVR_RESIZE_FUNS.forEach( (f) => f(window.innerWidth, window.innerHeight) );
    }
};
// Use this to start CMPVR as a 'slave' to mathbox
// which should already be started, so that three
// and mathbox are defined and passed as arguments.
CMPVR.initFromMathbox = function(mathbox)
{
    MB = mathbox;
    var three = mathbox.three;
    //var scene = three.scene;
    //var camera = three.camera;
    CMPVR.setupScene(three.scene, three.camera);
    three.on('update', ()=> { CMPVR.update() });

    // CMPVR.initDaydream();
}

CMPVR.initDaydream = function () {
    var vrdisplay;
    WEBVR.getVRDisplay( function ( display ) {
        if ( display !== undefined ) {
            vrdisplay = display;
            mathbox.three.camera = new THREE.WebVRCamera( display, mathbox.three.renderer );
        }
        document.body.appendChild( WEBVR.getButton( display, mathbox.three.renderer.domElement ) );
    } );
    //
    var gamepad = new THREE.DaydreamController();
    gamepad.position.set( 0.25, - 0.5, 0 );
    mathbox.three.scene.add( gamepad );
    //
    var gamepadHelper = new THREE.Line( new THREE.BufferGeometry(), new THREE.LineBasicMaterial( { linewidth: 4 } ) );
    gamepadHelper.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 10 ], 3 ) );
    gamepad.add( gamepadHelper );
    mathbox.three.renderer.domElement.addEventListener( 'click', function ( event ) {
        gamepadHelper.material.color.setHex( Math.random() * 0xffffff );
    } );
}

CMPVR.MODELS = [];
CMPVR.OBJSPECS = {};
CMPVR.OBJS = {};
CMPVR.SHOW_AXES = false;

CMPVR.DEFAULT_MODEL_OPTS = {
   'scale': [1.0, 1.0, 1.0],
   'position': [0, 0, 0],
   'rotation': [0,90,0]
};
CMPVR.AVATAR_PATH = null;
CMPVR.SCREEN_SPEC = {x: 5.5, y: 2.5, z: -0.1, width: 6.5, height: 4.0};
CMPVR.CLOTH_SCREEN_SPEC = {x: 2, y: 2.5, z: -0.1};
CMPVR.SHOW_MOVIE = true;
CMPVR.SHOW_CLOTH_SCREEN = false;

CMPVR.context = null;
CMPVR.updateFuns = [];
CMPVR.duration = 1920.042667;
CMPVR.playing = true;
CMPVR.cloth = null;
CMPVR.axisHelper = null;
CMPVR.VIEWS =
    {"home": {position: {x: -7.31, y: 4.18, z: 1.75},
	      rotation: {x: -1.0, y: -1.0306177244546486, z: -0.927818006846596}},
     "far": {position: {x: -13.8, y: 13.6, z: 2.5},
	     rotation: {x: -1.4, y: -0.69, z: -1.36}}
    };

// These caps variables are mostly for debugging
// they get assigned to things that are convenient
// in the JavaScript console.
//var MODEL_PATH = null;
var SP = null;
var VIDEO_TEX = null;
var VIDEO_MAT = null;
var MB = null;
var SCENE = null;
var CAMERA = null;
var DAE = null;
var SCREEN = null;
var SOBJ = null;
var SK_SCREEN = null;
var ANCHOR = null;
var AVATAR = null;
var LIGHT1 = null;
var LIGHT2 = null;
var LIGHT3 = null;

var loader = null;
var clock = new THREE.Clock();
var skeletonHelper;
var mixer;

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
		afterFun(object, opts);
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
	    var s = scaleVec(opts.scale);
	    dae.scale.x = s[0];
	    dae.scale.y = s[1];
	    dae.scale.z = s[2];
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
	    //afterFun(dae);
	    // This is a bad hack... see note for findAnchor
	    setTimeout(function() { afterFun(dae);}, 100);
	}
    } );
}

var OBJM = null;
CMPVR.loadOBJModel0 = function(scene, path, opts, afterFun)
{
    var manager = new THREE.LoadingManager();
    var loader = new THREE.OBJLoader( manager );

    var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
	    var percentComplete = xhr.loaded / xhr.total * 100;
	    console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
    };
    var onError = function ( xhr ) {
    };

    loader.load( path, function ( object ) {
	object.traverse( function ( child ) {
	    if ( child instanceof THREE.Mesh ) {
		//child.material.map = texture;
	    }
	} );
	object.position.y = 0;
	console.log("adding loaded model to scene");
        OBJM = object;
	scene.add( object );
    }, onProgress, onError );    
}

CMPVR.loadOBJModel = function(scene, path, opts, afterFun)
{
    THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

    var mtlLoader = new THREE.MTLLoader();
    var mtlPath = path.replace(".obj", ".mtl")

    var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
	    var percentComplete = xhr.loaded / xhr.total * 100;
	    console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
    };
    var onError = function ( xhr ) {
    };

    //var dir = "./models/PlaySpace/";
    //mtlLoader.setPath( dir );
    mtlLoader.load( mtlPath, function( materials ) {
	console.log(">>> Got materials");
	materials.preload();
	var objLoader = new THREE.OBJLoader();
	objLoader.setMaterials( materials );
	//objLoader.setPath( dir );
	objLoader.load( path, function ( object ) {
	    object.position.y = 0;
	    scene.add( object );
	    console.log(">>> adding loaded model to scene");
            OBJM = object;
	    if (afterFun) {
		afterFun(object, opts);
	    }
	}, onProgress, onError );
    });
}

CMPVR.loadModel = function(scene, path, opts, afterFun)
{
    if (path.endsWith(".fbx")) {
	CMPVR.loadFBXModel(scene, path, opts, afterFun);
    }
    else if (path.endsWith(".obj")) {
	//CMPVR.loadOBJModel0(scene, path, opts, afterFun);
	CMPVR.loadOBJModel(scene, path, opts, afterFun);
    }
    else if (path.endsWith(".dae")) {
	CMPVR.loadColladaModel(scene, path, opts, afterFun);
    }
    else {
	report("Unknown model type "+path);
    }
}

CMPVR.addSphereMovie = function(scene, spec)
{
    report("addSphereMovie "+scene);
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
    //var thLen = 120;
    //var phLen = 80;
    var thLen = toRadians(140);
    var thMin = toRadians(180)-thLen/2;
    //var phMin = toRadians(90)-phLen/2;
    var phMin = toRadians(31);
    var phLen = toRadians(49);
    var sphere = new THREE.Mesh(
	new THREE.SphereGeometry(r, 40, 40,
				 thMin, thLen, phMin, phLen),
	    material
	);
    sphere.scale.x = -1;
    var f = 8.6;
    sphere.scale.x *= f;
    sphere.scale.y *= f;
    sphere.scale.z *= f;
    sphere.position.y = 0;
    sphere.name = "sphereMoveScreen";
    SP = sphere;
    //SP.rotation.y = toRadians(0);
    //SP.position.x = -2;
    //SP.position.y = -1.0;
    var obj = new THREE.Object3D();
    obj.add(SP);
    //obj.rotation.z = toRadians(25);
    obj.rotation.z = toRadians(0);
    //scene.add(sphere);
    scene.add(obj);
}

CMPVR.addMovie = function(scene, spec)
{
    report("----------->>>>>>>>>>> addMovie "+scene);
    spec = spec || CMPVR.SCREEN_SPEC;
    if (spec.spherical) {
	return CMPVR.addSphereMovie(scene, spec);
    }
    var pos = spec;
    var w = spec.width;
    var h = spec.height;
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
    screen.position.x = pos.x;
    screen.position.y = pos.y - h/2.0;
    screen.position.z = pos.z - w/2.0;
    screen.rotation.y = toRadians(90);
    var obj = new THREE.Object3D();
    SOBJ = obj;
    obj.add(screen);
    //obj.rotation.z = toRadians(25);
    //obj.rotation.z = toRadians(0);
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

/*
This looks for a "anchor" object which is a triangle mesh
with given name.  This can be put in by SketchUp to define
an anchor point.  If the anchor is found, the model is
repositioned so that anchor coincides with (0,0,0).

For the repositioning to work, the obj must already be placed
in the scene.   For some reason when the model is immediately
loaded and placed in the scene, this is not working.  So the
call to this processing is delayed a little bit.  I think the
reason is that mathbox changes something in the transforms
after this is loaded.
*/
CMPVR.findAnchor = function(obj)
{
    var anchor = obj.getObjectByName("VizAnchor");
    if (!anchor)
	return;
    ANCHOR = anchor;
    var mesh = anchor.children[0];
    var geo = mesh.geometry;
    geo.mergeVertices();
    anchor.visible = true;
    var v = anchor.localToWorld(new THREE.Vector3());
    report("********************************************************");
    report("v: "+JSON.stringify(v));
    obj.position.sub(v);
}

CMPVR.findScreen = function(obj)
{
    var screen = obj.getObjectByName("Screen");
    SK_SCREEN = screen;
    report("SCREEN: "+SCREEN);
    if (!screen)
	return;
    report("****** HIDING SketchSup Screen ******");
    screen.visible = false;
    /*
    var mesh = screen.children[0];
    mesh.geometry.mergeVertices();
    var mat = new THREE.MeshBasicMaterial({
	    map: VIDEO_TEX,
	    side: THREE.DoubleSide,
    });
    mesh.material = mat;
   */
}

function scaleVec(s)
{
    if (typeof s == "number")
	return [s,s,s];
    return s;
}

/*
This goes through the loaded model and finds objects that were put there
to help us locate positions or assign some behaviors.
*/
CMPVR.processHooks = function(obj, opts)
{
    CMPVR.findAnchor(obj);
    CMPVR.findScreen(obj);
    console.log("********* processHooks "+JSON.stringify(opts));
    if (!opts)
	return;
    if (opts.name) {
	CMPVR.OBJSPECS[opts.name] = opts;
	CMPVR.OBJS[opts.name] = obj;
    }
    if (opts.scale) {
	var s = scaleVec(opts.scale);
	console.log("set scale: "+s);
	console.log("s: "+s);
	obj.scale.x = s[0];
	obj.scale.y = s[1];
	obj.scale.z = s[2];
    }
    if (opts && opts.hide) {
	var idToHide = opts.hide;
	console.log("hiding "+idToHide);
	var hobj = obj.getObjectByName(idToHide);
	if (hobj)
	    hobj.visible = false;
	else {
	    console.log("**** hide: no obj named: "+opts.hide);
	}
    }
}

// Gets called from in playapp.js
//
CMPVR.setView = function(view)
{
    view = view || "home";
    if (typeof view == "string")
	view = CMPVR.VIEWS[view];
    var cam = CMPVR.camera;
    if (!cam) {
	error("No camera");
    }
    if (view.position) {
	cam.position.x = view.position.x;
	cam.position.y = view.position.y;
	cam.position.z = view.position.z;
    }
    if (view.rotation) {
	cam.rotation.x = view.rotation.x;
	cam.rotation.y = view.rotation.y;
	cam.rotation.z = view.rotation.z;
    }
}

CMPVR.setupScene = function(scene, camera)
{
    CMPVR.camera = camera;
    CMPVR.scene = scene;
    CMPVR.setView();
    SCENE = scene;
    if (CMPVR.SHOW_AXES) {
	CMPVR.axisHelper = new THREE.AxisHelper( 10 );
	scene.add( CMPVR.axisHelper );
    }
    if (CMPVR.SHOW_MOVIE) {
        CMPVR.addMovie(scene);
    }
    //report("***************************** MODEL_PATH: "+MODEL_PATH);
    CMPVR.MODELS.forEach(m => {
	if (typeof m == "string") {
	    CMPVR.loadModel(scene, m, CMPVR.DEFAULT_MODEL_OPTS, CMPVR.processHooks);
	}
	else {
	    CMPVR.loadModel(scene, m.path, m, CMPVR.processHooks);
	}
    });

    if (CMPVR.BVH_PATH) {
       CMPVR.loadBVH(scene, CMPVR.BVH_PATH);
    }

    if (CMPVR.AVATAR_PATH) {
	   CMPVR.loadAvatar(scene, CMPVR.AVATAR_PATH, CMPVR.DEFAULT_MODEL_OPTS);
    }
    if (CMPVR.SHOW_CLOTH_SCREEN) {
	setTimeout(function() {
	    CMPVR.addClothScreen();
	}, 500);
    }
    var sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

    var color1 = 0xffaaaa;
    var light1 = new THREE.PointLight( color1, 2, 50 );
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: color1 } ) ) );
    light1.position.y = 30;
    light1.position.x = -10;
    scene.add( light1 );
    LIGHT1 = light1;
		
    var color2 = 0xaaffaa;
    var light2 = new THREE.PointLight( color2, 2, 50 );
    light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: color2 } ) ) );
    light2.position.y = 30;
    light2.position.x = -10;
    light2.position.z = 5;
    scene.add( light2 );
    LIGHT2 = light2;
    setTimeout(function() { CMPVR.setView();}, 100);

    var color3 = 0xaaaaff;
    var light3 = new THREE.PointLight( color3, 2, 50 );
    light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: color3 } ) ) );
    light3.position.y = 30;
    light3.position.x = -10;
    light3.position.z = -5;
    scene.add( light3 );
    LIGHT3 = light3;
    setTimeout(function() { CMPVR.setView();}, 100);
}

CMPVR.loadBVH = function(scene, bvh) {
    var loader = new THREE.BVHLoader();
    loader.load( bvh, function( result ) {
        console.log("BVH: ", result);
        var dancer = new THREE.Object3D();
        skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
        skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to SkeletonHelper directly
	skeletonHelper.material.depthTest = true;
        var boneContainer = new THREE.Group();
        boneContainer.add( result.skeleton.bones[ 0 ] );
        dancer.add( skeletonHelper );
        dancer.add( boneContainer );
        console.log(dancer);
        dancer.scale.x = 0.06;
        dancer.scale.y = 0.06;
        dancer.scale.z = 0.06;
        scene.add(dancer);
        // play animation
        mixer = new THREE.AnimationMixer( skeletonHelper );
        mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();
    } );
}

function tourSliderChanged(e, ui)
{
    report("**** tourSliderChanged ****");
    var v = ui.value;
    var t = v*CMPVR.duration;
    report("v: "+v+"   t: "+t);
    imageSrc.setPlayTime(t);
}

CMPVR.getVideoTime = function() {
    return imageSrc.video.currentTime;
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
	report("stack: "+e.stack);
    }
    setTimeout(CMPVR.timerFun, 100);
}

CMPVR.addClothScreen = function()
{
      var pos = CMPVR.CLOTH_SCREEN_SPEC;
      CLOTH.wind = 0.05;
      var cloth = new Cloth();
      CMPVR.cloth = cloth;
      cloth.setupCloth(SCENE, VIDEO_TEX, VIDEO_MAT);
      cloth.obj.scale.z=.02;
      cloth.obj.scale.x=.025;
      cloth.obj.scale.y=.015;
      cloth.obj.rotation.y=toRadians(90);
      cloth.obj.position.x = pos.x;
      cloth.obj.position.y = pos.y;
      cloth.obj.position.z = pos.z;
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

    var delta = clock.getDelta();
    if ( mixer ) mixer.update( delta );
    if ( skeletonHelper ) skeletonHelper.update();
}

function getVideoOpacity(t)
{
    if (!CMPVR.gss)
	return 0;
    var y = timeToYear(t);
    var va = CMPVR.gss.getFieldByYear(y, "videofade");
    //report("getVideoOpacity "+t+" va: "+va);
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

