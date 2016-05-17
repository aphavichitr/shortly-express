var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true
});

module.exports = User;

// app.use(checkSession);

// req.session to access session
// req.sessionID to get session id
// req.session.cookie to get cookie
// session.save() to save the session back to store
// session.destroy() to destroy session
// session.regenerate()

