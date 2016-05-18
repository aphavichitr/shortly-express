var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;

var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(require('morgan')('dev'));
app.use(partials());

// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Sessions
app.use(session({
  name: 'shortly-id',
  secret: 'ssshhhhh',
  saveUninitialized: false,
  resave: true
}));

passport.use(new Strategy({
  consumerKey: 'F0on65Nb67MCh28CGzfuimzU3',
  consumerSecret: '6qxunYIjRZgnVywg1o53VeAcaQvibpiS6Vf7TrxbAScQx7jmRk',
  callbackURL: 'http://127.0.0.1:4568/login/twitter/return'},
  function(token, tokenSecret, profile, cb) {
    //User.findOrCreate({username, profile.id}, function(err, user) {
    console.log('This is the from twitter profile', profile);
    console.log('This is the callback that is being passed in', cb);
    return cb(null, profile);
    //}  
  })
);

app.use(passport.initialize());
app.use(passport.session());


var restrict = function (req, res, next) {
  if (req.session.username || (req.user && req.user.username)) {
    next();
  } else {
    req.session.error = 'Access denied!';
    console.log('Redirecting to Login through Restrict function');
    res.redirect('/login');
  }
};

var createSessionAndRedirect = function(req, res, username) {
  req.session.regenerate(function() {
    //console.log('before request: ', req);
    //console.log('before response: ', res);
    req.session.username = username;
    //console.log('request:',req);
    console.log('response:', res.req.res.req.res.req); 
    res.redirect('/');
  });
};

// NOTE: Might need to serialize


app.get('/', restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', restrict,
function(req, res) {
  console.log("Here is a cookie from the create page", req.session );
  res.render('index');
});

app.route('/links')
  .get(restrict,
    function(req, res) {
      Links.reset().fetch().then(function(links) {
        res.status(200).send(links.models);
      });
    })
  .post(restrict,
    function(req, res) {
      console.log('Got into our links post request function!');
      var uri = req.body.url;

      if (!util.isValidUrl(uri)) {
        console.log('Not a valid url: ', uri);
        return res.sendStatus(404);
      }

      new Link({ url: uri }).fetch().then(function(found) {
        if (found) {
          res.status(200).send(found.attributes);
        } else {
          console.log('Link not found in DB');
          util.getUrlTitle(uri, function(err, title) {
            if (err) {
              console.log('Error reading URL heading: ', err);
              return res.sendStatus(404);
            }

            Links.create({
              url: uri,
              title: title,
              baseUrl: req.headers.origin
            })
            .then(function(newLink) {
              res.status(200).send(newLink);
            });
          });
        }
      });
    });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.route('/login')
  .get(function(req, res) {
    // After they log in, then begin a session
    console.log('redirected from index');
    res.render('login');
  })

  .post(function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    util.checkUsername(username, function(result) {
      var hash = bcrypt.hashSync(password, result.salt);
      util.checkPassword(result, hash, function(result) {
        if (result === 'error') {
          console.log('Redirected to Login after error checking password');
          res.redirect('/login');
        } else {
          createSessionAndRedirect(req, res, username);
        }
      });
    });
  });

app.get('/login/twitter',
  passport.authenticate('twitter'));

app.get('/login/twitter/return', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('twitter login successful');
    // createSessionAndRedirect(req, res, username);
    res.redirect('/');
  });


app.route('/signup')
  .get(function(req, res) {
    res.render('signup');
  })
  .post(function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    // Add username and password to our database
    new User({  
      username: username,
      password: hash,
      salt: salt})
      .save()
      .then(function() {
        console.log('Added to the database!');
        createSessionAndRedirect(req, res, username);       
      });
  });

app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var username = req.session.username || req.user.username; // Might get error.
      // console.log('This is supposed to be userID: ', result);
      var clickObj = {};
      clickObj.linkId = link.get('id');      
      db.knex('users')
        .where('username', '=', username)
        .then(function(result) {
          clickObj.usersId = result[0].id;
          return clickObj;
        })
        .then(function(clickObj) {
          console.log('click obj', clickObj);
          new Click(clickObj)
          .save()
          .then(function(clickPromise) {
            console.log(clickPromise);
            clickPromise.set('visits', clickPromise.get('visits') + 1);
            console.log(clickPromise);
            clickPromise.save();
          });
        })
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
