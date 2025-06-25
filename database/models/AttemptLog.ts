import mongoose from 'mongoose';

const AttemptLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userAgent: { type: String },
  path: { type: String },
  severity: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

export const AttemptLog = mongoose.model('AttemptLog', AttemptLogSchema);