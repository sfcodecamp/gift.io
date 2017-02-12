
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
	countConcepts: function(concepts) {
    let results = {};
    concepts.forEach(concept => {
      if (results[concept.name]) {
        results[concept.name] = results[concept.name] + 1;
      } else {
        if (helpers.exclude(concept.name, state.exclusion)) {
          results[concept.name] = 1;
        }
      }
    });
    return results;
	}
}

module.exports = helpers;