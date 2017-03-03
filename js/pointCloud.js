
// with CPU, 500,000 points => 50fps, 400,000 points => 60fps
// with GPU, 10,000,000 points => 50fps, 8,000,000 points => 60fps

const RootObj={
	nodeSizeScale : 10
}

var hideOutPosition = new THREE.Vector3(0,0,0)
var hideOutColor = new THREE.Color(0xFF0000)
var hideOutSize = 0

var randomInRange = (xmin, xmax)=>{
	return Math.random()*(xmax-xmin) + xmin
}

const ParamScales={
	Temperature: 10,
	Precipitation: 10000000,
	CO2Concentration: 0.1,
	SeaIceFraction: 10
}

const ParamShiftX={
	Temperature: -30,
	Precipitation: -10,
	CO2Concentration: 10,
	SeaIceFraction: 30
}

const ParamColors = {
	Temperature: 0xff0000,
	Precipitation: 0x00ff00,
	CO2Concentration: 0xaaaa00,
	SeaIceFraction: 0xffffff	
}


class PointCloud{
	constructor(scene, maxNumNode, type){
		this.type = type
		this.maxNumNode = maxNumNode
		this.scene = scene
		this.pcPositions = new Float32Array( this.maxNumNode * 3 )
		this.pcColors = new Float32Array( this.maxNumNode * 3 )
		this.ringColors = new Float32Array(this.maxNumNode*3)

		this.year = new Float32Array(this.maxNumNode)
		this.temperature = new Float32Array(this.maxNumNode)
		this.precipitation = new Float32Array(this.maxNumNode)
		this.seaIceFraction = new Float32Array(this.maxNumNode)
		this.cO2Concentration = new Float32Array(this.maxNumNode)

		this.alpha = new Float32Array(this.maxNumNode)
		this.pcSizes = new Float32Array( this.maxNumNode )		
		this.points = null
		this.numNode = 0
		this.nodePerLine = 40

		this.data = null
		this.init()

		this.loadData()
			.then(d=>{
				return this.setData(this.interpolateData(d, 2))
				// return this.setData(d)
			})
			.catch(err=>{console.log(err)})
			.done()

		// this.init()
	}

	loadData(){
		var deferred = Q.defer()
		$.get('data/rcp8p5.csv', d=>{
			var res = Papa.parse(d, {header : true, skipEmptyLines: true, dynamicTyping: true})
			this.data = res.data
			deferred.resolve(res.data)
		})

		return deferred.promise
	}

	interpolate(data, step){
		var orgCnt = data.length
		var targetCnt = (orgCnt-1) * step + 1
		var res = []
		for(var i=0; i<targetCnt-1; i++){
			var p0 = ~~(i/step);
			var p1 = p0+1
			var ratio = (i%step)/step
			res.push(data[p0] * (1-ratio) + data[p1] * ratio)
		}
		res.push(data[orgCnt-1])

		return res
	}

	interpolateData(din, step) {
		var orgCnt = din.length
		var targetCnt = (orgCnt-1) * step + 1
		var res = []
		for(var i=0; i<targetCnt-1; i++){
			var p0 = ~~(i/step);
			var p1 = p0+1
			var ratio = (i%step)/step
			var d0=din[p0]
			var d1=din[p1]

			var d={
				year: d0.year * (1-ratio) + d1.year *ratio,
				Temperature: d0.Temperature * (1-ratio) + d1.Temperature *ratio,
				Precipitation: d0.Precipitation * (1-ratio) + d1.Precipitation *ratio,
				SeaIceFraction: d0.SeaIceFraction * (1-ratio) + d1.SeaIceFraction *ratio,
				CO2Concentration: d0.CO2Concentration * (1-ratio) + d1.CO2Concentration *ratio
			}

			res.push(d)
		}
		res.push(din[orgCnt-1])

		return res
	}

	setData(data){
		console.log("setting data")

		var attributes = this.pcGeometry.attributes;
		this.numNode = data.length

	    for(var i=0; i<this.numNode; i++){

	    	var z = data[i].year - 2000

	    	var y=(data[i][this.type] - data[0][this.type] ) * ParamScales[this.type]

	    	// var y = (data[i].Temperature -data[0].Temperature) * 10
	    	// var y = (data[i].Precipitation -data[0].Precipitation) * 10000000.0
	    	// var y = (data[i].CO2Concentration - data[0].CO2Concentration ) / 10
	    	// var y = (data[i].SeaIceFraction - data[0].SeaIceFraction ) * 10
	    	
	    	for(var w=0; w<this.nodePerLine; w++){
		    	
		    	var x = (w - this.nodePerLine/2) / 3.0 + ParamShiftX[this.type]
				
				var idx = w + i * this.nodePerLine

				attributes.position.array[3*idx] = x
				attributes.position.array[3*idx + 1] = y
				attributes.position.array[3*idx + 2] = z

				attributes.year.array[idx] = data[i].year
				attributes.temperature.array[idx] = data[i].temperature
				attributes.precipitation.array[idx] = data[i].precipitation
				attributes.seaIceFraction.array[idx] = data[i].seaIceFraction
				attributes.cO2Concentration.array[idx] = data[i].cO2Concentration

	    	}

		}		

		attributes.position.needsUpdate = true;
		attributes.position.temperature = true;
		attributes.position.precipitation = true;
		attributes.position.seaIceFraction = true;
		attributes.position.cO2Concentration = true;

		this.pcGeometry.verticesNeedUpdate = true
		console.log(`total points: ${this.numNode*this.nodePerLine}`)
	}

	init(){
	    for(var i=0; i<this.maxNumNode; i++){
	    	// var z =  1.0 *   ~(i/100) / 10.0 + 300
	    	// var y = Math.sin(z/10) * 10 - 0.1 * z
	    	// var x = ((i%100) - 50)/10
	    	// var vertex = new THREE.Vector3(x, y, z);
			var r=10
			var vertex = new THREE.Vector3(randomInRange(-r, r),
				randomInRange(-r, r),randomInRange(-r, r));
			vertex.toArray(this.pcPositions, i*3);
			var pcColor = new THREE.Color(ParamColors[this.type]); //0xff660e for external
			pcColor.toArray(this.pcColors, i*3);
			var ringColor = new THREE.Color(ParamColors[this.type])
			ringColor.toArray(this.ringColors, i*3)
			this.alpha[i] = 1
			this.pcSizes[i] = 1;
		}

		this.pcGeometry = new THREE.BufferGeometry();
		this.pcGeometry.addAttribute('position', new THREE.BufferAttribute(this.pcPositions, 3 ));
		this.pcGeometry.addAttribute('customColor', new THREE.BufferAttribute(this.pcColors, 3 ));
		this.pcGeometry.addAttribute('ringColor', new THREE.BufferAttribute(this.ringColors, 3 ));

		this.pcGeometry.addAttribute('year', new THREE.BufferAttribute(this.year, 1 ));
		this.pcGeometry.addAttribute('temperature', new THREE.BufferAttribute(this.temperature, 1 ));
		this.pcGeometry.addAttribute('precipitation', new THREE.BufferAttribute(this.precipitation, 1 ));
		this.pcGeometry.addAttribute('seaIceFraction', new THREE.BufferAttribute(this.seaIceFraction, 1 ));
		this.pcGeometry.addAttribute('cO2Concentration', new THREE.BufferAttribute(this.cO2Concentration, 1 ));


		this.pcGeometry.addAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1 ));
		this.pcGeometry.addAttribute('size', new THREE.BufferAttribute(this.pcSizes, 1 ));
      
		var pcMaterial = new THREE.ShaderMaterial( {
			uniforms: {
				color:   { type: "c", value: new THREE.Color( 0xffffff ) },
				t: {type: "f", value: 0}
				// texture: { type: "t", value: new THREE.TextureLoader().load( "images/disc.png" ) }
			},
			vertexShader: SHADERS.point.vertex,
			fragmentShader: SHADERS.point.fragment,
			transparent: true,
			alphaTest: 0.1
		} );

		this.pcGeometry.computeBoundingSphere()
		this.pcGeometry.boundingSphere.radius = 10000000 // allow raytracer to active
		this.points = new THREE.Points(this.pcGeometry, pcMaterial);
		this.points.frustumCulled = false;
		window.points = this.points;
		this.points.visible = true;
		this.scene.add(this.points);

		// shift nodes up to force it on top of edges, remove this for 3D
		//if(RootObj.graphLayout.force2d)
		//	this.setZ(RootObj.scene.cameraInitPositionZ)
		this.setZ(300);
			// this.points.position.set(0, 0, 1.0)
	}
	// move nodes up so edges is always under, this should be removed for 3D render
	setZ(cameraZ){
		var z = 1e-5*(1.0+cameraZ*cameraZ)
		z = Math.min(z, cameraZ/10.0)
		//if(RootObj.graphLayout.force2d){
			// console.log("node cloud moves to ", z)
			this.points.position.set(0,0,z)
		//}
	}

	clear(){
		this.clearNodes(0, this.numNode)
	}

	clearNodes(from, to){
		var attributes = this.pcGeometry.attributes;
		// debugger
		for(var i=from; i< to; i++){
			attributes.position.array[3*i]=hideOutPosition.x;
			attributes.position.array[3*i+1]=hideOutPosition.y;//(n.position.y/18)+0.95;
			attributes.position.array[3*i+2]=hideOutPosition.z;

			attributes.size.array[i] = hideOutSize
		    // We use node color to simplify it

		    attributes.customColor.array[3*i]=hideOutColor.r
		    attributes.customColor.array[3*i+1]=hideOutColor.g
		    attributes.customColor.array[3*i+2]=hideOutColor.b
		}
		attributes.position.needsUpdate = true;
		attributes.size.needsUpdate = true;
		attributes.customColor.needsUpdate = true;

		this.pcGeometry.verticesNeedUpdate = true;
	}

	updatePoints(t){
		this.points.material.uniforms.t.value = t;
	}

}