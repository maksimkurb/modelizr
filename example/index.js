var express = require('express'),
    server = express(),
    bodyParser = require('body-parser'),
    _ = require('lodash'),
    path = require('path'),
    webpack = require('webpack'),
    config = require('./webpack.dev.js'),
    port = 8000

server.use(require('webpack-dev-middleware')(webpack(config), {
    noInfo: true,
    publicPath: config.output.publicPath
}))

server.use(bodyParser.json())
server.use('/graphql', function (req, res) {
    res.json(require('./data'))
})

server.use('/custom-request', function (req, res) {
    res.json({
        name: 'John'
    })
})

server.use('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'))
})

server.listen(port, function () {
    console.log(`Server listening at http://localhost:${port}/`)
})
