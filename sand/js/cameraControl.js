"use strict"
// x=> Year
// y=> height
// z=> different chart

class CameraControl{
	constructor(controls, scales){
		this.controls = controls
		this.camPos = this.controls.object.position
		this.target = this.controls.target
		this.scales = scales
		this.tweenMove = null
		this.tweenTarget = null
		this.defaultDuration = 2000
	}

	moveTo(pos, duration){
		TWEEN.remove(this.tweenMove)
		var cPos = this.camPos.clone()
		this.tweenMove = new TWEEN.Tween(cPos)
			.to(pos, duration)
			.onUpdate(()=>{
				this.camPos.copy(cPos)
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start()
	}
	focusTo(pos, duration){
		TWEEN.remove(this.tweenTarget)
		var cPos = this.target.clone()
		this.tweenTarget = new TWEEN.Tween(cPos)
			.to(pos, duration)
			.onUpdate(()=>{
				this.target.copy(cPos)
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start()
	}

	home(_duration){
		var duration = _duration || this.defaultDuration
		this.moveTo(new THREE.Vector3(-0.1, 0.7, 2.7), duration)
		this.focusTo(new THREE.Vector3(0,0,0), duration)
	}
	temperature(_duration){
		var duration = _duration || this.defaultDuration
		this.moveTo(new THREE.Vector3(-2.5, 0, 1.2), duration)
		this.focusTo(new THREE.Vector3(0,0, -0.4), duration)
	}
	co2(_duration){
		var duration = _duration || this.defaultDuration
		this.moveTo(new THREE.Vector3(-2.2, 0, 0), duration)
		this.focusTo(new THREE.Vector3(0,0,-1.6), duration)
	}
	balance(_duration){
		var duration = _duration || this.defaultDuration
		this.moveTo(new THREE.Vector3(-2.2, 0, -1.6), duration)
		this.focusTo(new THREE.Vector3(0,0,-3.2), duration)
	}
	follow(_duration){
		var duration = _duration || this.defaultDuration
		var totalYears = chartRange.x[1] - chartRange.x[0]
		var midYear = (chartRange.x[1] + chartRange.x[0])/2
		var x = (Year - midYear) * chartScale[0]*2 / totalYears

		var totalT = chartRange.y[1] - chartRange.y[0]
		var midT = (chartRange.y[1] + chartRange.y[0])/2
		var y = (_data.active.temperature[Year - 1850] - midT) * chartScale[1]*2 / totalT

		var z = 0 //temerature z_offset is 0

		this.focusTo(new THREE.Vector3(x, y, z), duration)
		this.moveTo(new THREE.Vector3(x-1, y+0.3, z+0.3), duration)
	}
}
