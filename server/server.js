var express    = require('express'),
    bodyParser = require('body-parser'),
    axios      = require('axios'),
    Clarifai   = require('clarifai'),
    Keys       = require('./keys/keys.js'),
    path       = require('path'),
    app        = express();

var clarifai = new Clarifai.App(
  process.env.CLARIFAI_ID || Keys.id,
  process.env.CLARIFAI_SECRET || Keys.secret
);

var Shop = require('node-shop.com').initShop({
    apikey: process.env.SHOP_KEY || Keys.shopAPI
});

app.use(bodyParser.urlencoded({extended: true}) )
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

// call instgram to retrieve submitted user's images
function instagramAPI(user) {
  return new Promise(function(resolve, reject){
    return axios.get('https://www.instagram.com/'+ user + '/media/').then(res => {
      var images = [];
      for (var post of res.data.items) {
        images.push({
          url: post.images.standard_resolution.url
        });
      }
      resolve(images);
    }).catch(err => reject(err));
  });
};

// helper function to slice instagram data into blocks of ten
function getTen(imagesArr) {
  var images = [];
  while (imagesArr.length > 0) {
    images.push(imagesArr.splice(0, 10));
  }
  return images;
}

// helper to exclude certain terms
var exclusion = ['people', 'no person', 'man', 'woman'];
function exclude(current, values) {
  for (var val of values) {
    if (current === val) return false;
  }
  return true;
}

// define values for keywords limit to return to client and value threshold for prediction matching
const threshold = 0.9;
const interval = 2000;
const productMax = 3;

// global state variables for prediction function
var completed = 0;
var concepts = [];

// main prediction function
function prediction(images, index, limit, client) {

	function predict(url) {
	  return clarifai.models.predict(Clarifai.GENERAL_MODEL, url).then(
	    function(response) {
	      var results = response.outputs[0].data.concepts;
        results.forEach(result => {
          if (result.value > threshold) concepts.push(result)
        });
	    },
	    function(err) {
	      console.log(err.data.status.details);
	    }
	  );
	}

  // Process all images as promise array
	Promise.all(images.map(img => predict(img.url))).then(values => {
    
    completed++;

    if (completed === limit) {

      var results = {};

      // map over result and accumulate total occurrences
      concepts.forEach(concept => {
        if (results[concept.name]) {
          results[concept.name] = results[concept.name] + 1;
        } else {

          if (exclude(concept.name, exclusion)) {
            results[concept.name] = 1;
          }
        }
      });
      // sort by frequency
      var toSort = [];

      for (var key in results) {
        toSort.push({
          name: key,
          frequency: results[key]
        });
      }

      // sort by frequency
      var sorted = toSort.sort((a,b) => b.frequency - a.frequency);

      var keywords = '';

      for (var i = 0; i < productMax; i++) {
        keywords += sorted[i].name;
        if (i < productMax - 1) keywords += ' ';
      };

      completed = 0;
      concepts = [];

      shopResults(keywords, client);

    }

  }).catch(err => {
    console.log(err);
  });

};

function promiseWrapper(blocksOfTen, client) {

  blocksOfTen.forEach((block, index) => {
    setTimeout(() => {
      prediction(block, index, blocksOfTen.length, client);
    }, index * interval);
  });

};

function shopResults(userKeywords, response) {
  Shop.search(userKeywords, {page: 1, count: 10})
    .then(function (data) {
      response.send(data.searchItems);
    })
    .catch(function (err) {
      console.error(err);
    });
};

// routes
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../client/', 'index.html'));
});

app.post('/api/gift', function(req, res) {
  var { user } = req.body;
  instagramAPI(user).then(images => {
    promiseWrapper(getTen(images), res);
  }).catch(err => {
    res.status(404).send('Instagram username was not found!');
  });
});

app.listen('7000', function() {
  console.log('Clarifai App is running on port 7000');
});
