var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var moment = require('moment-timezone');
var User = require('../models/User');
var Submission = require('../models/Submission');
var languages = require('../config/language');
var secrets = require('../config/secrets');
var ideone = require('./ideone');

function languageOfName(name) {
  var ret = null;
  Object.keys(languages.languages).forEach(function (key) {
    if (languages.languages[key].name === name) ret = languages.languages[key];
  });
  return ret;
}

function constructRanking(language, done) {
  var ranking = [];
  var rankers = [];
  var record = null;

  Submission.find({language: language, status: true}).sort('length createdAt').exec(function (err, submissions) {
    if (err) return done(err);

    submissions.forEach(function (submission) {
      if (rankers.indexOf(submission.user) === -1) {
        if (rankers.length === 0) {
          record = submission.length;
          ranking.push({
            submission: submission,
            point: languageOfName(language).point + 20
          });
        } else {
          ranking.push({
            submission: submission,
            point: Math.max(languageOfName(language).point - submission.length + record, 0)
          });
        }
        rankers.push(submission.user);
      }
    });

    done(null, ranking);
  });
}

/**
 * GET /scoreboard
 * Scoreboard.
 */

exports.getScoreboard = function(req, res) {
  async.map(languages.languagenames, constructRanking, function (err, rankings) {
    var scores = {};
    rankings.forEach(function (ranking) {
      ranking.forEach(function (rank) {
        scores[rank.submission.user] = scores[rank.submission.user] || 0;
        scores[rank.submission.user] += rank.point;
      });
    });

    var scoreboard = [];

    User.find(function (err, users) {
      users.forEach(function (user) {
        scoreboard.push({
          user: user,
          point: scores[user._id] || 0
        });
      });
      scoreboard.sort(function (a, b) {
        return b.point - a.point;
      });
      res.render('scoreboard', {
        scoreboard: scoreboard,
        title: 'Scoreboard'
      });
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
        user: req.user,
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
  async.map(Object.keys(languages.languages), function (key, done) {
    var lang = languages.languages[key];
    Submission.find({language: lang.name, status: true}).sort('length createdAt').limit(1).exec(function (err, record) {
      if (err) return done(err);

      if (record.length > 0) {
        User.findById(record[0].user, function (err, user) {
          if (err) return done(err);

          done(null, {
            id: key,
            name: lang.name,
            point: lang.point,
            user: req.user,
            record: record[0].length,
            recordholder: user.profile.name
          });
        });
      } else {
        done(null, {
          id: key,
          name: lang.name,
          point: lang.point,
          user: req.user,
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
 * GET /languages/:language
 * Get ranking by language.
 */

exports.getLanguage = function(req, res, next) {
  var language = req.params.language;

  if (!languages.languages[language]) {
    return next();
  }

  constructRanking(languages.languages[language].name, function (err, ranking) {
    if (err) return done(err);

    async.map(ranking, function (rank, done) {
      User.findById(rank.submission.user, function (err, user) {
        if (err) return done(err);

        rank.submission.username = user.profile.name;
        done(null, rank);
      });
    }, function (err, ranking) {
      res.render('language', {
        language: languages.languages[language].name,
        ranking: ranking,
        moment: moment,
        title: 'Ranking for ' + languages.languages[language].name
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
  req.assert('url', 'URL is not valid').matches(/^https?:\/\/ideone.com\/.{6}$/);

  var errors = req.validationErrors();
  var now = new Date();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/submit');
  }

  req.flash('errors', {msg: 'Submission has been desabled'});
  return res.redirect('/submit');

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
