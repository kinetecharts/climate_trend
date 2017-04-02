/*
To Run:
clearEvents()

startYear = 1850
year_per_minute = 25 * 6 // 25=>18min
endYear = 2300

runEvents(events_normal)

*/


// _duration in seconds
var historyT1, historyT2
var playHistory = (_duration, _from, _to) =>{
	stopHistory()
	var duration = _duration || 120 // 2min
	var param = {y: _from}
	historyT1 = new TWEEN.Tween(param)
		.to({y:_to}, duration*1000)
		.onUpdate(()=>{
			SandYear = Math.round(param.y)
		})
		.start()

	var param1 = {y: _from}
	setTimeout(()=>{
		historyT2 = new TWEEN.Tween(param1)
			.to({y:_to}, duration*1000)
			.onUpdate(()=>{
				Year = Math.round(param1.y)
			})
			.start()
	}, 4000)	

}

var stopHistory=()=>{
	TWEEN.remove(historyT1)
	TWEEN.remove(historyT2)
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


// var time_scale = 1

// return seconds

var startYear = 1850
var year_per_minute = 25 // * 12 // 25=>18min
var endYear = 2300

var yearsToSec=(year)=>{
	var sec_per_year = 60/year_per_minute
	return (year-startYear) * sec_per_year
}


var cameraDuration = yearsToSec(startYear+25, year_per_minute)*1000 // in milliseconds

var events_normal=[
	{command: "playHistory(yearsToSec(endYear, year_per_minute), startYear, endYear)", delay: 0},
	{command: "cameraControl.home(cameraDuration)", delay: yearsToSec(1900)},
	{command: "cameraControl.co2(cameraDuration)", delay: yearsToSec(1950)},
	{command: "cameraControl.balance(cameraDuration)", delay: yearsToSec(2000)},
	{command: "cameraControl.temperature(cameraDuration)", delay: yearsToSec(2050)},
	{command: "cameraControl.home(cameraDuration)", delay: yearsToSec(2100)},
	{command: "good()", delay: yearsToSec(2150)},
	{command: "bad()", delay: yearsToSec(2190)},
	{command: "cameraControl.follow(cameraDuration)", delay: yearsToSec(2220)},
	{command: "cameraControl.follow(cameraDuration)", delay: yearsToSec(2260)},
	{command: "cameraControl.home(cameraDuration)", delay: yearsToSec(2300)},
	// {command: "cameraControl.follow(cameraDuration)", delay: 50*time_scale},
	// {command: "cameraControl.follow(cameraDuration)", delay: 60*time_scale},
	// {command: "cameraControl.temperature(cameraDuration)", delay: 70*time_scale},
	// {command: "cameraControl.co2(cameraDuration)", delay: 80*time_scale},
	// {command: "cameraControl.balance(cameraDuration)", delay: 90*time_scale},
	// {command: "cameraControl.home(cameraDuration)", delay: 100*time_scale},
	// {command: "cameraControl.follow(cameraDuration)", delay: 110*time_scale},
	// {command: "cameraControl.home(cameraDuration)", delay: 120*time_scale},
	// {command: "toggle()", delay: 125*time_scale},
	// {command: "runEvents(events)", delay: 135*time_scale},
]

var events_vr=[
	{command: "playHistory(60)", delay: 2},
	{command: "toggle()", delay: 65},
	{command: "runEvents(events)", delay: 80},
]

var timeouts = []


var runEvents= (events)=>{
	clearEvents()
	events.forEach(event=>{
		timeouts.push(setTimeout(()=>{
			console.log("event: "+event.command)
			eval(event.command)
		}, event.delay * 1000))
	})
}

var clearEvents = ()=>{
	timeouts.forEach(timeout =>{
		clearTimeout(timeout)
	})
	timeouts.splice(0, 100)
}


