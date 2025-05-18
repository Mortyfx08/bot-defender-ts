import { Schema, model, Document } from 'mongoose';

// Define a type for the attack types to ensure type safety
export type AttackType = 'brute-force' | 'scanner' | 'credential-stuffing';

export interface IAttemptLog extends Document {
  ip: string;
  type: AttackType;
  timestamp: Date;
  userAgent?: string;  // Added optional field if you need it later
}

const AttemptLogSchema = new Schema<IAttemptLog>({
  ip: { 
    type: String, 
    required: true,
    validate: {
      validator: (value: string) => {
        // Simple IP validation regex (IPv4)
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
      },
      message: (props: any) => `${props.value} is not a valid IP address!`
    }
  },
  type: { 
    type: String, 
    enum: ['brute-force', 'scanner', 'credential-stuffing'], 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true  // Add index for faster querying by timestamp
  },
  // Optional field for user agent if needed
  userAgent: {
    type: String,
    required: false
  }
}, {
  // Add createdAt and updatedAt timestamps
  timestamps: true
});

// Add index for IP field for faster queries
AttemptLogSchema.index({ ip: 1 });

// Create the model
const AttemptLog = model<IAttemptLog>('AttemptLog', AttemptLogSchema);

export default AttemptLog;