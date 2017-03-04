"use strict"

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
		this.colors = options.colors

		this.chart = null

		this.init()
	}

	init(){
		// debugger
		this.z = this.x.map(()=>{return this.z_offset})

		var data = _.zip(this.x, this.y, this.z)
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
			color: this.color,
			colors: this.colors,
			width: 5
		})
		this.chart =this.mathbox.select("#"+this.id)
	}

	update(y){
		var newData=_.zip(this.x, y, this.z)
		// this.chart =this.mathbox.select("#"+this.id)
		this.chart.set('data', newData)
	}
}
