import { Schema, model, Document } from 'mongoose';

export interface IStoreSettings extends Document {
  shop: string;
  autoBlock: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

const StoreSettingsSchema = new Schema<IStoreSettings>({
  shop: { type: String, required: true, unique: true },
  autoBlock: { type: Boolean, default: true },
  sensitivity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});

export default model<IStoreSettings>('StoreSettings', StoreSettingsSchema);