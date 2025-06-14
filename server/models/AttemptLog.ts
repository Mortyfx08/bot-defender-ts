import mongoose from 'mongoose';

const attemptLogSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['blocked', 'allowed', 'false_positive'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
});

const AttemptLog = mongoose.model('AttemptLog', attemptLogSchema);

export default AttemptLog; 