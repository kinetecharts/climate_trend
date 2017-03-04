"use strict";

const Parameters = ['temperature', 'co2', 'ice', 'balance', 'precipitation']

let backgroundColor = 0x101025

var mouseX = 0, mouseY = 0;

window.__ = _.noConflict();

const numData = 451

const chartRange={
	x:[1800, 2300],
	y:[12, 25],
	z:[0, 10]
}

const chartScale=[1.5,1,1]

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
let dataFiles = ['data/rcp8p5.csv', 'data/rcp2p6.csv']
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

var morph = (r0, r1)=>{
	var param = {r: r0}
	var t = new TWEEN.Tween(param)
	.to({r: r1}, 4000)
	.onUpdate(()=>{
		setActiveData(_data, param.r)
	})
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start()
}

var good = ()=>{
	morph(1, 0)
}

var bad = ()=>{
	morph(0, 1)
}

var loop = ()=>{
	setTimeout(()=>{
		good()
	}, 1000)
	setTimeout(()=>{
		bad()
	}, 6000)
}

setInterval(()=>{
	loop()
}, 10000)

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
      divide: 4,
      origin: [1800, 12, 0, 0],
      axis: "x"
    })
    .ticks({
      classes: ['foo', 'bar'],
      width: 2
    })
    .text({
    	live: false,
    	data: interpolate(1800, 2300, xticks)
    })
    .label({
    	color: colors.x,
    	background: backgroundColor
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
      data: [[2330,origin.y,origin.z], [1800,25,0], [1800,12,10]],
      channels: 3, // necessary
      live: false,
    }).text({
      data: ["year", "y", "z"],
    }).label({
      color: colors.x,
      background: backgroundColor
    });		

}

var drawGrid = (view, origin)=>{
	const lineWidth = 1
	const alpha = 0.3
	view.grid({
		axes: "xy",
		divideX: 3,
		divideY: 3,
		width: lineWidth,
		opacity: alpha,
		color: 0xffaa44
	})

	view.transform({position:[0, 0, 10]})
	.grid({
		axes: "xy",
		divideX: 3,
		divideY: 3,
		width: lineWidth,
		opacity: alpha,
		color: 0x00ff00
	})


	view
	.transform({
		position:[0, origin.y, origin.z]
	})
	.grid({
		axes: "zx",
		divideX: 3,
		divideY: 3,
		width: lineWidth
	})

	view
	.transform({
		position:[2300, 0, origin.z]
	})
	.grid({
		axes: "yz",
		divideX: 3,
		divideY: 3,
		width: lineWidth
	})
}




var draw=(datas)=>{
	var data = datas.active
	// debugger
	var mathbox = mathBox({
	  plugins: ['VR', 'ui', 'core', 'controls', 'cursor', 'stats'],
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

	// Mathbox view
	var view = mathbox.cartesian({
	  range: [chartRange.x, chartRange.y, chartRange.z],
	  scale: chartScale,
	});

    var camera = view.camera({
      lookAt: [0, 0, 0],
    }, {
      position: function (t) { 
      	var _t = 0.1*t
      	return [-3 * Math.cos(_t), .4 * Math.cos(_t * .381), -3 * Math.sin(_t)]
      	.map(x=>{return 1.5*x + 1}) 
      },
    });

	var origin = {x: chartRange.x[0], y: chartRange.y[0], z: chartRange.z[0]}

	drawAxis(view, origin)
	drawGrid(view, origin)

	// color gradient for temperature curve
	view.interval({
		id:'tColor',
		width: numData,
		channels: 4,
		items: 1,
		live: true,
		expr: (emit, x, i, t)=>{
			var min = 13
			var max = 23
			var val = _data.active.temperature[i]

			var r0 = 1 - (val-min) / (max-min)
			var r1 = 1 - r0
			// var r0 = 1-i/numData
			// var r1 = i/numData
			var c0 = [0.2, 1, 0.2] // Green
			var c1 = [1, 0.2, 0.2] // Red
			emit(r0*c0[0]+r1*c1[0], 
				r0*c0[1]+r1*c1[1],
				r0*c0[2]+r1*c1[2], Math.sin(t)*Math.sin(t/1) + 0.3)
		}
	})

	// depreciated
	var plotLineDepreciated=(id, _data, yRange, color, colors)=>{
		var data = _.zip(_data.year, _data[id], _data.year.map(()=>{return 0}))
		var view = mathbox.cartesian({
		  range: [[1800, 2300], yRange, [0, 10]],
		  scale: [1.5, 1, 1],
		});

		view.array({
		  id: id,
		  width: numData,
		  data: data,
		  items: 1,
		  channels: 3,
		  live: true
		}).line({
			color: color,
			colors: colors || null,
			width: 5
		})
	}


	var plotLine = (id, yRange, z_offset, color, colors)=>{
		var chart = new Chart(mathbox, {
			x : data.year,
			y : data[id],
			z_offset : z_offset,
			id : id,
			xRange : chartRange.x,
			yRange : yRange,
			zRrange : chartRange.z,
			scale : chartScale,
			color : color,
			colors : colors
		})
		return chart
	}

	var charts={}
	charts['temperature'] = plotLine('temperature', [12, 25],  0, 0xffcc44, '#tColor')
	charts['co2'] 		 = plotLine('co2', 			[0, 4000], 2.5,  0xffff00, null)
	charts['ice'] 		 = plotLine('ice', [0, 30], 5, 0xffffff, null)
	charts['balance']		= plotLine('balance', [0, 10], 7.5, 0x00ffff, null)
	charts['precipitation'] = plotLine('precipitation', [0.00003, 0.00005], 10,  0x00ff00, null)

	three.on('update', ()=>{
		TWEEN.update()

		Object.keys(charts).forEach(id=>{
			charts[id].update(data[id])
		})

	})
}