var express = require('express');
var app = express();

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
    res.send('Got my token. Click to <a href="/logout">discard</a><br>Token: '+JSON.stringify(res.cookie.token));
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

app.get('/test', function(req, res){
  checkToken(req, res);
  res.send('I\'m in! Using: '+JSON.stringify(res.cookie.token));
});

githubOAuth.on('error', function(err) {
  console.error('there was a login error', err)
})

githubOAuth.on('token', function(token, serverResponse) {
  serverResponse.cookie.token = token;
  serverResponse.redirect('/');
  //serverResponse.end(JSON.stringify(token))
})

app.listen(3000);
console.log('Server running at http://localhost:3000');