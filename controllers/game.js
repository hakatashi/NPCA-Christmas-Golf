var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var Submission = require('../models/Submission');
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

/**
 * GET /submissions
 * Get latest submissions.
 */

exports.getSubmissions = function(req, res) {
  Submission.find().sort('-time').limit(5).exec(function (err, submissions) {
    res.render('submissions', {
      submissions: submissions,
      title: 'Submissions'
    });
  });
};

/**
 * GET /submit
 * Get submit page.
 */

exports.getSubmit = function(req, res) {
  res.render('submit', {
    title: 'Submit'
  });
};

/**
 * POST /submit
 * Submit code.
 */

exports.postSubmit = function(req, res, next) {
  req.assert('url', 'URL is not valid').matches(/^https?:\/\/ideone.com\/.{6}$/);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/submit');
  }

  var submission = new Submission({
    user: req.user._id,
    time: new Date(),
    length: 334,
    language: 0,
    status: 0,
    message: 'Subission Accepted.',
    url: req.body.url
  });

  submission.save(function (err) {
    if (err) return next(err);
    res.redirect('/submissions');
  });
};
