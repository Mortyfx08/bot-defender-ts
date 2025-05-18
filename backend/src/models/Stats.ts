import mongoose from 'mongoose';

const StatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blockedBots: { type: Number, default: 0 },
  scanAttempts: { type: Number, default: 0 },
  lastScan: { type: Date }
});

export default mongoose.model('Stats', StatsSchema);