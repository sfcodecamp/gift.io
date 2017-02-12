var express    = require('express'),
    bodyParser = require('body-parser'),
    axios      = require('axios'),
    Clarifai   = require('clarifai'),
    Keys       = require('./keys/keys.js'),
    path       = require('path'),
    app        = express();

var clarifai = new Clarifai.App(Keys.id, Keys.secret);
var Shop = require('node-shop.com').initShop({
    apikey: Keys.shopAPI
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
    });
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
const keywords = 15;
const threshold = 0.9;
const interval = 2000;

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

      // send response to client
      client.send(sorted.slice(0, keywords));
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

// routes
app.get('/', function(req, res){
  // home route
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.post('/api/gift', function(req, res){
  console.log(req.body.user);
  // instagramAPI('kingjames')
  //   .then(function(images){
  //      prediction(images.slice(0, 9));
  //   })
  res.sendFile(path.join(__dirname, '../client', 'suggestions.html'));
});

//============Trying Out Shop's API
app.get('/shop', function(req, res){
  Shop.search("basketball people wear competition adult portrait business athlete classic foot", {page: 1, count:1})
    .then(function (data) {
      res.send(data);
    })
    .catch(function (err) {
      console.error(err);
    });
});

app.listen('7000', function(){
  console.log('Clarifai App is running on port 7000');
});
