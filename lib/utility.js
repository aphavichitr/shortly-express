var request = require('request');
var db = require('../app/config');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

// Check Username in DB
exports.checkUsername = function(username, callback) {
  db.knex('users')
    .where('username', '=', username)
    .then(function(result) {
      return callback(result[0]);
    })
    .catch(function(error) {
      console.log(error);
    });
};
// Check if Password matches username's Password
exports.checkPassword = function(userInfoFromDB, suppliedPassword, callback) {
  console.log('Password from DB: ', userInfoFromDB.password);
  console.log('Supplied Password: ', suppliedPassword);
  if (userInfoFromDB.password === suppliedPassword) {
    callback(userInfoFromDB);
  } else {
    console.log('Error at checking password');
    callback('error');
  }
};

// Create session ID
exports.createSession = function() {

};

// Check for session
exports.checkSession = function(req) {
  if (req.session && req.session.user) {

  } 


};

// Respond error message w/ Incorrect Password
exports.sendError = function() {

};

