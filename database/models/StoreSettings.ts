import mongoose from 'mongoose';

const StoreSettingsSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  settings: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});

export const StoreSettings = mongoose.model('StoreSettings', StoreSettingsSchema);