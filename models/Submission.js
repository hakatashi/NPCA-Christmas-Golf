var mongoose = require('mongoose');

var submissionSchema = new mongoose.Schema({
  user: String,
  createdAt: Date,
  submittedAt: Date,
  length: Number,
  language: String,
  status: Boolean,
  message: String,
  url: String
});

module.exports = mongoose.model('Submission', submissionSchema);
