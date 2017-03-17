"use strict"

var temperatureColorMap = function(val){
	var min = 13.36
	var max = 23

	var r0 = 1 - (val-min) / (max-min) // Green percentage
	var r1 = 1 - r0

	var c0 = [0.2, 1, 0.2] // Green
	var c1 = [1, 0.2, 0.2] // Red
	return {
		r: r0*c0[0]+r1*c1[0], 
		g: r0*c0[1]+r1*c1[1],
		b: r0*c0[2]+r1*c1[2]
	}
}

class Sand{
	constructor(x,y,z){
		this.x = x
		this.y = y
		this.z = z

		this.r = 0
		this.g = 1
		this.b = 0

		this.a = 1

		this.moving = false
	}
	pos(){
		return [this.x, this.y, this.z]
	}
	color(){
		return [this.r, this.g, this.b, this.a]
	}
	move(){
		this.moving = true
		this.x = Year

		var target = _data.active.temperature[Year - 1849]

		var param = {y: 13.36}
		var t = new TWEEN.Tween(param)
			.to({y: target}, 4000)
			.onUpdate(()=>{
				this.y = param.y
				var newColor = temperatureColorMap(this.y)
				this.r = newColor.r
				this.g = newColor.g
				this.b = newColor.b
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onComplete(()=>{
				this.moving = false
				this.y = 13
			})
			.start()
	}
}

class Sands{
	constructor(mathbox, options){
		this.mathbox = mathbox

		this.numSands = 100
		this.sands = []
		this.sandsColor=[]

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
		// trun z_offset into array

		for(var i=0; i<this.numSands; i++){
			this.sands.push(new Sand(Year, 0, this.z_offset))
		}

		var data=this.sands.map(d=>{return d.pos()})
		this.sandsColor = this.sands.map(d=>{return d.color()})


		var reference = [[this.x[0], this.y[0], this.z_offset],
			[_.last(this.x), this.y[0], this.z_offset]]

		var view = this.mathbox.cartesian({
		  range: [this.xRange, this.yRange, this.zRrange],
		  scale: this.scale
		});

		// colors
		view.array({
			id:'sandsColor',
			width: this.numSands,
			data: this.sandsColor,
			channels: 4,
			items: 1,
			live: true
		})


		// draw points
		view.array({
		  id: this.id,
		  width: this.numSands,
		  data: data,
		  items: 1,
		  channels: 3,
		  live: true
		}).point({
			id: this.id+'-sand',
			opacity: 0.5,
			color: this.color,
			colors: '#sandsColor',
			size: 10
			// width: 10
		})

		this.chart =this.mathbox.select("#"+this.id)

	}

	update(y){
		this.sands.forEach(sand=>{
			if(Math.random()<0.01 && !sand.moving){
				sand.move()
			}
		})
		var data=this.sands.map(d=>{return d.pos()})
		
		// for some reason, the color data has to be from the same object!
		// this.sandsColor = this.sands.map(d=>{return d.color()})
		for(var i=0; i<this.numSands; i++){
			var c = this.sands[i].color()
			this.sandsColor[i][0]=c[0]
			this.sandsColor[i][1]=c[1]
			this.sandsColor[i][2]=c[2]
			this.sandsColor[i][3]=c[3]
		}
		
		this.chart.set('data', data)

		this.chart.select('#sandsColor').set('data', this.sandsColor)
	}
}
