const axios = require('axios');
const Clarifai = require('clarifai');
const helpers = require('./helpers');
const state = require('./state');

if (process.env.NODE_ENV !== 'production') {
  var Keys = require('./keys/keys');
}

const Shop = require('node-shop.com').initShop({apikey: process.env.SHOP_KEY || Keys.shopAPI});

const clarifai = new Clarifai.App(
	process.env.CLARIFAI_ID || Keys.clarifai_id,
	process.env.CLARIFAI_SECRET || Keys.clarifai_secret
);

const controllers = {	
	instagramAPI: function(user) {
	  return new Promise((resolve, reject) => {
	    return axios.get(`https://www.instagram.com/${user}/media/`)
		    .then(res => {
		      let images = [];
		      for (let post of res.data.items) {
		        images.push({url: post.images.standard_resolution.url});
		      }
		      resolve(images);
		    })
		    .catch(err => reject("Error in instagramAPI():", err));
	  });
	},
	getResults: function(limit, client) {
		state.completed++;
    if (state.completed === limit) {
    	let countedConcepts = helpers.countConcepts(state.concepts);
      let sortedFrequency = this.getNamesAndFreqs(countedConcepts);
      let keywords = this.getKeywords(sortedFrequency);
      this.shopResults(keywords, client);
    }
  },
	getKeywords: function(sortedNames) {
		// get keywords
    let keywords = '';
    for (let i = 0; i < state.productMax; i++) { 
    	let product = sortedNames[i];
      keywords += product.name;
      i < state.productMax - 1 ? keywords += ' ' : null;
    };
    return keywords;
	},
  getNamesAndFreqs: function(clarifaiResults) {
  	// get names and frequency
    let toSort = [];
    for (let key in clarifaiResults) {
      toSort.push({
        name: key,
        frequency: clarifaiResults[key]
      });
    }
    // sort by frequency
		let sorted = toSort.sort((a,b) => b.frequency - a.frequency);
		return sorted;
  },
	clarifaiPredict: function(url) {
		let threshold = state.threshold;
	  return clarifai.models.predict(Clarifai.GENERAL_MODEL, url)
	  	.then(res => {
	      let results = res.outputs[0].data.concepts;
        results.forEach(result => {
          if (result.value > threshold) state.concepts.push(result);
        });
	    }, (err) => console.log("Error in clarifaiPredict():", err.data.status.details))
	},
	prediction: function(images, limit, client) {	  
		Promise.all(images.map(img => this.clarifaiPredict(img.url)))
			.then(values => {
				this.getResults(limit, client);
	  }).catch(err => console.log("Error in prediction():", err));
	},
	promiseWrapper: function(blocksOfTen, client) {
	  blocksOfTen.forEach((block, index) => {
	    setTimeout(() => {
	      this.prediction(block, blocksOfTen.length, client);
	    }, index * state.interval);
	  });
	},
	shopResults: function(userKeywords, response) {
		state.completed = 0;
		state.concepts = [];
	  Shop.search(userKeywords, {page: 1, count: 10})
	    .then(data => {
	    	console.log("Sending shop results to client");
	      response.send(data.searchItems);
	    })
	    .catch(err => console.error("Error in shopResults():", err));
	}
}

module.exports = controllers;