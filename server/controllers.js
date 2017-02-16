const axios = require('axios');
const Clarifai = require('clarifai');
const helpers = require('./helpers');

if (process.env.NODE_ENV !== 'production') {
  var Keys = require('./keys/keys');
}
const Shop = require('node-shop.com').initShop({apikey: process.env.SHOP_KEY || Keys.shopAPI});

const clarifai = new Clarifai.App(
	process.env.CLARIFAI_ID || Keys.clarifai_id,
	process.env.CLARIFAI_SECRET || Keys.clarifai_secret
);

var State = function() {
	this.completed = 0,
	this.concepts = []
};

const controllers = {
	state: {
		productMax: 2,
		threshold: 0.9,
		interval: 2250
	},
	instagramAPI: function(user) {
	  return new Promise((resolve, reject) => {
	    return axios.get(`https://www.instagram.com/${user}/media/`)
		    .then(res => {
		    	if (!res.data.more_available) reject("User is private");
		      let images = [];
		      for (let post of res.data.items) {
		        images.push({url: post.images.standard_resolution.url});
		      }
		      resolve(images);
		    }).catch(err => reject("Error in instagramAPI():", err));
	  });
	},
	callShopAPI: function(userKeywords, response, active) {
		// why are the results sometimes empty?
		console.log(`Searching Shop for ${userKeywords}`);
	  Shop.search(userKeywords, {})
	    .then(data => {
	    	console.log(`Sending ${data.searchItems.length} shop results to client`);
	    	active.state = false;
	      response.send(data.searchItems);
	    })
	    .catch(err => console.error("Error in callShopAPI():", err));
	},
	getResults: function(limit, client, state, active) {
		console.log('get results called');
		state.completed++;
    if (state.completed === limit) {
    	let countedConcepts = helpers.countConcepts(state.concepts);
      let sortedFrequency = this.getNamesAndFreqs(countedConcepts);
      let keywords = this.getKeywords(sortedFrequency);
      this.callShopAPI(keywords, client, active);
    }
  },
	getKeywords: function(sortedNames) {
		// get keywords from sorted list
    let keywords = '';
    for (let i = 0; i < this.state.productMax; i++) { 
    	let product = sortedNames[i];
      keywords += product.name;
      i < this.state.productMax - 1 ? keywords += ' ' : null;
    };
    return keywords;
	},
  getNamesAndFreqs: function(clarifaiResults) {
    let toSort = [];
    for (let key in clarifaiResults) {
      toSort.push({
        name: key,
        frequency: clarifaiResults[key]
      });
    }
		return toSort.sort((a,b) => b.frequency - a.frequency);
  },
	clarifaiPredict: function(url, state) {
		let threshold = this.state.threshold;
	  return clarifai.models.predict(Clarifai.GENERAL_MODEL, url)
	  	.then(res => {
	      let results = res.outputs[0].data.concepts;
        results.forEach(result => {
          if (result.value > threshold) state.concepts.push(result);
        });
	    });
	},
	prediction: function(images, limit, client, state, active) {	  
		console.log('prediction called');
		Promise.all(images.map(img => this.clarifaiPredict(img.url, state)))
			.then(values => {
				this.getResults(limit, client, state, active);
	  }).catch(err => {
	  	active.state = false;
	  	console.log('an error occurred in the prediction function');
	  	console.log(err.data.status.details);
	  	client.status(500).send('An error occurred');
	  });
	},
	promiseWrapper: function(blocksOfTen, client, active) {
		console.log('promise wrapper called');
		var reqState = new State();
	  blocksOfTen.forEach((block, index) => {
	    setTimeout(() => {
	      this.prediction(block, blocksOfTen.length, client, reqState, active);
	    }, index * this.state.interval);
	  });
	}
}

module.exports = controllers;