/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

CLOTH = {};

CLOTH.cloths = [];
CLOTH.DAMPING = 0.03;
CLOTH.DRAG = 1 - CLOTH.DAMPING;
CLOTH.MASS = .1;
CLOTH.restDistance = 25;

CLOTH.xSegs = 10; //
CLOTH.ySegs = 10; //

CLOTH.GRAVITY = 981 * 1.4; // 
CLOTH.TIMESTEP = 18 / 1000;
CLOTH.TIMESTEP_SQ = CLOTH.TIMESTEP * CLOTH.TIMESTEP;

CLOTH.wind = true;
CLOTH.windStrength = 2;
CLOTH.windForce = new THREE.Vector3( 0, 0, 0 );
CLOTH.ballPosition = new THREE.Vector3( 0, - 45, 0 );
CLOTH.ballSize = 60; //40
CLOTH.tmpForce = new THREE.Vector3();

var CLOTH_MAT;
//var clothGeometry;

CLOTH.update = function(time)
{
    for (var i=0; i<CLOTH.cloths.length; i++) {
	var cloth = CLOTH.cloths[i];
	cloth.update(time);
	cloth.updateCloth(time);
    }
}

CLOTH.plane = function( width, height ) {

	return function( u, v ) {

		var x = ( u - 0.5 ) * width;
		var y = ( v + 0.5 ) * height;
		var z = 0;

		return new THREE.Vector3( x, y, z );

	};

}

CLOTH.clothFunction = CLOTH.plane( CLOTH.restDistance * CLOTH.xSegs, CLOTH.restDistance * CLOTH.ySegs );

function Particle( x, y, z, mass ) {

	this.position = CLOTH.clothFunction( x, y ); // position
	this.previous = CLOTH.clothFunction( x, y ); // previous
	this.original = CLOTH.clothFunction( x, y ); 
	this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();

}

// Force -> Acceleration
Particle.prototype.addForce = function( force ) {

	this.a.add(
		this.tmp2.copy( force ).multiplyScalar( this.invMass )
	);

};


// Performs verlet integration
Particle.prototype.integrate = function( timesq ) {

	var newPos = this.tmp.subVectors( this.position, this.previous );
	newPos.multiplyScalar( CLOTH.DRAG ).add( this.position );
	newPos.add( this.a.multiplyScalar( timesq ) );

	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;

	this.a.set( 0, 0, 0 );

};


CLOTH.diff = new THREE.Vector3();

function satisifyConstrains( p1, p2, distance )
{
    var diff = CLOTH.diff;
    diff.subVectors( p2.position, p1.position );
    var currentDist = diff.length();
    if ( currentDist == 0 ) return; // prevents division by 0
    var correction = diff.multiplyScalar( 1 - distance / currentDist );
    var correctionHalf = correction.multiplyScalar( 0.5 );
    p1.position.add( correctionHalf );
    p2.position.sub( correctionHalf );
}


function Cloth( w, h ) {

        this.gravity = new THREE.Vector3( 0, - CLOTH.GRAVITY, 0 ).multiplyScalar( CLOTH.MASS );
        this.lastTime = null;
    CLOTH.cloths.push(this);
	w = w || 10;
	h = h || 10;
	this.w = w;
	this.h = h;

	var particles = [];
	var constrains = [];

	var u, v;

	// Create particles
	for ( v = 0; v <= h; v ++ ) {

		for ( u = 0; u <= w; u ++ ) {

			particles.push(
				new Particle( u / w, v / h, 0, CLOTH.MASS )
			);

		}

	}

	// Structural

	for ( v = 0; v < h; v ++ ) {

		for ( u = 0; u < w; u ++ ) {

			constrains.push( [
				particles[ index( u, v ) ],
				particles[ index( u, v + 1 ) ],
				CLOTH.restDistance
			] );

			constrains.push( [
				particles[ index( u, v ) ],
				particles[ index( u + 1, v ) ],
				CLOTH.restDistance
			] );

		}

	}

	for ( u = w, v = 0; v < h; v ++ ) {

		constrains.push( [
			particles[ index( u, v ) ],
			particles[ index( u, v + 1 ) ],
			CLOTH.restDistance

		] );

	}

	for ( v = h, u = 0; u < w; u ++ ) {

		constrains.push( [
			particles[ index( u, v ) ],
			particles[ index( u + 1, v ) ],
			CLOTH.restDistance
		] );

	}


	// While many system uses shear and bend springs,
	// the relax constrains model seem to be just fine
	// using structural springs.
	// Shear
	// var diagonalDist = Math.sqrt(restDistance * restDistance * 2);


	// for (v=0;v<h;v++) {
	// 	for (u=0;u<w;u++) {

	// 		constrains.push([
	// 			particles[index(u, v)],
	// 			particles[index(u+1, v+1)],
	// 			diagonalDist
	// 		]);

	// 		constrains.push([
	// 			particles[index(u+1, v)],
	// 			particles[index(u, v+1)],
	// 			diagonalDist
	// 		]);

	// 	}
	// }


	this.particles = particles;
	this.constrains = constrains;
        this.setupPins();
	function index( u, v ) {

		return u + v * ( w + 1 );

	}

	this.index = index;

        this.updateCloth = function()
        {
	    var cloth = this;
	    var p = cloth.particles;
	    var clothGeometry = this.clothGeometry;

	    for ( var i = 0, il = p.length; i < il; i ++ ) {
		clothGeometry.vertices[ i ].copy( p[ i ].position );
	    }
	    clothGeometry.computeFaceNormals();
	    clothGeometry.computeVertexNormals();

	    clothGeometry.normalsNeedUpdate = true;
	    clothGeometry.verticesNeedUpdate = true;
	}
    
}

Cloth.prototype.update = function( time )
{
    if (time == null)
	time = Date.now();

    CLOTH.windStrength = Math.cos( time / 7000 ) * 20 + 40;
    CLOTH.windForce.set( Math.sin( time / 2000 ),
			 Math.cos( time / 3000 ),
			 Math.sin( time / 1000 ) ).normalize().multiplyScalar( CLOTH.windStrength );
    //arrow.setLength( windStrength );
    //arrow.setDirection( windForce );
    
    if ( ! this.lastTime ) {
	this.lastTime = time;
	return;
    }
	
    var i, il, particles, particle, pt, constrains, constrain;

    // Aerodynamics forces
    if ( CLOTH.wind ) {
	var face, faces = this.clothGeometry.faces, normal;
	particles = cloth.particles;
	var tmpForce = CLOTH.tmpForce;
	for ( i = 0, il = faces.length; i < il; i ++ ) {
	    face = faces[ i ];
	    normal = face.normal;
	    tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( CLOTH.windForce ) );
	    particles[ face.a ].addForce( tmpForce );
	    particles[ face.b ].addForce( tmpForce );
	    particles[ face.c ].addForce( tmpForce );
	}
    }
	
    for ( particles = cloth.particles, i = 0, il = particles.length
	  ; i < il; i ++ ) {
	particle = particles[ i ];
	particle.addForce( this.gravity );
	particle.integrate( CLOTH.TIMESTEP_SQ );
    }

	// Start Constrains

    constrains = cloth.constrains,
    il = constrains.length;
    for ( i = 0; i < il; i ++ ) {
	constrain = constrains[ i ];
	satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ] );
    }

    // Ball Constrains
    CLOTH.ballPosition.z = - Math.sin( Date.now() / 600 ) * 90 ; //+ 40;
    CLOTH.ballPosition.x = Math.cos( Date.now() / 400 ) * 70;

/*
	if ( sphere && sphere.visible )
	for ( particles = cloth.particles, i = 0, il = particles.length
			; i < il; i ++ ) {

		particle = particles[ i ];
		pos = particle.position;
		diff.subVectors( pos, ballPosition );
		if ( diff.length() < ballSize ) {

			// collided
			diff.normalize().multiplyScalar( ballSize );
			pos.copy( ballPosition ).add( diff );

		}

	}
*/
    // Floor Constains
    for ( particles = cloth.particles, i = 0, il = particles.length
	  ; i < il; i ++ ) {

	particle = particles[ i ];
	pos = particle.position;
	if ( pos.y < - 250 ) {
	    pos.y = - 250;
	}
    }

    // Pin Constrains
    var pins = this.pins;
    for ( i = 0, il = pins.length; i < il; i ++ ) {
	var xy = pins[ i ];
	var p = particles[ xy ];
	p.position.copy( p.original );
	p.previous.copy( p.original );
    }
}


Cloth.prototype.setupPins = function()
{
    var pinsFormation = [];
    var pins = [6];

    pinsFormation.push( pins );
    pins = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    pinsFormation.push( pins );
    pins = [ 0 ];
    pinsFormation.push( pins );
    pins = []; // cut the rope ;)
    pinsFormation.push( pins );
//			pins = [ 0, cloth.w ]; // classic 2 pins
//			pinsFormation.push( pins );
    this.pinsFormation = pinsFormation;
    this.pins = pinsFormation[ 1 ];
}

Cloth.prototype.togglePins = function() {
    report("togglePins");
    this.pins = this.pinsFormation[ ~~( Math.random() * this.pinsFormation.length ) ];
}

Cloth.prototype.toggleWind = function() {
    report("toggleWind");
    CLOTH.wind = !CLOTH.wind;
}

Cloth.prototype.setupCloth = function(scene)
{
    // cloth material

    //var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/circuit_pattern.png' );
    //var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/lace1.png' );
    var clothTexture = THREE.ImageUtils.loadTexture( 'models/textures/patterns/paisley1.jpg' );
    clothTexture = videoTexture;
    //clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.wrapS = clothTexture.wrapT = THREE.ClampToEdgeWrapping;
    //clothTexture.anisotropy = 16;

    var clothMaterial = new THREE.MeshPhongMaterial( { alphaTest: 0.5, color: 0xffffff, specular: 0x030303, emissive: 0x111111, shiness: 10, map: clothTexture, side: THREE.DoubleSide } );
    CLOTH_MAT = clothMaterial;
    this.clothMaterial = clothMaterial;
    // cloth geometry
    var clothGeometry = new THREE.ParametricGeometry( CLOTH.clothFunction, cloth.w, cloth.h );
    clothGeometry.dynamic = true;
    clothGeometry.computeFaceNormals();
    this.clothGeometry = clothGeometry;
    
    var uniforms = { texture:  { type: "t", value: clothTexture } };
    var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

    // cloth mesh

    object = new THREE.Mesh( this.clothGeometry, this.clothMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );
    //object.customDepthMaterial = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );
    return object;
}

