var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var LinkUser = db.Model.extend({
  tableName: 'linkuser',
  defaults: {
    visits: 0
  }
});

module.exports = LinkUser;
