
var playHistory = (_duration) =>{
	var duration = _duration || 120000 // 2min
	var param = {y: 1850}
	var t1 = new TWEEN.Tween(param)
		.to({y:2300}, duration)
		.onUpdate(()=>{
			SandYear = Math.round(param.y)
		})
		.start()

	var param1 = {y: 1850}
	setTimeout(()=>{
		var t2 = new TWEEN.Tween(param1)
			.to({y:2300}, duration)
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



var events=[
	{command: "playHistory()", delay: 2},
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
	{command: "runEvents()", delay: 135},
]

var runEvents= ()=>{
	events.forEach(event=>{
		setTimeout(()=>{
			console.log("event: "+event.command)
			eval(event.command)
		}, event.delay * 1000)
	})
}

runEvents()

