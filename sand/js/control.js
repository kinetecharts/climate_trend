
var playHistory = () =>{
	var param = {y: 1850}
	var t1 = new TWEEN.Tween(param)
		.to({y:2300}, 120000)
		.onUpdate(()=>{
			SandYear = Math.round(param.y)
		})
		.start()

	var param1 = {y: 1850}
	setTimeout(()=>{
		var t2 = new TWEEN.Tween(param1)
			.to({y:2300}, 120000)
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
	}, 22000)
}

// loop()
// setInterval(()=>{
// 	loop()
// }, 42000)

setTimeout(()=>{
	playHistory()
}, 2000)
