"use strict";

const Parameters = ['temperature', 'co2', 'ice', 'balance', 'precipitation']

const PreIndustrial = {
	temperature : 13.36,
	ice: 7.78,
	co2: 284.7,
	balance: 0,
	precipitation: 3.38E-05
}

let backgroundColor = 0x101025

var mouseX = 0, mouseY = 0;

window.__ = _.noConflict();

const numData = 451

const chartRange={
	x:[1850, 2300],
	y:[12, 24],
	z:[-5, 5]
}


var Year = 1850
var SandYear = 1850

const chartScale=[1.5,1,1.5]

var loadData=(file)=>{
	var deferred = Q.defer()
	$.get(file, d=>{
		var res = Papa.parse(d, {header : true, skipEmptyLines: true, dynamicTyping: true})
		var formated = res.data
		window._d = formated
		deferred.resolve(formated)
	})

	return deferred.promise
}

var colors = {
  x: new THREE.Color(0xFF4136),
  y: new THREE.Color(0x2ECC40),
  z: new THREE.Color(0x0074D9)
};

// loadData('data/rcp8p5.csv')
let dataFiles = ['../data/rcp8p5.csv', '../data/rcp2p6.csv']
Q.all(dataFiles.map(f=>{return loadData(f)}))
	.then(data=>{
		console.log("done data loading")
		var _data = {
			'rcp8p5': processData(data[0], numData),
			'rcp2p6': processData(data[1], numData),
			'active': processData(data[0], numData)
		}
		window._data = _data
		return _data
	})
	.then(d=>{return draw(d)})
	.fail(err=>{
		console.log(err)
	})

var interpolate = (lo, hi, n) => {
  n--; // go to end of range
  var vals = [];
  for (var i = 0; i <= n; i++){
    vals.push(Math.round(10 * (lo + (hi - lo)*(i/n)))/10);
  }
  return vals;
}

var processData = (_d, numData)=>{
	var res={
		year: [],
		temperature: [],
		co2: [],
		ice: [],
		balance: [],
		precipitation: []
	}

	for (var i = 0; i < numData; i++) {
		res.year.push(_d[i].year)
		res.temperature.push(_d[i].Temperature)
		res.co2.push(_d[i].CO2Concentration)
		res.ice.push(_d[i].SeaIceFraction)
		res.balance.push(_d[i].EnergyBalance)
		res.precipitation.push(_d[i].Precipitation)
	}	
	return(res)
}

// set active = r*rcp8.5 + (1-r)*rcp2.6
var setActiveData = (data, r) =>{
	for(var i=0; i<numData; i++){
		Parameters.forEach(p=>{
			data.active[p][i] = data.rcp8p5[p][i] * r + data.rcp2p6[p][i] * (1.0-r)
		})
	}
}

var drawAxis = (view, origin)=>{
    var xticks = 6

    // X axis
	view
	.transform({
		position:[0, origin.y, origin.z]
	})
	.axis({
	  axis: "x", // year
	  end: true,
	  width: 6,
	  depth: 1,
	  color: colors.x,
	  opacity: 1.0,
	})
	
	view.scale({
      divide: 5,
      nice: false,
      origin: [1850, 12, 0, 0],
      axis: "x"
    })
    .ticks({
      classes: ['foo', 'bar'],
      width: 20
    })
    .text({
    	live: false,
    	data: interpolate(chartRange.x[0], chartRange.x[1], 6)
    })
    .label({
    	color: 0xaaaaaa,
    	background: backgroundColor,
    	size: 36,
    	snap: false,
    	depth: 1
    	// offset: [1,1]
    })

    // Y axis
	view.transform({
		position:[origin.x, 0, origin.z]
	})
	.axis({
	  axis: "y",
	  end: true,
	  width: 3,
	  depth: 1,
	  color: colors.y,
	  opacity: .5,
	})

	// Z axis
	view.transform({
		position: [origin.x, origin.y, ]
	})
	.axis({
	  axis: "z",
	  end: true,
	  width: 3,
	  depth: 1,
	  color: colors.z,
	  opacity: .5,
	});

	// XyZ labela
    view.array({
      id: "colors",
      live: false,
      data: [colors.x, colors.y, colors.z].map(function (color){
        return [color.r, color.g, color.b, 1];
      }),
    });

    view.array({
      data: [[2350,origin.y,origin.z], [1850,25,0], [1850,12,10]],
      channels: 3, // necessary
      live: false,
    }).text({
      data: ["year", "y", "z"],
    }).label({
      color: 0xaaaaaa,
      background: backgroundColor,
      size: 48,
      depth: 1
    });		

}

var drawGrid = (view, origin)=>{
	const lineWidth = 1
	const alpha = 0.3

	view
	.transform({
		position:[0, origin.y, origin.z]
	})
	.grid({
		axes: "zx",
		divideX: 4,
		divideY: 5,
		niceX: false,
		niceY: false,
		width: lineWidth
	})

	view
	.transform({
		position:[2300, 0, origin.z]
	})
	.grid({
		axes: "yz",
		divideX: 4,
		divideY: 4,
		niceX: false,
		niceY: false,
		width: lineWidth
	})
}

var mathbox = mathBox({
  plugins: ['core', 'controls', 'cursor', 'stats'],
  // plugins: ['VR', 'ui', 'controls'],
  controls: {
    klass: THREE.OrbitControls
    // klass: THREE.VRControls
  },
});

window._m = mathbox

var three = mathbox.three;

three.camera.position.set(-3.5, .4, 1.3);

three.renderer.setClearColor(new THREE.Color(backgroundColor), 1.0);


var draw=(datas)=>{
	var data = datas.active
	// debugger


	// Mathbox view
	var view = mathbox.cartesian({
	  range: [chartRange.x, chartRange.y, chartRange.z],
	  scale: chartScale,
	});

    // var camera = view.camera({
    //   lookAt: [0, 0, 0],
    // }, {
    //   position: function (t) { 
    //   	var _t = 0.1*t
    //   	return [-3 * Math.cos(_t), .4 * Math.cos(_t * .381), -3 * Math.sin(_t)]
    //   	.map(x=>{return 1.5*x + 1}) 
    //   },
    // });

	var origin = {x: chartRange.x[0], y: chartRange.y[0], z: chartRange.z[0]}

	// drawAxis(view, origin)
	drawGrid(view, origin)

	// color gradient for temperature curve
	view.interval({
		id:'tempratureColor',
		width: numData,
		channels: 4,
		items: 1,
		live: true,
		expr: (emit, x, i, t)=>{
			var min = 13
			var max = 23
			var val = _data.active.temperature[i]

			var r0 = 1 - (val-min) / (max-min) // Green percentage
			var r1 = 1 - r0

			var c0 = [0.1, 0.7, 1] // Blue
			var c1 = [1, 0.2, 0.1] // Red
			var r = r0*c0[0]+r1*c1[0]
			var g = r0*c0[1]+r1*c1[1]
			var b = r0*c0[2]+r1*c1[2]
			var a = 1.0-Math.pow(Math.sin(t*3), 16) + r0 + 0.2
			if (x > Year) a *= 0.1
			emit(r, g, b, a) // make it blink alarm at high temperature
		}
	})

	// color gradient for co2 curve
	view.interval({
		id:'co2Color',
		width: numData,
		channels: 4,
		items: 1,
		live: true,
		expr: (emit, x, i, t)=>{
			var a = x > Year ? 0.1 : 1.0
			emit(1, 1, 1, a) // make it blink alarm at high temperature
		}
	})

	var charts={}
	charts['temperature'] = new Chart(mathbox, {
		x : data.year,
		y : data['temperature'],
		z_offset : 0,
		id : 'temperature',
		xRange : chartRange.x,
		yRange : [12, 24],
		zRrange : chartRange.z,
		scale : chartScale,
		// color : 0xffcc44,
		color : 0xffffff,
		colors : '#tempratureColor',
		labelFunc: (year, val)=>{
			return [''+year+': '+val+'\u2103 increase']
		}
	})
	charts['co2'] = new Chart(mathbox, {
		x : data.year,
		y : data['co2'],
		z_offset : -5,
		id : 'co2',
		xRange : chartRange.x,
		yRange : [0, 2200],
		zRrange : chartRange.z,
		scale : chartScale,
		color : 0xaf8f30,
		colors : '#co2Color',
		labelFunc: (year, val)=>{
			return [''+year+': '+val+'PPM increase']
		}
	})
	charts['balance'] = new Chart(mathbox, {
		x : data.year,
		y : data['balance'],
		z_offset : -10,
		id : 'balance',
		xRange : chartRange.x,
		yRange : [-5, 10],
		zRrange : chartRange.z,
		scale : chartScale,
		color : 0x00ffff,
		colors : '#co2Color',
		lineWidth: 4,
		labelFunc: (year, val)=>{
			return [''+year+': '+val+' net balance']
		}
	})

	// charts['ice'] 		 = plotLine('ice', [0, 10], 6.6, 0xffffff, null)
	// charts['precipitation'] = plotLine('precipitation', [0.000032, 0.00004], 10,  0x00ff00, null)

	var sands = new Sands(mathbox, {
			x : data.year,
			y : data['temperature'],
			z_offset : 0,
			id : 'sands',
			xRange : chartRange.x,
			yRange : [12, 24],
			zRrange : chartRange.z,
			scale : chartScale,
			// color : 0xffcc44,
			color : 0xffffff,
			colors : '#tempratureColor'
	})

	three.on('update', ()=>{
		TWEEN.update()

		Object.keys(charts).forEach(id=>{
			charts[id].update(data[id])
		})
		sands.update(data['temperature'])

	})
}
