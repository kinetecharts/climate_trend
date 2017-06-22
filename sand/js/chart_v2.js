"use strict"

/*
A few params can be set through the query string.  These are:

param             default Meaning
----------------------------------------------------------------------
labelSize           60    The size for all labels
gridLineWidth       5     The thickness of lines on the zx and yz axes
chartGridLineWidth  1     The thickness of the 'ticks' on each chart
envelopeLineWidth   3     The thickness of upper and lower envelope lines
refLineWidth        3     The thickness of the horizontal reference lines
co2LineWidth        20    Thickness of CO2 graph
tempLineWidth       20    Thickness of temp graph
balanceLineWidth    10    Thickness of energy balance graph
showGraphics        1     Whether to show the data viz graphs
showPanel           0     Whether to show the side panel with legend
*/
// var params = {}

// params.labelSize = 60;
// params.gridLineWidth = 5;
// params.chartGridLineWidth = 3;
// params.envelopeLineWidth = 3;
// params.refLineWidth = 3;
// params.co2LineWidth = 20
// params.tempLineWidth = 60
// params.balanceLineWidth = 30
// params.hideLegend = false
// params.showPanel = true;
// params.showGraphics = true;

class Chart{
	constructor(mathbox, options){
		this.mathbox = mathbox
		this.x = options.x
		this.y = options.y
		this.z_offset = options.z_offset
		this.id = options.id
		this.xRange = options.xRange
		this.yRange = options.yRange
		this.zRrange = options.zRrange
		this.scale = options.scale
		this.color = options.color
	        this.dotColor = options.dotColor || this.color;
		this.colors = options.colors
	        this.lineWidth = options.lineWidth || 20
		this.labelFunc = options.labelFunc || ((val)=>{return [val]})
	        //this.labelSize = options.labelSize || 36
	        this.labelSize = params.labelSize
		this.chart = null

		this.init()
	}

	init(){
		// debugger
		// trun z_offset into array
		this.z = this.x.map(()=>{return this.z_offset})

		var data = _.zip(this.x, this.y, this.z)
		var reference = [[this.x[0], this.y[0], this.z_offset],
			[_.last(this.x), this.y[0], this.z_offset]]

		var view = this.mathbox.cartesian({
		  range: [this.xRange, this.yRange, this.zRrange],
		  scale: this.scale
		});


		// draw line
		view.array({
		  id: this.id,
		  width: numData,
		  data: data,
		  items: 1,
		  channels: 3,
		  live: false
		}).line({
			id: this.id+'-line',
			opacity: 1.0,
			color: this.color,
			colors: this.colors,
			width: this.lineWidth
		})

		// draw current year mark as a point
		view.array({
			id: this.id+'-lineend-point-pos',
			width: 1,
			data: [[1850,0,0]],
			items: 1,
			channels: 3,
			live: true
		}).point({
			id: this.id+'-lineend-point-mark',
		   //	opacity: 0.3,
			opacity: 0.8,
			color: this.dotColor,
                        zIndex: 21, //DGK
			size: 60
		})

		view.array({
			id: this.id+'-lineend-point-pos-b',
			width: 1,
			data: [[1850,0,0]],
			items: 1,
			channels: 3,
			live: true
		}).point({
			id: this.id+'-lineend-point-mark-b',
			opacity: 1,
			color: 0xffffff,
                        zIndex: 22, //DGK
			size: 20
		})

	    this.lineendMarkPos = this.mathbox.select('#'+this.id+'-lineend-point-pos')
	    this.lineendMarkPosB = this.mathbox.select('#'+this.id+'-lineend-point-pos-b')


		var dataRCP8p5 = _.zip(this.x, _data.rcp8p5[this.id], this.z)
		// draw line
		view.array({
		  id: this.id+'-rcp8p5',
		  width: numData,
		  data: dataRCP8p5,
		  items: 1,
		  channels: 3,
		  live: false
		}).line({
			id: this.id+'-rcp8p5-line',
			opacity: 0.5,
			zIndex: 10,
			color: this.color,
			// colors: this.colors,
			//width: 1
			width: params.envelopeLineWidth
		})

		var dataRCP2p6 = _.zip(this.x, _data.rcp2p6[this.id], this.z)
		// draw line
		view.array({
		  id: this.id+'-rcp2p6',
		  width: numData,
		  data: dataRCP2p6,
		  items: 1,
		  channels: 3,
		  live: false
		}).line({
			id: this.id+'-rcp2p6-line',
			opacity: 0.5,
			zIndex: 10,
			color: this.color,
			// colors: this.colors,
			//width: 1
			width: params.envelopeLineWidth
		})


		// draw reference line
		view.array({
		  id: this.id+'-reference',
		  width: 2,
		  data: reference,
		  items: 1,
		  channels: 3,
		  live: false
		}).line({
			id: this.id+'-line-reference',
			color: this.color,
			colors: this.colors,
			//width: 5
			width: params.refLineWidth
		})


		this.chart =this.mathbox.select("#"+this.id)

		// draw XY grid
		view.transform({position:[0, 0, this.z_offset]})
		.grid({
			axes: "xy",
			divideX: 4,
			divideY: 4,
			niceX: false,
			niceY: false,
			width: params.chartGridLineWidth,
			opacity: 0.3,
			color: this.color
		})

		// Draw X axis
		view.transform({
			position:[0, this.yRange[0], this.z_offset]
		}).axis({
		  axis: "x",
		  end: false,
		  width: 6,
		  depth: 1,
		  color: this.color,
		  opacity: .5,
		})
		
		// Draw Y axis
		view.transform({
			position:[this.xRange[1], 0, this.z_offset]
		}).axis({
		  axis: "y",
		  end: true,
		  width: 6,
		  depth: 1,
		  color: this.color,
		  opacity: .5,
		})

		// Draw Y axis labels and ticks
		view.scale({
	      divide: 4,
	      origin: [this.xRange[1], this.yRange[0], this.z_offset],
	      axis: "y",
	      nice: false
	    })
	    .ticks({
	      classes: ['foo', 'bar'],
	      width: 10
	    })

	    if(!params.hideLegend){
		    view.text({
		    	live: false,
		    	depth: 2,
		    	data: interpolate(this.yRange[0], this.yRange[1], 5)
		    })
		    .label({
		    	color: this.color,
		    	background: params.colors.bg,
		    	//size: 36,
		    	size: this.labelSize,
		    	depth: 1
		    	// offset: [1,1]
		    })

		    // Y axis id
	        view.array({
				data: [[this.xRange[1], 0.1*(this.yRange[1]-this.yRange[0]) + this.yRange[1], this.z_offset]],
				channels: 3, // necessary
				live: false,
		    }).text({
		      data: [this.id],
		      depth: 2
		    }).label({
		      color: this.color,
		      background: params.colors.bg,
		      snap: false,
		      //size: 48,
	              size: this.labelSize,
		      depth: 1,
		      zIndex: 1
		    });		

		    // projection at 2300
	        view.array({
	        	id: this.id+'-label-position',
				data: [[this.xRange[1], 0.1*(this.yRange[1]-this.yRange[0]) + this.yRange[1], this.z_offset]],
				channels: 3, // necessary
				live: true,
		    }).text({
		    	id: this.id+'-label-text',
		      data: [0],
		    }).label({
		      color: this.color,
		      background: params.colors.bg,
		      //size: 36,
		      size: this.labelSize,
		      depth: 1
		    });		

		    // Current value
	        view.array({
	        	id: this.id+'-label-year-position',
				data: [[Year, 0.1*(this.yRange[1]-this.yRange[0]) + this.yRange[1], this.z_offset]],
				channels: 3, // necessary
				live: true,
		    }).text({
		    	id: this.id+'-label-year-text',
		      data: ['temperature'],
		    }).label({
		      color: this.color,
		      background: params.colors.bg,
		      //size: 36,
	              size: this.labelSize,
		      depth: 1
		    });	

		    this.labelPosition = this.mathbox.select('#'+this.id+'-label-position')
		    this.labelText = this.mathbox.select('#'+this.id+'-label-text')
		    this.labelYearPos = this.mathbox.select('#'+this.id+'-label-year-position')
		    this.labelYearText = this.mathbox.select('#'+this.id+'-label-year-text')
		}
	}

	update(y){
		var newData=_.zip(this.x, y, this.z)
		// this.chart =this.mathbox.select("#"+this.id)
		this.chart.set('data', newData)

		this.lineendMarkPos.set('data', 
			[[Year, y[Year-1850], this.z_offset]]
			)

		this.lineendMarkPosB.set('data', 
			[[Year, y[Year-1850], this.z_offset]]
			)
	        $("#yearText").html(Year);
	        //$("#yearLabel").html(Year);
		if(!params.hideLegend){
			this.labelPosition.set('data', [[this.xRange[1], y[numData-1], this.z_offset]])

			this.labelText.set('data', [y[numData-1].toPrecision(3)])

			this.labelYearPos.set('data', 
				[[Year, 0.1*(this.yRange[1]-this.yRange[0]) + y[Year-1850], this.z_offset]])
			this.labelYearText.set('data', 
				this.labelFunc(Year, (y[Year-1850] - PreIndustrial[this.id]).toFixed(1)))
		}
	}

}
