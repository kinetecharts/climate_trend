var express = require('express')
var app = express()
var path = require('path')


app.use(express.static(__dirname))

app.get('/', (req, res)=>{
	res.sendFile('/index.html')
})

const port = 8001
app.listen(port, ()=>{
	console.log(`video app listening on port ${port}`)
})