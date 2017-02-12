const axios = require('axios');
const Clarifai = require('clarifai');
const Keys = require('./keys/keys');
const helpers = require('./helpers');
const state = require('./state');
const Shop = require('node-shop.com').initShop({apikey: Keys.shopAPI});

const clarifai = new Clarifai.App(Keys.clarifai_id, Keys.clarifai_secret);

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
	clarifaiPredict: function(url) {
		let concepts = [];
		let threshold = state.threshold;
	  return clarifai.models.predict(Clarifai.GENERAL_MODEL, url)
	  	.then(res => {
	      let results = res.outputs[0].data.concepts;
        results.forEach(result => {
          if (result.value > threshold) {
          	concepts.push(result);
          }
        });
        return concepts;
	    }, (err) => console.log("Error in clarifaiPredict():", err.data.status.details))
	},
	prediction: function(images, index, limit, client) {	  
		Promise.all(images.map(img => this.clarifaiPredict(img.url)))
			.then(values => {
				let keywords = helpers.getResults(values, limit);
				this.shopResults(keywords, client);				
	  }).catch(err => console.log("Error in prediction():", err));
	},
	promiseWrapper: function(blocksOfTen, client) {
	  blocksOfTen.forEach((block, index) => {
	    setTimeout(() => {
	      this.prediction(block, index, blocksOfTen.length, client);
	    }, index * state.interval);
	  });
	},
	shopResults: function(userKeywords, response) {
	  Shop.search(userKeywords, {page: 1, count: 10})
	    .then(data => {
	    	console.log("Got shop results");
	      response.send(data.searchItems);
	    })
	    .catch(err => console.error("Error in shopResults():", err));
	}
}

module.exports = controllers;