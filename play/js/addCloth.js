
var pinsFormation = [];
var pins = [6];
var clothObj = null;

function addCloth()
{
    var scene = SCENE;
    var videoTexture = imageSrc.createTexture();
		 
    /* testing cloth simulation */


    pinsFormation.push( pins );

    pins = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    pinsFormation.push( pins );

    pins = [ 0 ];
    pinsFormation.push( pins );

    pins = []; // cut the rope ;)
    pinsFormation.push( pins );

    pins = [ 0, cloth.w ]; // classic 2 pins
    pinsFormation.push( pins );

    pins = pinsFormation[ 1 ];


    // cloth material

//				var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/circuit_pattern.png' );
//				var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/lace1.png' );
    var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/paisley1.jpg' );
    clothTexture = videoTexture;
    //clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.wrapS = clothTexture.wrapT = THREE.ClampToEdgeWrapping;
    //clothTexture.anisotropy = 16;

    var clothMaterial = new THREE.MeshPhongMaterial( { alphaTest: 0.5, color: 0xffffff, specular: 0x030303, emissive: 0x111111, shiness: 10, map: clothTexture, side: THREE.DoubleSide } );
    CLOTH_MAT = clothMaterial;
    // cloth geometry
    clothGeometry = new THREE.ParametricGeometry( clothFunction, cloth.w, cloth.h );
    clothGeometry.dynamic = true;
    clothGeometry.computeFaceNormals();
    
    var uniforms = { texture:  { type: "t", value: clothTexture } };
    var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

    // cloth mesh

    object = new THREE.Mesh( clothGeometry, clothMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );
    
    object.customDepthMaterial = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );
    clothObj = object;
    return object;
}


