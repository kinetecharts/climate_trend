
STARS = {};

// convert the positions from a lat, lon to a position on a sphere.
// http://www.smartjava.org/content/render-open-data-3d-world-globe-threejs
STARS.latLonToVector3 = function(lat, lon, radius, height) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;
 
    var x = -(radius+height) * Math.cos(phi) * Math.cos(theta);
    var y =  (radius+height) * Math.sin(phi);
    var z =  (radius+height) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x,y,z);
}

STARS.Stars = function(group, radius, opts)
{
    radius = radius || 200;

    this.init = function() {
        this.name = "";
        if (opts && opts.name)
	    this.name = opts.name;
	this.radius = radius;
        this.loaded = false;
	this.group = group;
        var loader = new THREE.TextureLoader();
        //loader.load( 'textures/land_ocean_ice_cloud_2048.jpg', function ( texture ) {
        loader.load( 'textures/Stars_Tycho2_plus_Milkyway_3000.png', function ( texture ) {
            var geometry = new THREE.SphereGeometry( radius, 30, 30 );
            var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, side: THREE.DoubleSide } );
            this.mesh = new THREE.Mesh( geometry, material );
	    this.mesh.name = "Earth";
            group.add(this.mesh);
            this.loaded = true;
       });
    }

    this.latLonToVector3 = function(lat, lng, h) {
	if (!h)
	    h = 1;
        //report(""+this.name+" h: "+h+" r: "+this.radius);
	return STARS.latLonToVector3(lat, lng, this.radius, h);
    }

    this.getLocalGroup = function(lat, lon, h) {
	var localGroup = new THREE.Group();
	localGroup.position.copy(this.latLonToVector3(lat, lon, h));
	var phi = (90-lat)*Math.PI/180;
	var theta = (lon+90)*Math.PI/180;
	localGroup.rotation.set(phi, theta, 0, "YXZ");
	this.group.add(localGroup);
	return localGroup;
    }

    this.addObject = function(obj, lat, lon, h) {
        if (!h)
	    h = 0.02*this.radius;
	var lg = this.getLocalGroup(lat, lon, h);
	lg.add(obj);
	return lg;
    }

    this.addMarker = function(lat, lon) {
        var h = 0.004*this.radius;
        var geometry = new THREE.SphereGeometry( h, 20, 20 );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        var marker = new THREE.Mesh( geometry, material );
        return this.addObject(marker, lat, lon, h);
	var lg = this.getLocalGroup(lat, lon, h);
	/*
	var phi = (90-lat)*Math.PI/180;
	var theta = (lon+90)*Math.PI/180;
	lg.rotation.set(phi, theta, 0, "YXZ");
	*/
	lg.add(marker);
	//var axisHelper = new THREE.AxisHelper( 10*h );
	//lg.add( axisHelper );
	return lg;
    }

    this.init();
};

