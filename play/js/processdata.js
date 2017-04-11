"use strict"

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

var interpolate = (lo, hi, n) => {
  n--; // go to end of range
  var vals = [];
  for (var i = 0; i <= n; i++){
    vals.push(Math.round(10 * (lo + (hi - lo)*(i/n)))/10);
  }
  return vals;
}

var smoothEnergyBalance = data => {
	var types = ['rcp8p5', 'rcp2p6', 'active']

	types.forEach(type=>{
		applySmooth(data[type].balance)
	})

	return data
}

var applySmooth = data =>{
	var len = data.length
	data[0] = (2*data[0] + data[1])/3.0
	data[len-1] = (2*data[len-1] + data[len-2])/3.0
	for(var i=1; i<len-1; i++){
		data[i] = (data[i-1]+data[i]+data[i+1])/3.0
	}
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
