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

function getTen(imagesArr) {
  var images = {};
  var id = 1;
  while (imagesArr.length > 0) {
    images[id] = imagesArr.splice(0, 10);
    id++;
  }
  return images;
}

function instagramAPI(user) {
  return new Promise(function(resolve, reject){
    return axios.get('https://www.instagram.com/'+ user + '/media/').then(res => {
      var images = [];
      for (var post of res.data.items) {
        images.push({
          url: post.images.standard_resolution.url
        });
      }
      console.log(images);
      resolve(images);
    });
  });
}

function prediction(images) {
  var allImages = getTen(images);
	var concepts = [];
	function predict(url) {
	  clarifai.models.predict(Clarifai.GENERAL_MODEL, url).then(
	    function(response) {
	      concepts.push(response);
	    },
	    function(err) {
	      console.log(err);
	    }
	  );
	}
  
	Promise.all(images.map(img => predict(img.url))).then(values => {
		// console.log(concepts[0]);
  //   console.log('done', concepts.length);
	}).catch(err => console.log(err));

}


//=========HOME PAGE========
app.get('/', function(req, res){
  instagramAPI('kingjames')
    .then(function(images){
       prediction(images.slice(0, 9));
    });  
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen('7000', function(){
  console.log('Clarifai Running');
});
