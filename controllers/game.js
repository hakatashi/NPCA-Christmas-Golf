var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var moment = require('moment-timezone');
var User = require('../models/User');
var Submission = require('../models/Submission');
var language = require('../config/language');
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
  Submission.find().sort('-submittedAt').limit(20).exec(function (err, submissions) {
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
        moment: moment,
        title: 'Submissions'
      });
    });
  });
};

/**
 * GET /languages
 * Get valid languages.
 */

exports.getLanguages = function(req, res, next) {
  async.map(Object.keys(language.languages), function (key, done) {
    var lang = language.languages[key];
    Submission.find({language: lang.name, status: true}).sort('-length createdAt').limit(1).exec(function (err, record) {
      if (err) return done(err);

      if (record.length > 0) {
        User.findById(record[0].user, function (err, user) {
          if (err) return done(err);

          done(null, {
            id: key,
            name: lang.name,
            point: lang.point,
            record: record[0].length,
            recordholder: user.profile.name
          });
        });
      } else {
        done(null, {
          id: key,
          name: lang.name,
          point: lang.point,
          record: null,
          recordholder: null
        });
      }
    })
  }, function (err, languages) {
    res.render('languages', {
      languages: languages,
      title: 'Languages'
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
  var now = new Date();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/submit');
  }

  Submission.findOne({url: req.body.url}, function (err, existing) {
    if (existing && existing.user !== req.user.id) {
      req.flash('errors', {msg: 'URL ' + req.body.url + ' is already submitted by other'});
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
  })
};
