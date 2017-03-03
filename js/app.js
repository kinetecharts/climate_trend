"use strict";

var mouseX = 0, mouseY = 0;

window.__ = _.noConflict();

const numData = 451

var loadData=()=>{
	var deferred = Q.defer()
	$.get('data/rcp8p5.csv', d=>{
		var res = Papa.parse(d, {header : true, skipEmptyLines: true, dynamicTyping: true})
		// var formated = res.data.map(d=>{
		// 	return[d.year, d.CO2Concentration, d.Temperature, d.Precipitation, d.SeaIceFraction]
		// })
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

loadData()
.then(d=>{return draw(d)})

var interpolate = (lo, hi, n) => {
  n--; // go to end of range
  var vals = [];
  for (var i = 0; i <= n; i++){
    vals.push(Math.round(10 * (lo + (hi - lo)*(i/n)))/10);
  }
  return vals;
}


var draw=(_d)=>{

	var mathbox = mathBox({
	  plugins: ['VR', 'ui', 'core', 'controls', 'cursor', 'stats'],
	  controls: {
	    klass: THREE.OrbitControls
	  },
	});
	var three = mathbox.three;

	three.camera.position.set(-3.5, .4, 1.3);
	three.renderer.setClearColor(new THREE.Color(0xa0a0ff), 1.0);
	// three.renderer.setClearColor(new THREE.Color(0x000000), 1.0);

	// Prepare test data
	var temperature = []
	var co2 = []
	var ice = []
	var balance = []
	var precipitation = []
	var drawColors = []
	for (var i = 0; i < numData; ++i) {
		temperature.push([_d[i].year, _d[i].Temperature, 0])
		co2.push([_d[i].year, _d[i].CO2Concentration, 2])
		ice.push([_d[i].year, _d[i].SeaIceFraction, 4])
		balance.push([_d[i].year, _d[i].EnergyBalance, 6])
		precipitation.push([_d[i].year, _d[i].Precipitation, 8])
		// drawColors.push(0xFFFFFF * (i/numData))
		drawColors.push([i/numData, i/numData, i/numData, 1])
	}

	// Mathbox view
	var view = mathbox.cartesian({
	  range: [[1800, 2300], [12, 25], [0, 10]],
	  scale: [1.5, 1, 1],
	});

	var origin = {x: 1800, y: 12, z: 0}


	var drawAxis = (view, origin)=>{
	    var xticks = 6

		view
		.transform({
			position:[0, origin.y, origin.z]
		})
		.axis({
		  axis: "x", // year
		  end: true,
		  width: 6,
		  depth: 1,
		  color: 0xff0000,
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
	    	color: 0xff0000,
	    	// offset: [1,1]
	    })

		view.transform({
			position:[origin.x, 0, origin.z]
		})
		.axis({
		  axis: "y",
		  end: true,
		  width: 3,
		  depth: 1,
		  color: 0x00ff00,
		  opacity: .5,
		})
		view.transform({
			position: [origin.x, origin.y, ]
		})
		.axis({
		  axis: "z",
		  end: true,
		  width: 3,
		  depth: 1,
		  color: 0x0000ff,
		  opacity: .5,
		});

	    view.array({
	      id: "colors",
	      live: false,
	      data: [colors.x, colors.y, colors.z].map(function (color){
	        return [color.r, color.g, color.b, 1];
	      }),
	    });

	    view.array({
	      data: [[2300,11,2], [1800,25,0], [1800,12,10]],
	      channels: 3, // necessary
	      live: false,
	    }).text({
	      data: ["year", "y", "z"],
	    }).label({
	      color: 0x000000,
	      colors: "#colors",
	    });		

	}

	var drawGrid = (view, origin)=>{
		view.grid({
			axes: "xy",
			divideX: 3,
			divideY: 3
		})
		view
		.transform({
			position:[0, origin.y, origin.z]
		})
		.grid({
			axes: "zx",
			divideX: 3,
			divideY: 3
		})
	}

	drawAxis(view, origin)
	drawGrid(view, origin)

	view.interval({
		id:'tColor',
		width: numData,
		channels: 4,
		items: 1,
		live: false,
		expr: (emit, x, i, t)=>{
			var r0 = 1-i/numData
			var r1 = i/numData
			var c0 = [0.2, 0.9, 0.2]
			var c1 = [0.9, 0.2, 0.2]
			emit(r0*c0[0]+r1*c1[0], 
				r0*c0[1]+r1*c1[1],
				r0*c0[2]+r1*c1[2], 1)
		}
	})


	view.array({
	  id: 'temperature',
	  width: numData,
	  data: temperature,
	  items: 1,
	  channels: 3,
	  live: true
	});

	view.line({
		points: "#temperature",
		color: 0xffffff,
		colors: "#tColor",
		width: 5
	})

	var plotLine=(id, data, yRange, color)=>{
		var view = mathbox.cartesian({
		  range: [[1800, 2300], yRange, [0, 10]],
		  scale: [2, 1, 1],
		});

		view.array({
		  id: id,
		  width: numData,
		  data: data,
		  items: 1,
		  channels: 3,
		  live: false
		}).line({
			color: color,
			width: 5
		})
	}

	plotLine('co2', co2, [0, 4000], 0xffff00)
	plotLine('ice', ice, [0, 30], 0xffffff)
	plotLine('balance', balance, [0, 10], 0x00ffff)
	plotLine('precipitation', precipitation, [0.00003, 0.00005], 0x00ff00)





	// var lineTemperature = mathbox.select('temperature')

	// three.on('update', ()=>{
	// 	var time = three.Time.frames / 200
	// 	for(i=0; i<numData; i++){
	// 		temperature[i][2] = Math.sin(i/20 + time)
	// 	}
	// 	lineTemperature.set('data', temperature)

	// })







	view.array({
	  id: 'sampler1',
	  width: numData,
	  data: [[]],
	  items: 2,
	  channels: 3,
	});
	view.vector({
	  color: 0x3090FF,
	  width: 4,
	  depth: 1,
	  end: true,
	  zWrite: false,
	  blending: THREE.AdditiveBlending,
	});

	view.array({
	  id: 'sampler2',
	  width: numData,
	  data: [[]],
	  items: 2,
	  channels: 3,
	});
	view.vector({
	  color: 0x903000,
	  width: 4,
	  depth: 1,
	  end: true,
	  zWrite: false,
	  blending: THREE.AdditiveBlending,
	});

	var sampler1 = mathbox.select('#sampler1')
	var sampler2 = mathbox.select('#sampler2')
}