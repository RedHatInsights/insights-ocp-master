#!/bin/env/node
const express = require('express');
const http = require('http');
const config = require('./config');
const bodyParser = require('body-parser');
const app = express();
const env = process.env;
const scanQueue = [];

// app config
app.set('port', config.port);

// routes
app.get('/queue', (req, res) => {
	console.log(`Incoming GET for entire queue`);
	return res.status(200).send(scanQueue);
});

// Queue an Image ID
app.post('/queue/:id', bodyParser.json({limit: '50mb'}), (req, res) => {
    console.log(`Incoming POST Queue for image ID ${req.params.id}...`);

    // If the Image already exists in the Queue then exit.
    if ( scanQueue.indexOf(req.params.id) != -1 ){
    	console.log(`Queue exists for image ID ${req.params.id}...`);
    	return res.status(423).send();

    // Otherwise check with the API if it has been scanned within the past 24 hours
    }else{

    	// Setup API GET request options
    	const options = {};
    	options.host = env.SCAN_API;
    	options.port = 8080;
    	options.path = '/reports/'+req.params.id;
    	options.method = 'GET';
    	options.headers: { 'Content-Type': 'application/json' };

    	// Make API Request
    	const req = http.request(options, function(res){
    		console.log('Retrieving report from API at '+options.host+':'+options.port+options.path);

    		let output = '';
    		res.setEncoding('utf8');

    		// Receive chunks
    		res.on('data', function(chunk){
    			output += chunk;
    		});

    		// Response ended
    		res.on('end', function(){
    			let obj = JSON.parse(output);
    			let hoursElapsed = '';
    			if ( hoursElapsed < 24 ){
    				console.log(`Queue added for image ID ${req.params.id}...`);
			    	scanQueue.push(req.params.id);
			    	return res.status(201).send();
    			}else{
    				console.log(`Queue not added for image ID ${req.params.id}, scanned within past 24 hours`);
    				return res.status(412).send();
    			}
    		});
    	});

    	// Request error
    	req.on('error', function(err){
    		console.log('Master Chief cannot reach the Master API...');
    		console.log(`Not adding image ID ${req.params.id} to the queue`);
    		return res.status(503).send();
    	});

    	// Request end
    	req.end();
    }
});

// Dequeue image ID
app.post('/dequeue/:id', bodyParser.json({limit: '50mb'}), (req, res) => {
    console.log(`Incoming POST Dequeue for image ID ${req.params.id}...`);

    // If the image ID exists in the queue, then remove it
    if ( scanQueue.indexOf(req.params.id) != -1 ){
    	console.log(`Removing queue for image ID ${req.params.id}...`);
    	scanQueue.splice(scanQueue.indexOf(req.params.id, 1));
    	return res.status(204).send();

	// Otherwise it does not exist, this was an invalid request
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
