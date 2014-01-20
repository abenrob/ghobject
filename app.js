var request = require('request'),
    express = require('express'),
    app = express();

app.use(express.cookieParser());

var githubOAuth = require('github-oauth')({
  githubClient: 'c23b616f989578ebc987',//process.env['GITHUB_CLIENT'],
  githubSecret: 'b476224c48981c05c91ec6ee9496fc5ac9cffc8d',//process.env['GITHUB_SECRET'],
  baseURL: 'http://localhost:3000',
  loginURI: '/login',
  callbackURI: '/callback',
  scope: 'repo' // this alows read/write to all public and private repos
});

githubOAuth.addRoutes(app);

function checkToken(req, res){
   if (! res.cookie.token){
    console.log('caught!');
    res.redirect('/');
  }
}

app.get('/', function(req, res) {
  if (res.cookie.token){
    res.send('Got my token. Click to <a href="/logout">discard</a><br>'+
      '<a href="/user">User Details</a><br>'+
      '<a href="/orgs">User Organizations</a><br>'+
      '<a href="/repos">User Repos</a>');
  } else {
    res.send('Get my token. Click to <a href="/login">fetch</a>.');
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

app.get('/user', function(req, res){
  checkToken(req, res);
  var options = {
    url: 'https://api.github.com/user',
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token ' + res.cookie.token.access_token,
      'json':true
    }
  };
  request.get(options, function (error, response, body) {
    if (error) return res.send('error', body, error, response)
    res.send(body);
  });
});

app.get('/repos', function(req, res){
  checkToken(req, res);
  var options = {
    url: 'https://api.github.com/users/' + res.cookie.user + '/repos',
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token ' + res.cookie.token.access_token,
      'json':true
    }
  };
  request.get(options, function (error, response, body) {
    if (error) return res.send('error', body, error, response)
    res.send(body);
  });
});

app.get('/orgs', function(req, res){
  checkToken(req, res);
  var options = {
    url: 'https://api.github.com/users/' + res.cookie.user + '/orgs',
    headers: {
      'User-Agent': 'request',
      'Authorization': 'token ' + res.cookie.token.access_token,
      'json':true
    }
  };
  request.get(options, function (error, response, body) {
    if (error) return res.send('error', body, error, response)
    res.send(body);
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
      'User-Agent': 'request',
      'Authorization': 'token ' + token.access_token,
      'json':true
    }
  };
  request.get(options, function (error, response, body) {
    if (error) return res.send('error', body, error, response)
    serverResponse.cookie.user = JSON.parse(body).login;
  });
  serverResponse.redirect('/');
  //serverResponse.end(JSON.stringify(token))
})

app.listen(3000);
console.log('Server running at http://localhost:3000');