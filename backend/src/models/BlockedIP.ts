import { Schema, model, Document } from 'mongoose';

export interface IBlockedIP extends Document {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt?: Date;  // Optional field for automatic unblocking
}

const BlockedIPSchema = new Schema<IBlockedIP>({
  ip: { 
    type: String, 
    required: true,
    unique: true,
    validate: {
      validator: (value: string) => {
        // Basic IPv4 validation
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
      },
      message: (props: any) => `${props.value} is not a valid IPv4 address`
    }
  },
  reason: { 
    type: String, 
    required: true,
    minlength: 5,
    maxlength: 200 
  },
  blockedAt: { 
    type: Date, 
    default: Date.now,
    immutable: true  // Cannot be modified after creation
  },
  expiresAt: {
    type: Date,
    required: false,
    index: { expireAfterSeconds: 0 }  // Automatic document expiration
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Add index for faster queries by IP
BlockedIPSchema.index({ ip: 1 });

// Create the model
const BlockedIP = model<IBlockedIP>('BlockedIP', BlockedIPSchema);

export default BlockedIP;