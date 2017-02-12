var express    = require('express'),
    bodyParser = require('body-parser'),
    axios      = require('axios'),
    Clarifai   = require('clarifai'),
    Keys       = require('./keys/keys.js'),
    path       = require('path'),
    app        = express();


//==========CONFIG============
app.use(bodyParser.urlencoded({extended: true}) )
app.use(bodyParser.json());

var  clarifai = new Clarifai.App(
    Keys.id,
    Keys.secret
  );

var userImagesData = [];

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
}



const threshold = 0.9;

function prediction(images, res) {

	var concepts = [];

  // create individual promises which call Clarifai predict API
	function predict(url) {
	  return clarifai.models.predict(Clarifai.GENERAL_MODEL, url).then(
	    function(response) {
	      var results = response.outputs[0].data.concepts;
        results.forEach(result => {
          if (result.value > threshold) concepts.push(result)
        });
	    },
	    function(err) {
	      console.log(err);
	    }
	  );
	}

  // Process all images as promise array
	Promise.all(images.map(img => predict(img.url))).then(values => {

    var results = {};

    // map over result and accumulate total occurrences
    concepts.forEach(concept => {
      if (results[concept.name]) {
        results[concept.name] = results[concept.name] + 1;
      } else {
        results[concept.name] = 1;
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

    // send response to client
    res.send(toSort.sort((a,b) => b.frequency - a.frequency));

  }).catch(err => {
    console.log(err);
  });

}


//=========HOME PAGE========
app.get('/', function(req, res){
  // home route
});

app.get('/userGift', function(req, res){
  instagramAPI('kingjames').then(function(images){
    prediction(images.slice(0, 10), res);
  });
});


app.listen('7000', function(){
  console.log('Clarifai App is running on port 7000');
});
