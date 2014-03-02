var request = require('request'),
    express = require('express'),
    stylus = require('stylus'), 
    nib = require('nib'),
    url = require("url"),
    qs = require("querystring");

var app = express();
function compile(str, path) { 
  return stylus(str) .set('filename', path).use(nib())
} 
app.set('views', __dirname + '/views')
app.set('view engine', 'jade') 
app.use(express.logger('dev')) 
app.use(stylus.middleware( { src: __dirname + '/public' , compile: compile } )) 
app.use(express.static(__dirname + '/public')) 
app.use(express.cookieParser())

var githubOAuth = require('github-oauth')({
  githubClient: 'c23b616f989578ebc987',//process.env['GITHUB_CLIENT'],
  githubSecret: 'b476224c48981c05c91ec6ee9496fc5ac9cffc8d',//process.env['GITHUB_SECRET'],
  baseURL: 'http://localhost:3000',
  loginURI: '/login',
  callbackURI: '/callback',
  scope: 'repo' // this alows read/write to all public and private repos
});

githubOAuth.addRoutes(app);

function checkToken(req, res, callback){
   if (! res.cookie.token){
    //console.log('caught!');
    res.redirect('/');
  } else {
    console.log(res.cookie.user);
    callback();
  }
}

app.get('/', function(req, res) {
  if (res.cookie.token){
    res.render('index', { user : res.cookie.user } )
    // res.send('Welcome '+res.cookie.user.login+'! Click to <a href="/logout">logout</a><br>'+
    //   '<a href="/user">User Details</a><br>'+
    //   '<a href="/orgs">User Organizations</a><br>'+
    //   '<a href="/repos">User Repos</a>');
  } else {
    res.render('index', { user : null } )
    //res.send('Get my token. Click to <a href="/login">fetch</a>.');
  }
});

app.get('/login', function(req, res) {
  res.send(githubOAuth.login(req, res));
});

app.get('/logout', function(req, res) {
  res.cookie.token = null;
  res.redirect('/');
});

app.get('/callback', function(req, res) {
  res.send(githubOAuth.callback(req, res));
});

app.get('/endpoint', function(req, res){
  checkToken(req, res, function(){
    if(req.method=="POST") {
      var body="";

      req.on("data", function (data) {
        body +=data;
      });

      req.on("end",function(){
        var variables =  qs.parse(body);
      });

      req.on("error",function(e){
        console.log('problem with request: ' + e.message);
      });
    }
    else if(req.method=="GET") {
      var variables = url.parse(req.url, true).query;
    }

    //res.send(variables);
    var options = {
      url: variables.url,
      headers: {
        'User-Agent': 'ghobject',
        'Authorization': 'token ' + res.cookie.token.access_token,
        'json':true
      }
    };
    console.log(options.url);
    request.get(options, function (error, response, body) {
      if (error) return res.send('error', body, error, response)
      res.send(body);
    }); 
 });

});

app.get('/user', function(req, res){
  checkToken(req, res, function(){
    var options = {
      url: res.cookie.user.url,
      headers: {
        'User-Agent': 'ghobject',
        'Authorization': 'token ' + res.cookie.token.access_token,
        'json':true
      }
    };
    request.get(options, function (error, response, body) {
      if (error) return res.send('error', body, error, response)
      res.send(body);
    });
  });
  
});

app.get('/repos', function(req, res){
  checkToken(req, res, function(){
    var options = {
      url: res.cookie.user.repos_url,
      headers: {
        'User-Agent': 'ghobject',
        'Authorization': 'token ' + res.cookie.token.access_token,
        'json':true
      }
    };
    request.get(options, function (error, response, body) {
      if (error) return res.send('error', body, error, response)
      res.send(body);
    }); 
  });

});

app.get('/repos/:repo', function(req, res){
  checkToken(req, res, function(){
    var options = {
      url: 'https://api.github.com/repos/'+res.cookie.user.login+'/'+req.params.repo,
      headers: {
        'User-Agent': 'ghobject',
        'Authorization': 'token ' + res.cookie.token.access_token,
        'json':true
      }
    };
    console.log(options.url);
    request.get(options, function (error, response, body) {
      if (error) return res.send('error', body, error, response)
      res.send(body);
    }); 
  });

});

app.get('/orgs', function(req, res){
  checkToken(req, res, function(){
    var options = {
      url: res.cookie.user.organizations_url,
      headers: {
        'User-Agent': 'ghobject',
        'Authorization': 'token ' + res.cookie.token.access_token,
        'json':true
      }
    };
    request.get(options, function (error, response, body) {
      if (error) return res.send('error', body, error, response)
      res.send(body);
    });
  });
  
});

githubOAuth.on('error', function(err) {
  console.error('there was a login error', err)
})

githubOAuth.on('token', function(token, serverResponse) {
  serverResponse.cookie.token = token;
  var options = {
    url: 'https://api.github.com/user',
    headers: {
      'User-Agent': 'ghobject',
      'Authorization': 'token ' + token.access_token,
      'json':true
    }
  };
  request.get(options, function (error, response, body) {
    if (error) return res.send('error', body, error, response)
    serverResponse.cookie.user = JSON.parse(body);
    //console.log(serverResponse.cookie.user);
    serverResponse.redirect('/');
  });
})

app.listen(3000);
console.log('Server running at http://localhost:3000');