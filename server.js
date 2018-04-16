#!/bin/env/node
const express = require('express');
const http = require('http');
const config = require('./config');
const bodyParser = require('body-parser');
const app = express();
var scanQueue = [];

// app config
app.set('port', config.port);

// routes
app.get('/queue', (req, res) => {
	console.log(`Incoming GET for entire queue`);
	return res.status(200).send(scanQueue);
});

app.post('/queue/:id', bodyParser.json({limit: '50mb'}), (req, res) => {
    console.log(`Incoming POST Queue for image ID ${req.params.id}...`);

    //TODO: Need to check with the API if the image has been scanned within 24 hours

    if ( scanQueue.indexOf(req.params.id) != -1 ){
    	console.log(`Queue exists for image ID ${req.params.id}...`);
    	return res.status(423).send();
    }else{
    	console.log(`Queue added for image ID ${req.params.id}...`);
    	scanQueue.push(req.params.id);
    	return res.status(201).send();
    }
});

app.post('/dequeue/:id', bodyParser.json({limit: '50mb'}), (req, res) => {
    console.log(`Incoming POST Dequeue for image ID ${req.params.id}...`);

    //TODO: Need to update the image ID scan time with the API

    if ( scanQueue.indexOf(req.params.id) != -1 ){
    	console.log(`Removing queue for image ID ${req.params.id}...`);
    	scanQueue.splice(scanQueue.indexOf(req.params.id, 1));
    	return res.status(204).send();
    }else{
    	console.log(`No queue for image ID ${req.params.id}...`);
    	return res.status(412).send();
    }
});

// initialize~
http.createServer(app).listen(app.get('port'), () => {
    console.log('Master Chief listening on port %d...', app.get('port'));
})

process.on('SIGINT', () => {
    process.exit();
});
