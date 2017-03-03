$.get('data/rcp8p5.csv', d=>{
	window._d = Papa.parse(d, {header : true, skipEmptyLines: true}).data
})