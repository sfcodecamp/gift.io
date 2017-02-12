const state = require('./state');

const helpers = {
	exclude: function(current, values) {
	  for (var val of values) {
	    if (current === val) return false;
	  }
	  return true;
	},
	getTen: function(imagesArr) {
	  var images = [];
	  while (imagesArr.length > 0) {
	    images.push(imagesArr.splice(0, 10));
	  }
	  return images;
	},
	getResults: function(clarifaiValues, limit) {
		state.completed++;   
    let results = {};
    if (state.completed === limit) {
      clarifaiValues.forEach(concepts => {
	      concepts.forEach(concept => {
	        if (results[concept.name]) {
	          results[concept.name] = results[concept.name] + 1;
	        } else {
	          if (helpers.exclude(concept.name, state.exclusion)) {
	            results[concept.name] = 1;
	          }
	        }
	      });
      });
    }
    this.getNamesAndFreqs(results);    
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
		this.getKeywords(sorted);
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
	}
}

module.exports = helpers;