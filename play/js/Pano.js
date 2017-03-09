
var verbosity = 0;

/*
   If videoEl is non null, it should be the name of a video
   element, and will be used as the source for texture images.
   This would normally be done when using webrtc.
   For the motion jpeg, leave this as null.
*/
//var videoEl = 'video';
var videoEl = null;
//width = 2048;  //****** VERY BAD... find smarter way of initializing this...
//height = 1024;
var video = null;

THREE.TextureLoader.prototype.crossOrigin = '';
THREE.ImageUtils.crossOrigin = '';

/*
var playTime = null;
var t0 = null;
var lastSeekTime = null;
var playSpeed = 1.0;
*/

function report(str) {
    console.log(str);
}

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

toDegrees = function(r) {
    return r*180/Math.PI;
};

toRadians = function(d) {
    return Math.PI * d / 180.0;
};


function Pano(element, imageSrc, useGyro) {
    var inst = this;
    this.container = element;
    this.imNum = 0;
    this.numLoads = 0;
    t0 = getClockTime();
    this.fuvs0 = null;
    this.lastMark = null;
    this.onClickPosition = new THREE.Vector2();
    this.mousePos = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.mouseClickFun = null;
    this.prevTexture = null;
    //this.running = false; // true if we have active textureUpdate loop

    if (imageSrc) {
        if (typeof imageSrc == 'string') {
            this.imageSource = new ImageSource({
                url: imageSrc, 
                type: ImageSource.TYPE.IMAGE
            });
        } else {
            this.imageSource = imageSrc; 
            //this.imageUrl = imageSrc.url;
        }
    } else {
        this.imageSource = new ImageSource({
            url: 'http://pollywss.paldeploy.com/getImage?camId=viewImage', 
            type: ImageSource.TYPE.IMAGE
        });
    }
    
    this.manager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.manager);
      

    var speed = 0.01;
    this.setupScene(element, this.imageSource, {
      view: this.getParameterByName('view'),
      speed: speed,
      useGyro: useGyro,
      y: this.getParameterByName('y')
    });
    //window.onresize = this.resize;
    window.onresize = function(evt) {
        inst.resize(evt);
    }
    this.setSphere();

    report("this:"); report(this);

    var mf = function(evt) {
	report("*** mf: "+evt+"  inst: "+inst);
	onMouseEvent(evt, inst);
    }

    this.cameraRotation = this.camera.rotation.clone();
    //this.cameraQuat = this.controls.quat.clone();
    //this.cameraQuatInverse = this.ontrols.quatInverse.clone();
    element.addEventListener('mousedown', mf, false);
}

/*
// Get a URL for fetching an image, taking time into account if necessary
Pano.prototype.getImageUrl = function()
{
    this.imNum += 1;
    if (playTime == null) { // real time
	// note 'xt' instead of 't'.  This is to avoid caching, not to
	// set time.  The dvr should give most recent if no time is given.
        return this.imageUrl + "&imNumX="+this.imNum + "&xt="+getClockTime();
    }
    return this.imageUrl + "&t="+this.getPlayTime();
}
*/

Pano.prototype.start = function() {
    report("start: imageSource: "+this.imageSource);
    this.imageSource.start();
}

Pano.prototype.stop = function() {
    this.imageSource.stop();
}

Pano.prototype.home = function() {
    report("pano home");
    this.dump();
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
}

Pano.prototype.getParameterByName = function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};


/******************************************************************************/
// Play time control functions.
// Currently these only make sense for motion jpeg uses.
//
/*
Pano.prototype.setMark = function(t) {
    if (!t)
        t = getClockTime(t);
    report("setMark "+t);
    lastMark = t;
};
*/
Pano.prototype.setMark = function(t) {
    this.imageSource.setMark(t);
}

/*
Pano.prototype.gotoMark = function() {
    var t = lastMark;
    report("gotoMark t: "+t);
    this.setPlayTime(t);
};
*/
Pano.prototype.gotoMark = function() { this.imageSource.gotoMark(); }
Pano.prototype.goBack = function() { this.imageSource.goBack(); }
Pano.prototype.goForward = function() { this.imageSource.goForward(); }

Pano.prototype.setRealTime = function() {
    this.imageSource.setPlayTime(null);
};

Pano.prototype.setPlaySpeed = function(s) {
    this.imageSource.setPlaySpeed(s);
};

Pano.prototype.getPlaySpeed = function() {
    this.imageSource.getPlaySpeed();
};

Pano.prototype.play = function() {
    this.imageSource.play();
};

Pano.prototype.pause = function() {
    this.imageSource.pause();
};

/*
Pano.prototype.setPlayTime = function(t) {
    if (t == null) {
        report("*** set real time ***");
        playTime = null
        lastSeekTime = null;
        return;
    }
    if (t < 0)
        t = getClockTime() - t;
    playTime = t;
    lastSeekTime = getClockTime();
};
*/
Pano.prototype.setPlayTime = function(t) {
    this.imageSource.setPlayTime(t);
}

/*
Pano.prototype.getPlayTime = function() {
    var t = getClockTime();
    var dt = t - lastSeekTime;
    playTime += playSpeed*dt;
    lastSeekTime = t;
    return playTime;
};
*/
Pano.prototype.getPlayTime = function() {
    return this.imageSource.getPlayTime();
}

Pano.prototype.dump = function() {
    report("sphere:");
    //report(+photosphere);
    report("texture:")
    report(this.texture);
    report("material:")
    report(this.material);
    report("camera:")
    report(this.camera);
    report("controls:")
    report(this.controls);
};


Pano.prototype.setSurface = function(node) {
    var name = this.surface.name;
    report("removing "+name);
    this.scene.remove(this.surface);
    this.scene.add(node);
    this.surface = node;
};

Pano.prototype.setSphere = function() {
    this.camera.position.x = 0.1;
    this.camera.position.y = 0;
    this.camera.position.z = 0;

    this.setSurface(this.sphere);
};

Pano.prototype.setCirc = function() {
    this.camera.position.x = 0.1;
    this.camera.position.y = 200;
    this.camera.position.z = 500;

    this.cyl.scale.x = 1.0;
    this.setSurface(this.cyl);
    //this.tweakTex(.1,.8,1);
};

Pano.prototype.setEllipse = function() {
    this.camera.position.x = 0.1;
    this.camera.position.y = 200;
    this.camera.position.z = 500;

    this.cyl.scale.x = .6;
    this.setSurface(this.cyl);
};

Pano.prototype.toggleFullScreen = function() {
    report("toggleFullScreen");
    if (!THREEx.FullScreen.activated()) {
        report("setFullScreen");
        THREEx.FullScreen.request();
    }
    else {
        report("clearFullScreen");
        THREEx.FullScreen.cancel();
    }
};

//function tweakTex(low, high, mirror) {
Pano.prototype.tweakTex = function(low, high, mirror)
{
    var s = this.cyl;
    //var s = this.surface;
    var geo = s.geometry;
    var fuvs = geo.faceVertexUvs[0];
    var mat = s.material;
    var sf = high - low;
    if (this.fuvs0 == null) {
        report("Copying initial UV's");
        this.fuvs0 = JSON.parse(JSON.stringify(fuvs));
        report("done");
    }
    var n = 0;
    for (var i=0; i<fuvs.length; i++) {
        var f = fuvs[i];
        var f0 = this.fuvs0[i];
        for (var j=0; j<3; j++) {
            if (mirror)
                f[j].x = 1.0 - f0[j].x;
            f[j].y = low + sf*f0[j].y;
            n++;
        }
    }
    report("updated uv vals: "+n);
    mat.needsUpdate = true;
    geo.uvsNeedUpdate = true;
    geo.buffersNeedUpdate = true;
};

onMouseEvent = function(evt, pano) {
    report("onMouseEvent evt: "+evt+"  pano: "+pano);
    if (evt.which != 1)
        return;
    evt.preventDefault();
    //var container = window;
    report("container: "+pano.container);
    var array = getMousePosition(pano.container, evt.clientX, evt.clientY );
    pano.onClickPosition.fromArray(array);
    var intersects = pano.getIntersects(pano.onClickPosition, pano.scene.children );
    //ISECTS = intersects;
    report("intersects: "+intersects);
    //if ( intersects.length > 0 && intersects[ 0 ].uv ) 
    if ( intersects.length > 0) {
        var intersect = intersects[0];
        var point = intersect.point;
        var angles = pano.xyzToYawPhiR(point);
        //report("point: "+point.x+" "+point.y+" "+point.z);
        if (pano.mouseClickFun)
            pano.mouseClickFun(point, angles, intersect);
        //var uv = intersects[ 0 ].uv;
        //intersects[ 0 ].object.material.map.transformUv( uv );
        //report("u: "+uv.x+"  v: "+uv.y);
        //canvas.setCrossPosition( uv.x, uv.y );
    }
};

getMousePosition = function (dom, x, y) {
    var rect = dom.getBoundingClientRect();
    return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
};

Pano.prototype.getIntersects = function (point, objects) {
    this.mousePos.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
    //report("mousePos: "+mousePos.x+" "+mousePos.y);
    MPOS = this.mousePos;
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    return this.raycaster.intersectObjects(objects);
};

Pano.prototype.xyzToYawPhiR = function(v) {
    // note different conventions about x,y,z.  We want z
    // to be the up direction.
    var x = v.x;
    var z = v.y;
    var y = v.z;
    var r = Math.sqrt(x*x + y*y + z*z);
    var yaw = Math.atan2(y, x);
    if (r == 0)
        phi = 0;
    else
        phi = Math.acos(z / r);
    return {r: r, yaw: yaw, phi: phi};
};

Pano.prototype.setMouseClickFun = function(fun) {
    this.mouseClickFun = fun;
};

//
// Methods for getting view relative to the physical camera.
// Note that there may be future methods for getting the
// orientation of the camera, and for getting an absolute.
//
Pano.prototype.getViewYaw = function()
{
    return toDegrees(this.controls.getAzimuthalAngle());
}

Pano.prototype.getViewPitch = function()
{
    return toDegrees(this.controls.getPolarAngle()) - 90.0;
}

Pano.prototype.getViewRoll = function()
{
    return 0;
}

Pano.prototype.getViewFOV = function()
{
    return this.camera.fov;
}

Pano.prototype.getView = function()
{
    return {
	yaw: this.getViewYaw(),
	pitch: this.getViewPitch(),
	roll: this.getViewRoll(),
	fov: this.getViewFOV()
    }
}

Pano.prototype.setViewYawPhi = function(yaw, phi)
{
    //var v = new THREE.Vector3(yaw, phi, 0);
    //report("Pano.setViewYawPhi "+yaw+" "+phi);
    /*
    var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(yaw, phi, 0));
    report("set quat: "+JSON.stringify(q));
    this.camera.rotation.setFromQuaternion(q);
    */
    var v = this.getView();
    //this.controls.rotateUp(xxx);
    this.controls.rotateLeft(-toRadians(yaw - v.yaw));
}

/*****************************************************************************/
//TODO: as appropriate, move some of this inner functions to be
// member functions of Pano.
//
Pano.prototype.setSize = function(width, height)
{
    var domEl = this.container;
    this.camera.aspect = width/height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height);
    this.renderer.render(this.scene, this.camera);
}

Pano.prototype.resize = function(e)
{
    if (e)
	e.preventDefault();
    var domEl = this.container;

    // set position
    var bounds = domEl.getBoundingClientRect();
    this.renderer.domElement.style.left = bounds.left + 'px';
    this.renderer.domElement.style.top = bounds.top + 'px';
    
    var wd = domEl.offsetWidth;
    var ht = domEl.offsetHeight;

    report("Pano.resize "+wd+" "+ht);
    this.setSize(wd, ht);
}

Pano.prototype.setupScene = function(domEl, imageSource, options)
{
    options = options || {};

    var camera, controls, scene, renderer, sphere;
    var pano = this;
    
    if (videoEl) {
        video = document.getElementById(videoEl);
    }

    var webglSupport = (function(){ 
	try { 
	    var canvas = document.createElement( 'canvas' ); 
	    return !! (window.WebGLRenderingContext &&
		       (canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl'))); 
	} catch(e) { 
	    return false; 
	} 
    })();

    init();
    render();

    function init () {
	// http://threejs.org/docs/#Reference/Cameras/PerspectiveCamera
	camera = new THREE.PerspectiveCamera(options.view || 75, domEl.offsetWidth / domEl.offsetHeight, 1, 1000);
	camera.position.x = 0.1;
	camera.position.y = options.y || 0;
	camera.position.y = 200;
	camera.position.z = 500;

	// for devices with 
	devControls = new THREE.DeviceOrientationControls( camera );
	// for regular devices
        orbControls = new THREE.OrbitControls(camera, domEl); // jv added domEl
        orbControls.noPan = true;
	orbControls.noZoom = true; 
	orbControls.autoRotate = true;
	//orbControls.autoRotateSpeed = options.speed || 0.5;
	//orbControls.autoRotateSpeed = options.speed || 0.0;
	orbControls.autoRotateSpeed = 0.0;
	orbControls.addEventListener('change', render);
	pano.devControls = devControls;
	pano.orbControls = orbControls;
	pano.controls = orbControls;
	//controls = orbControls;
	if (options.useGyro)
	    pano.controls = devControls;
        else
	    pano.controls = orbControls;
        //THREE.PhSp.controls = devControls;
	scene = new THREE.Scene();

	var texture = imageSource.createTexture();
	var material = new THREE.MeshBasicMaterial({
	    map: texture,
	    side: THREE.DoubleSide,
        });
	sphere = new THREE.Mesh(
	    //new THREE.SphereGeometry(100, 20, 20),
	    new THREE.SphereGeometry(500, 40, 40),
	    material
	);
	sphere.scale.x = -1;
        sphere.name = "sphere";

	cyl = new THREE.Mesh(
	    //new THREE.CylinderGeometry(100, 800, 500, 60, 40, true), //Good
	    new THREE.CylinderGeometry(100, 800, 40, 60, 40, true), //Good
	    material
	);
	//cyl.scale.x = .8;
	cyl.scale.x = .6;
	cyl.scale.y = .4;
    cyl.name = "cyl";

        //surface = cyl;
    surface = sphere;
	scene.add(surface);

	renderer = webglSupport ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
	renderer.setSize(domEl.offsetWidth, domEl.offsetHeight);
    renderer.domElement.style.position = 'absolute';

	domEl.appendChild(renderer.domElement);
	domEl.addEventListener('mousewheel', onMouseWheel, false);
	domEl.addEventListener('DOMMouseScroll', onMouseWheel, false);

	pano.material = material;
        pano.scene = scene;
        pano.camera = camera;
	pano.surface = surface;
	pano.sphere = sphere;
	pano.cyl = cyl;
        pano.texture = texture;
	pano.renderer = renderer;
	animate();
    }

    function render () {
	renderer.render(scene, camera);
    }

    function animate () {
        requestAnimationFrame(animate);
        //controls.update();
        pano.controls.update();
        render();
    }

    function onMouseWheel (evt) {
	evt.preventDefault();
	var sf = 0.015;
	if (evt.wheelDeltaY) { // WebKit
	    camera.fov -= evt.wheelDeltaY * sf;
	} else if (evt.wheelDelta) { 	// Opera / IE9
	    camera.fov -= evt.wheelDelta * sf;
	} else if (evt.detail) { // Firefox
	    camera.fov += evt.detail * 1.0;
	}
	//camera.fov = Math.max(20, Math.min(100, camera.fov));
	camera.fov = Math.max(10, Math.min(140, camera.fov));
	camera.updateProjectionMatrix();
    }

    /*
    function resize (e) {
	var delWd = domEl.offsetWidth;
	var delHt = domEl.offsetHeight;
	e.preventDefault();
	report(">>>>>>>>>>> domEl "+delWd+" "+delHt+"  e: "+e);
	camera.aspect = domEl.offsetWidth / domEl.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(domEl.offsetWidth-1, domEl.offsetHeight-1);
	//renderer.setSize(domEl.offsetWidth, domEl.offsetHeight);
	render();
    }
    */
    
    // http://stackoverflow.com/questions/21548247/clean-up-threejs-webgl-contexts
    function remove () {
	scene.remove(sphere);
	while (domEl.firstChild) {
	    domEl.removeChild(domEl.firstChild);
	}
    }

    //pano.resize = resize;
    pano.resize();
};


/*
// This could be used as a sample mouse click funtion
mouseClickFun = function(pos3, angles, intersect)
{
    report("mouseClickFun "+pos3.x+" "+pos3.y+" "+pos3.z);
    report("yaw: "+angles.yaw+"  phi: "+angles.phi+"  r: "+angles.r);
    var lat = 90 - toDegrees(angles.phi);
    var lon = toDegrees(angles.yaw);
    report("lat: "+lat+"  lon: "+lon);
}
*/
