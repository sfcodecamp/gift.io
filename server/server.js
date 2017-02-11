var express    = require('express'),
    bodyParser = require('body-parser'),
    axios      = require('axios'),
    Clarifai   = require('clarifai'),
    Keys       = require('./keys/keys.js'),
    app        = express();


//==========CONFIG============
app.use(bodyParser.urlencoded({extended: true}) )
app.use(bodyParser.json());

var  clarifai = new Clarifai.App(
    Keys.id,
    Keys.secret
  );

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


//=========HOME PAGE========
app.get('/', function(req, res){
  res.sendFile('index.html');
});

app.get('/userGift', function(req, res){
  //var userName = req.body.userName;
  instagramAPI('kingjames').then(function(images){
    res.send(images);
  }, function(err){
    console.log(err);
  });
});

app.listen('7000', function(){
  console.log('Clarifai Running');
});
