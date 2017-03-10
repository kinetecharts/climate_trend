var camera, scene, renderer, videoTexture, video, controls;

var width = 2048;
var height = 1028;

function init(v) {

    var container, mesh;

    container = document.getElementById( 'container' );
    video = v;

    camera = new THREE.PerspectiveCamera( 75, width/height, 1, 1100 );
    camera.target = new THREE.Vector3( 0, 0, 0 );
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry( 500, 60, 40 );
    geometry.scale( - 1, 1, 1 );

	videoTexture = new THREE.VideoTexture( video );
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;    

    var material = new THREE.MeshBasicMaterial( {
        map: videoTexture, overdraw: true
    } );

    mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);

    window.addEventListener( 'resize', onWindowResize, false );
    onWindowResize();
}

function onWindowResize() {
    var container = $('#container');

    camera.aspect = container.width()/container.height();
    camera.updateProjectionMatrix();

    renderer.setSize( container.width(), container.height() );
}

function animate() {

    requestAnimationFrame( animate );
    controls.update();
    render();

}

function render() {
    renderer.render( scene, camera );

}

$('#btnMaximize').click(function() {
    $('#container').toggleClass('maximize');
    onWindowResize();
});
