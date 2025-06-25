import mongoose from 'mongoose';

const BlockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  shop: { type: String },
  reason: { type: String },
  blockedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

export const BlockedIP = mongoose.model('BlockedIP', BlockedIPSchema);