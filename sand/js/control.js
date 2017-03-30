
// _duration in seconds
var playHistory = (_duration, _from, _to) =>{
	var duration = _duration || 120 // 2min
	var param = {y: _from}
	var t1 = new TWEEN.Tween(param)
		.to({y:_to}, duration*1000)
		.onUpdate(()=>{
			SandYear = Math.round(param.y)
		})
		.start()

	var param1 = {y: _from}
	setTimeout(()=>{
		var t2 = new TWEEN.Tween(param1)
			.to({y:_to}, duration*1000)
			.onUpdate(()=>{
				Year = Math.round(param1.y)
			})
			.start()
	}, 4000)	

}

var morph = (r0, r1)=>{
	var param = {r: r0}
	var t = new TWEEN.Tween(param)
	.to({r: r1}, 20000)
	.onUpdate(()=>{
		setActiveData(_data, param.r)
	})
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start()
}

var scenerio = "Bad"

var good = ()=>{
	scenerio = "Good"
	morph(1, 0)
}

var bad = ()=>{
	scenerio = "Bad"
	morph(0, 1)
}

var toggle = ()=>{
	if(scenerio == "Good"){
		bad()
	}else{
		good()
	}
}

var loop = ()=>{
	setTimeout(()=>{
		good()
	}, 1000)
	setTimeout(()=>{
		bad()
	}, 22000)
}

// loop()
// setInterval(()=>{
// 	loop()
// }, 42000)

// setTimeout(()=>{
// 	playHistory()
// }, 2000)



var events_normal=[
	{command: "playHistory(120, 1850, 2300)", delay: 2},
	{command: "cameraControl.temperature()", delay: 10},
	{command: "cameraControl.co2()", delay: 20},
	{command: "cameraControl.balance()", delay: 30},
	{command: "cameraControl.home()", delay: 40},
	{command: "cameraControl.follow()", delay: 50},
	{command: "cameraControl.follow()", delay: 60},
	{command: "cameraControl.temperature()", delay: 70},
	{command: "cameraControl.co2()", delay: 80},
	{command: "cameraControl.balance()", delay: 90},
	{command: "cameraControl.home()", delay: 100},
	{command: "cameraControl.follow()", delay: 110},
	{command: "cameraControl.home()", delay: 120},
	{command: "toggle()", delay: 125},
	{command: "runEvents(events)", delay: 135},
]

var events_vr=[
	{command: "playHistory(60)", delay: 2},
	{command: "toggle()", delay: 65},
	{command: "runEvents(events)", delay: 80},
]



var runEvents= (events)=>{
	events.forEach(event=>{
		setTimeout(()=>{
			console.log("event: "+event.command)
			eval(event.command)
		}, event.delay * 1000)
	})
}


