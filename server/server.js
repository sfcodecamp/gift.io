
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const controllers = require('./controllers');
const helpers = require('./helpers');
const app = express();

app.use(bodyParser.urlencoded({extended: true}) )
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

var active = {
	state: false
}

var processRequest = function(user, response, active) {
  controllers.instagramAPI(user)
    .then(images => {
      controllers.promiseWrapper(helpers.getTen(images), response, active);
    }).catch(err => {
    	active.state = false;
      response.status(404).send('Instagram username was not found!');
    });
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/', 'index.html'));
});

app.post('/api/gift', (req, res) => {

	const { user } = req.body;

	console.log('Request received for ' + user);

	if (!active.state) {
		console.log('processing first request');
		active.state = true;
		processRequest(user, res, active);
	} else {
		console.log('service not available');
		res.status(503).send('Service unavailable');
	}

});

const port = process.env.PORT || '7000';

app.listen(port, () => console.log('Clarifai App is running on port 7000'));
