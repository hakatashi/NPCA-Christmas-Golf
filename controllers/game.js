var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');

/**
 * GET /scoreboard
 * Scoreboard.
 */

exports.getScoreboard = function(req, res) {
  User.find(function (err, users) {
    res.render('scoreboard', {
      users: users,
      title: 'Scoreboard'
    });
  });
};
