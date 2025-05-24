const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['user', 'event', 'post', 'comment', 'review'],
    required: true
  },
  reportedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  description: String,
  evidence: [String],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String
}, { timestamps: true });

// Indexes
reportSchema.index({ reportType: 1, reportedId: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
