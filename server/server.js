var express    = require('express'),
    bodyParser = require('body-parser'),
    axios      = require('axios'),
    Clarifai   = require('clarifai'),
    Keys       = require('./keys/keys.js'),
    app        = express();

var  clarifai = new Clarifai.App(
    Keys.id,
    Keys.secret
  );

function instagramAPI(user) {
  axios.get('https://www.instagram.com/firgonoutfitters/media/').then(res => {
    var images = [];
    for (var post of res.data.items) {
      images.push(post.images.standard_resolution.url);
    };
    return images;
  });
};


//=========HOME PAGE========
app.get('/', function(req, res){
  res.sendFile('index.html');
});

app.listen('7000', function(){
  console.log('Clarifai Running');
});
