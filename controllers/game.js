var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var Submission = require('../models/Submission');
var secrets = require('../config/secrets');
var ideone = require('./ideone');

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

exports.getSubmissions = function(req, res, next) {
  Submission.find().sort('-submittedAt').limit(5).exec(function (err, submissions) {
    async.map(submissions, function (submission, done) {
      User.findById(submission.user, function (err, user) {
        if (err) return done(err);

        submission.username = user.profile.name;
        done(null, submission);
      });
    }, function (err, submissions) {
      if (err) return next(err);

      res.render('submissions', {
        submissions: submissions,
        title: 'Submissions'
      });
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
  req.assert('url', 'URL is not valid').matches(/^https?:\/\/ideone.com\/.{6}\/?$/);

  var errors = req.validationErrors();
  var now = new Date();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/submit');
  }

  ideone.submission(req.body.url, function (err, metacode, status, message) {
    if (err) {
      if (err.name === 'ParseError') {
        req.flash('errors', {msg: err.message});
        return res.redirect('/submit');
      } else return done(err);
    }

    var submission = new Submission({
      user: req.user.id,
      createdAt: metacode.time,
      submittedAt: now,
      length: metacode.length,
      language: metacode.language,
      status: status,
      message: message,
      url: req.body.url
    });

    submission.save(function (err) {
      if (err) return next(err);
      res.redirect('/submissions');
    });
  })
};
