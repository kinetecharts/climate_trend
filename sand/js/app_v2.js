"use strict";

var gss = null;

var qstr = location.search.substring(1);
var qsObj = {};
if (qstr) {
    try {
	qsObj = JSON.parse('{"' + decodeURI(qstr).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
    }
    catch (e) {
	alert("Bad query string in URL");
    }
}

function getParameter(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

//for (var key in params) {
console.log("------------------------------------");
for (var key in qsObj) {
    var str = qsObj[key];
    console.log(" "+key+": "+str);
    //var str = getParameter(key);
    if (str) {
	if (params[key] == null) {
	    alert("Bad param "+key);
	}
	try {
	    params[key] = eval(str);
	}
	catch(e) {
	    alert("Bad element in query string: "+str);
	}
    }
}
console.log("------------------------------------");

const Parameters = ['temperature', 'co2', 'ice', 'balance', 'precipitation']

const PreIndustrial = {
	temperature : 13.36,
	ice: 7.78,
	co2: 284.7,
	balance: 0,
	precipitation: 3.38E-05
}

//let config.colors.bg = 0x101025
//let config.colors.bg = 0x303025

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

// var colors = {
//   x: new THREE.Color(0xFF4136),
//   y: new THREE.Color(0x2ECC40),
//   z: new THREE.Color(0x0074D9)
// };

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
	.then(d=>{
		var numPasses = 5
		for(var i=0; i<numPasses; i++){
			d=smoothEnergyBalance(d)
		}
		return d
	})
	.then(d=>{
		//draw(d)
		resetApp();
	})
	.fail(err=>{
		console.log(err)
	})

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
	  color: new THREE.Color(params.colors.x),
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
    	background: params.colors.bg,
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
	  color: new THREE.Color(params.colors.y),
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
	  color: new THREE.Color(params.colors.z),
	  opacity: .5,
	});

	// XyZ labela
    view.array({
      id: "colors",
      live: false,
      data: [new THREE.Color(params.colors.x), new THREE.Color(params.colors.y), new THREE.Color(params.colors.z)].map(function (color){
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
      background: params.colors.bg,
      size: 48,
      depth: 1
    });		

}

var drawGrid = (view, origin)=>{
	//const lineWidth = 1
	const lineWidth = params.gridLineWidth
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

function resetApp() {
	stopHistory();
	$(document.body).css({'backgroundColor': params.colors.bg});
	$('canvas').remove();

    (params.showPanel) ? $('#panel').show() : $('#panel').hide();
    (params.showVideo) ? $('#bgvideo').show() : $('#bgvideo').hide();

	// if (window.three && three.Loop && three.Loop.running) {
	try {
		three.Loop.stop();
	} catch(e) {

	}
	// }
	draw(window._data);
	runEvents(events_normal);
}

var draw=(datas)=>{

	var mathbox = mathBox({
		plugins: ['core', 'mathbox', 'controls', 'cursor'],
	controls: {
		klass: THREE.OrbitControls
	},
	});

	window._m = mathbox

	// set global scene to be used by three.js inspector
	window.scene = mathbox.three.scene;

	window.three = mathbox.three;

	three.camera.position.set(-3.5, .4, 1.3);

	three.renderer.setClearColor(new THREE.Color(params.colors.bg), 1.0);

	window.cameraControl = new CameraControl(three.controls, chartScale)

	cameraControl.home();

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
			if (x > Year) a *= 0.0
			emit(r, g, b, a) // make it blink alarm at high temperature
		}
	})

	// line alpha for co2 and balance curve
	// controlling part of line this is visible to creating years marching forward effect
	view.interval({
		id:'lineAlpha',
		width: numData,
		channels: 4,
		items: 1,
		live: true,
		expr: (emit, x, i, t)=>{
			var a = x > Year ? 0.0 : 1.0
			emit(1, 1, 1, a) // make it blink alarm at high temperature
		}
	})


	if(!params.hideLegend){
		// Draw year label
	    view.array({
	    	id: 'label-year',
			data: [[
				0.0 * chartRange.x[0] + 1.0 * chartRange.x[1], 
				1.3 * chartRange.y[1] + (-0.3) * chartRange.y[0],
				chartRange.z[0]
			]],
			channels: 3, // necessary
			live: true,
	    }).text({
	    	id: 'label-year-text',
	      data: ['Year'],
	    }).label({
	      color: 0xffffff,
	      background: params.colors.bg,
	      size: 36*3,
	      depth: 1
	    });		

	    var labelYearText = mathbox.select("#label-year-text")
	}


	var charts={}
	charts['temperature'] = new Chart(mathbox, {
		x : data.year,
		y : data['temperature'],
		z_offset : -10,
		id : 'temperature',
		xRange : chartRange.x,
		yRange : [12, 24],
		zRrange : chartRange.z,
		scale : chartScale,
		// color : 0xffcc44,
		color : 0xffffff,
		dotColor : 0x44bbff,
	        colors : '#tempratureColor',
	        //labelSize : labelSize,
	        lineWidth : params.tempLineWidth,
		labelFunc: (year, val)=>{
		    //return [''+year+': '+val+'\u2103 increase']
		    //var str = val+'\u2103 increase';
		    var str = val+'\u2103';
		    $("#tempVal").html(""+val+"&deg;C");
		    return [str]
		}
	})
	charts['co2'] = new Chart(mathbox, {
		x : data.year,
		y : data['co2'],
		z_offset : 0,
		id : 'co2',
		xRange : chartRange.x,
		yRange : [0, 2200],
		zRrange : chartRange.z,
		scale : chartScale,
		color : 0xaf8f30,
		colors : '#lineAlpha',
	        lineWidth : params.co2LineWidth,
	        //labelSize : labelSize,
		labelFunc: (year, val)=>{
			//return [''+year+': '+val+'PPM increase']
		    //var str = val+'PPM increase';
		    var str = val+'PPM';
		    $("#co2Val").html(str);
		    return [str];
		}
	})
	charts['balance'] = new Chart(mathbox, {
		x : data.year,
		y : data['balance'],
		z_offset : -5,
		id : 'balance',
		xRange : chartRange.x,
		yRange : [-1, 8],
		zRrange : chartRange.z,
		scale : chartScale,
		//color : 0x00ffff,
		color : 0x02ff7f,
		colors : '#lineAlpha',
	        //labelSize : labelSize,
	        lineWidth: params.balanceLineWidth,
		labelFunc: (year, val)=>{
		    //return [''+year+': '+val+' energy balance']
		    //str = val + 'balance';
		    str = ''+val;
		    $("#energyVal").html(str);
		    return [str];
		}
	})

	// charts['ice'] 		 = plotLine('ice', [0, 10], 6.6, 0xffffff, null)
	// charts['precipitation'] = plotLine('precipitation', [0.000032, 0.00004], 10,  0x00ff00, null)

	var sands = new Sands(mathbox, {
			x : data.year,
			y : data['temperature'],
			z_offset : -10,
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

                if (gss) {
	            var narrative = gss.getFieldByYear(Year, 'eventsinvideo');
		    //console.log("year: "+Year+"  narrative: "+narrative);
		    $("#narrativeText").html(narrative);
		}
	        //if(!params.hideLegend)
			//labelYearText.set('data', [Year])
		if (labelYearText)
			labelYearText.set('data', [''])
	})
}
