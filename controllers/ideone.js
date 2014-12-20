var cheerio = require('cheerio');
var async = require('async');
var request = require('request');
var moment = require('moment-timezone');

var language = require('../config/language');

function ParseError(message) {
  this.name = 'ParseError';
  this.message = message;
}
ParseError.prototype = Error.prototype;

function ValidationError(message) {
  this.name = 'ValidationError';
  this.message = message;
}
ValidationError.prototype = Error.prototype;

function fetch(url, done) {
  async.waterfall([
    function (done) {
      request(url, done);
    },
    function (res, body, done) {
      if (res.statusCode !== 200) {
        return done(new ParseError('Server responded with status code ' + res.statusCode));
      }

      var $ = cheerio.load(body);
      var sourceBuffer = new Buffer($('#source-text').text(), 'base64');

      var metacode = {};

      metacode.source = sourceBuffer.toString('utf8');
      metacode.length = sourceBuffer.length;
      metacode.stdin = new Buffer($('#stdin-text').text(), 'base64').toString('utf8');
      metacode.stdout = $('#output-text').text();

      if (!(metacode.language = $('#info > .row').eq(0).children('.span3').eq(0).children('strong').text())) {
        return done(new ParseError('Language couldn\'t be recognized'));
      }

      if (!(metacode.timeText = $('#info > .row').eq(1).children('.span3').eq(0).children('span').attr('title'))) {
        return done(new ParseError('Date created couldn\'t be recognized'));
      }

      var timezone = metacode.timeText.split(' ')[2];

      if (!(metacode.time = moment.tz(metacode.timeText, 'HH:mm:ss YYYY-MM-DD', timezone).toDate())) {
        return done(new ParseError('Invalid date'));
      }

      return done(null, metacode);
    }
  ], done);
}

exports.fetch = fetch;

// code validator for this golf

function validate(metacode) {
  if (language.languagenames.indexOf(metacode.language) === -1) {
    return new ValidationError('Languege ' + metacode.language + ' is not supported');
  }

  if (metacode.stdout.search('2015') === -1) {
    return new ValidationError('Output doesn\'t contain 2015');
  }

  if (metacode.source.search(/\d/) !== -1) {
    return new ValidationError('Source code contains digit');
  }

  if (metacode.stdin.length !== 0) {
    return new ValidationError('Input must be empty');
  }

  return null;
}

exports.submission = function (url, done) {
  async.waterfall([
    fetch.bind(this, url),
    function (metacode, done) {
      var validationError = validate(metacode);
      if (validationError) {
        return done(null, metacode, false, validationError.message);
      } else {
        return done(null, metacode, true, 'Everything is OK.');
      }
    }
  ], done);
};
