		 

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer;
var sphere;
var object, arrow;

var rotate = true;

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.y = 50;
    camera.position.z = 1500;
    scene.add( camera );

    // lights
    var light, materials;
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    light = new THREE.DirectionalLight( 0xdfebff, 1.75 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );

    light.castShadow = true;
    //light.shadowCameraVisible = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 300;

    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;

    light.shadow.camera.far = 1000;
    //light.shadowDarkness = 0.5;

    scene.add( light );

    // arrow
    arrow = new THREE.ArrowHelper( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 50, 0xff0000 );
    arrow.position.set( -200, 0, -200 );
    // scene.add( arrow );


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color );

    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMapEnabled = true;

    //

    stats = new Stats();
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    return scene;
}

//
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//
function animate() {
    requestAnimationFrame( animate );
    if (CLOTH)
	CLOTH.update();
    render();
    stats.update();
}

function render() {
    var timer = Date.now() * 0.0002;
    if ( rotate ) {
        camera.position.x = Math.cos( timer ) * 1500;
        camera.position.z = Math.sin( timer ) * 1500;
    }
    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}


