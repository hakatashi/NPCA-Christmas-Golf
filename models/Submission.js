var mongoose = require('mongoose');

var submissionSchema = new mongoose.Schema({
  user: String,
  time: Date,
  length: Number,
  language: Number,
  status: Number,
  message: String,
  url: String
});

module.exports = mongoose.model('Submission', submissionSchema);
